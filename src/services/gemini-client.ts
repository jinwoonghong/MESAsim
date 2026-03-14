import type { Agent } from "@/types/agent";
import type {
  GeminiAgentProfile,
  GeminiConversation,
  GeminiDecision,
  GeminiResponse,
} from "@/types/gemini";
import { geminiCache } from "./gemini-cache";
import {
  buildAgentGenerationPrompt,
  buildConversationPrompt,
  buildDecisionPrompt,
} from "./gemini-prompts";

// ---------------------------------------------------------------------------
// GeminiClient - calls the /api/ai proxy from the browser
// ---------------------------------------------------------------------------

export class GeminiClient {
  private readonly endpoint = "/api/ai";

  /**
   * Internal helper: POST to the API proxy and return the typed response.
   */
  private async post<T>(
    type: "generate_agent" | "decide_action" | "conversation",
    context: Record<string, unknown>,
  ): Promise<GeminiResponse<T>> {
    // Check cache first
    const cacheKey = geminiCache.generateKey(type, context);
    const cached = geminiCache.get<T>(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    try {
      const res = await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, context }),
      });

      if (!res.ok) {
        const errorBody = (await res.json().catch(() => null)) as Record<
          string,
          unknown
        > | null;
        const message =
          typeof errorBody?.error === "string"
            ? errorBody.error
            : `API error: ${res.status}`;
        return { success: false, error: message, cached: false };
      }

      const json = (await res.json()) as GeminiResponse<T>;

      // Store successful responses in cache
      if (json.success) {
        geminiCache.set(cacheKey, json);
      }

      return { ...json, cached: false };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Network request failed";
      return { success: false, error: message, cached: false };
    }
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Generate a new agent profile for the given city context.
   */
  async generateAgent(
    cityContext: string,
  ): Promise<GeminiResponse<GeminiAgentProfile>> {
    const { system, user } = buildAgentGenerationPrompt(cityContext);
    return this.post<GeminiAgentProfile>("generate_agent", {
      prompt: `${system}\n\n${user}`,
      cityContext,
    });
  }

  /**
   * Decide the next action for an agent given nearby context.
   */
  async decideAction(
    agent: Agent,
    nearbyAgents: Agent[],
    nearbyBuildings: string[],
  ): Promise<GeminiResponse<GeminiDecision>> {
    const now = new Date();
    const currentTime = { hour: now.getHours(), minute: now.getMinutes() };
    const { system, user } = buildDecisionPrompt(
      agent,
      nearbyAgents,
      nearbyBuildings,
      currentTime,
    );
    return this.post<GeminiDecision>("decide_action", {
      prompt: `${system}\n\n${user}`,
      agentId: agent.id,
    });
  }

  /**
   * Generate a conversation between two agents.
   */
  async generateConversation(
    agentA: Agent,
    agentB: Agent,
    topic?: string,
  ): Promise<GeminiResponse<GeminiConversation>> {
    const { system, user } = buildConversationPrompt(agentA, agentB, topic);
    return this.post<GeminiConversation>("conversation", {
      prompt: `${system}\n\n${user}`,
      agentAId: agentA.id,
      agentBId: agentB.id,
      topic: topic ?? "",
    });
  }
}

// Singleton export
export const geminiClient = new GeminiClient();

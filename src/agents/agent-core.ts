import type { Agent, AgentState, AgentPersonality } from "@/types/agent";
import type { GeminiAgentProfile } from "@/types/gemini";

let agentCounter = 0;

// @MX:ANCHOR: Creates a new Agent from a Gemini-generated profile -- entry point for agent lifecycle.
// @MX:REASON: High fan_in from agent-generation, agent-home, and external spawn calls.
export function createAgent(
  profile: GeminiAgentProfile,
  homeBuilding: string | null,
  startPos: { x: number; y: number; z: number },
): Agent {
  agentCounter += 1;

  const personality: AgentPersonality = {
    openness: profile.personality.openness,
    conscientiousness: profile.personality.conscientiousness,
    extraversion: profile.personality.extraversion,
    agreeableness: profile.personality.agreeableness,
    neuroticism: profile.personality.neuroticism,
  };

  return {
    id: `agent-${agentCounter}-${Date.now()}`,
    name: profile.name,
    personality,
    occupation: profile.occupation,
    position: { ...startPos },
    destination: null,
    currentPath: [],
    pathIndex: 0,
    state: "idle",
    homeBuilding,
    memory: [],
    relationships: {},
    dailyRoutine: profile.dailyRoutine.map((entry) => ({
      time: entry.time,
      activity: entry.activity,
    })),
    speed: 1.5,
    lastDecisionTime: 0,
  };
}

export function updateAgentState(agent: Agent, newState: AgentState): Agent {
  return {
    ...agent,
    state: newState,
  };
}

export function isAgentActive(agent: Agent): boolean {
  return agent.state !== "sleeping";
}

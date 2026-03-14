import type { Agent } from "@/types/agent";

// ---------------------------------------------------------------------------
// Prompt pair returned by each builder
// ---------------------------------------------------------------------------

export interface PromptPair {
  system: string;
  user: string;
}

// ---------------------------------------------------------------------------
// 1. Agent generation prompt
// ---------------------------------------------------------------------------

export function buildAgentGenerationPrompt(cityContext: string): PromptPair {
  const system =
    "You are a character designer for a Korean city life simulation. " +
    "You create unique, believable characters with Korean names, " +
    "distinct OCEAN personality traits (each 0-1), an occupation, " +
    "a daily routine, and a short backstory. " +
    "Respond ONLY with valid JSON. No markdown fences, no explanation.";

  const user =
    `The city context is:\n${cityContext}\n\n` +
    "Generate a unique character for this city. " +
    "Return JSON with this exact schema:\n" +
    "{\n" +
    '  "name": "<Korean name>",\n' +
    '  "personality": {\n' +
    '    "openness": <0-1>,\n' +
    '    "conscientiousness": <0-1>,\n' +
    '    "extraversion": <0-1>,\n' +
    '    "agreeableness": <0-1>,\n' +
    '    "neuroticism": <0-1>\n' +
    "  },\n" +
    '  "occupation": "<occupation>",\n' +
    '  "dailyRoutine": [\n' +
    '    { "time": <hour 0-23>, "activity": "<activity>" }\n' +
    "  ],\n" +
    '  "backstory": "<1-2 sentence backstory>"\n' +
    "}";

  return { system, user };
}

// ---------------------------------------------------------------------------
// 2. Action decision prompt
// ---------------------------------------------------------------------------

export function buildDecisionPrompt(
  agent: Agent,
  nearbyAgents: Agent[],
  nearbyBuildings: string[],
  currentTime: { hour: number; minute: number },
): PromptPair {
  const system =
    "You are the AI mind of a character in a city simulation. " +
    "Based on the character's personality, current state, nearby context, " +
    "and time of day, decide what action to take next. " +
    "Respond ONLY with valid JSON. No markdown fences, no explanation.";

  const recentMemories = agent.memory
    .slice(-5)
    .map((m) => `- [${m.type}] ${m.summary}`)
    .join("\n");

  const nearbyAgentDescriptions = nearbyAgents
    .map(
      (a) =>
        `${a.name} (${a.occupation}, ${a.state})` +
        (agent.relationships[a.id] !== undefined
          ? ` [relationship: ${agent.relationships[a.id]}]`
          : ""),
    )
    .join(", ");

  const user =
    `Current time: ${String(currentTime.hour).padStart(2, "0")}:${String(currentTime.minute).padStart(2, "0")}\n\n` +
    `Character: ${agent.name}\n` +
    `Occupation: ${agent.occupation}\n` +
    `State: ${agent.state}\n` +
    `Personality: O=${agent.personality.openness} C=${agent.personality.conscientiousness} ` +
    `E=${agent.personality.extraversion} A=${agent.personality.agreeableness} N=${agent.personality.neuroticism}\n\n` +
    `Nearby people: ${nearbyAgentDescriptions || "none"}\n` +
    `Nearby buildings: ${nearbyBuildings.length > 0 ? nearbyBuildings.join(", ") : "none"}\n\n` +
    `Recent memories:\n${recentMemories || "none"}\n\n` +
    "Decide the next action. Return JSON with this exact schema:\n" +
    "{\n" +
    '  "action": "move" | "interact" | "idle" | "go_home",\n' +
    '  "destination": "<optional building or location name>",\n' +
    '  "reason": "<brief reason for this decision>"\n' +
    "}";

  return { system, user };
}

// ---------------------------------------------------------------------------
// 3. Conversation prompt
// ---------------------------------------------------------------------------

export function buildConversationPrompt(
  agentA: Agent,
  agentB: Agent,
  topic?: string,
): PromptPair {
  const system =
    "You generate realistic Korean conversations between two simulation characters. " +
    "The conversation should reflect each character's personality and relationship. " +
    "Respond ONLY with valid JSON. No markdown fences, no explanation.";

  const relationshipScore = agentA.relationships[agentB.id];
  const relationshipDesc =
    relationshipScore !== undefined
      ? `Relationship score: ${relationshipScore} (-1 hostile to 1 friendly)`
      : "They do not know each other yet.";

  const user =
    `Character A: ${agentA.name} (${agentA.occupation})\n` +
    `Personality: O=${agentA.personality.openness} C=${agentA.personality.conscientiousness} ` +
    `E=${agentA.personality.extraversion} A=${agentA.personality.agreeableness} N=${agentA.personality.neuroticism}\n\n` +
    `Character B: ${agentB.name} (${agentB.occupation})\n` +
    `Personality: O=${agentB.personality.openness} C=${agentB.personality.conscientiousness} ` +
    `E=${agentB.personality.extraversion} A=${agentB.personality.agreeableness} N=${agentB.personality.neuroticism}\n\n` +
    `${relationshipDesc}\n` +
    (topic ? `Topic: ${topic}\n` : "") +
    "\nGenerate a short conversation (3-6 lines). Return JSON with this exact schema:\n" +
    "{\n" +
    '  "dialogue": [\n' +
    '    { "speaker": "<name>", "text": "<dialogue line>" }\n' +
    "  ],\n" +
    '  "summary": "<1-sentence summary of the conversation>",\n' +
    '  "mood": "positive" | "neutral" | "negative"\n' +
    "}";

  return { system, user };
}

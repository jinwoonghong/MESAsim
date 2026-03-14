import type { Agent, AgentMemory } from "@/types/agent";
import { distance3D } from "@/lib/math";

export function checkInteractions(
  agents: Agent[],
  interactionRange: number,
): [string, string][] {
  const pairs: [string, string][] = [];
  const rangeSq = interactionRange * interactionRange;

  for (let i = 0; i < agents.length; i++) {
    const a = agents[i];
    if (a.state === "interacting" || a.state === "sleeping") continue;

    for (let j = i + 1; j < agents.length; j++) {
      const b = agents[j];
      if (b.state === "interacting" || b.state === "sleeping") continue;

      const dx = a.position.x - b.position.x;
      const dy = a.position.y - b.position.y;
      const dz = a.position.z - b.position.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq <= rangeSq) {
        pairs.push([a.id, b.id]);
      }
    }
  }

  return pairs;
}

export function startInteraction(
  agentA: Agent,
  agentB: Agent,
): { agentA: Agent; agentB: Agent } {
  return {
    agentA: { ...agentA, state: "interacting" },
    agentB: { ...agentB, state: "interacting" },
  };
}

export function endInteraction(
  agentA: Agent,
  agentB: Agent,
  summary: string,
): { agentA: Agent; agentB: Agent } {
  const timestamp = Date.now();

  const memoryA: AgentMemory = {
    id: `mem-${agentA.id}-${timestamp}`,
    timestamp,
    type: "interaction",
    summary,
    involvedAgents: [agentB.id],
  };

  const memoryB: AgentMemory = {
    id: `mem-${agentB.id}-${timestamp}`,
    timestamp,
    type: "interaction",
    summary,
    involvedAgents: [agentA.id],
  };

  const mood = summary.toLowerCase();
  const isPositive =
    mood.includes("positive") ||
    mood.includes("friendly") ||
    mood.includes("good") ||
    mood.includes("happy");
  const scoreChange = isPositive ? 0.1 : -0.05;

  const updatedRelationshipsA = {
    ...agentA.relationships,
    [agentB.id]: (agentA.relationships[agentB.id] ?? 0) + scoreChange,
  };

  const updatedRelationshipsB = {
    ...agentB.relationships,
    [agentA.id]: (agentB.relationships[agentA.id] ?? 0) + scoreChange,
  };

  return {
    agentA: {
      ...agentA,
      state: "idle",
      memory: [...agentA.memory, memoryA],
      relationships: updatedRelationshipsA,
    },
    agentB: {
      ...agentB,
      state: "idle",
      memory: [...agentB.memory, memoryB],
      relationships: updatedRelationshipsB,
    },
  };
}

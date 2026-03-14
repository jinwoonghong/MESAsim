import type { Agent, AgentMemory } from "@/types/agent";

const MAX_MEMORIES = 50;

export function addMemory(
  agent: Agent,
  memory: Omit<AgentMemory, "id" | "timestamp">,
): Agent {
  const timestamp = Date.now();
  const newMemory: AgentMemory = {
    ...memory,
    id: `mem-${agent.id}-${timestamp}`,
    timestamp,
  };

  let updatedMemories = [...agent.memory, newMemory];

  if (updatedMemories.length > MAX_MEMORIES) {
    // Sort by timestamp ascending and remove oldest
    updatedMemories = updatedMemories
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(updatedMemories.length - MAX_MEMORIES);
  }

  return {
    ...agent,
    memory: updatedMemories,
  };
}

export function getRecentMemories(
  agent: Agent,
  count: number,
): AgentMemory[] {
  const sorted = [...agent.memory].sort(
    (a, b) => b.timestamp - a.timestamp,
  );
  return sorted.slice(0, count);
}

export function getMemoriesWith(
  agent: Agent,
  otherAgentId: string,
): AgentMemory[] {
  return agent.memory.filter((m) =>
    m.involvedAgents.includes(otherAgentId),
  );
}

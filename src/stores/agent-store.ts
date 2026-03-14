import { create } from "zustand";
import type { Agent } from "@/types/agent";

interface AgentState {
  agents: Map<string, Agent>;
  selectedAgentId: string | null;

  addAgent: (agent: Agent) => void;
  removeAgent: (id: string) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  selectAgent: (id: string | null) => void;
  getAgentById: (id: string) => Agent | undefined;
  getAgentsNear: (
    position: { x: number; y: number; z: number },
    range: number
  ) => Agent[];
}

export const useAgentStore = create<AgentState>()((set, get) => ({
  agents: new Map<string, Agent>(),
  selectedAgentId: null,

  addAgent: (agent: Agent): void => {
    set((state) => {
      const next = new Map(state.agents);
      next.set(agent.id, agent);
      return { agents: next };
    });
  },

  removeAgent: (id: string): void => {
    set((state) => {
      const next = new Map(state.agents);
      next.delete(id);
      return {
        agents: next,
        selectedAgentId: state.selectedAgentId === id ? null : state.selectedAgentId,
      };
    });
  },

  updateAgent: (id: string, updates: Partial<Agent>): void => {
    set((state) => {
      const existing = state.agents.get(id);
      if (!existing) return state;

      const next = new Map(state.agents);
      next.set(id, { ...existing, ...updates });
      return { agents: next };
    });
  },

  selectAgent: (id: string | null): void => {
    set({ selectedAgentId: id });
  },

  getAgentById: (id: string): Agent | undefined => {
    return get().agents.get(id);
  },

  getAgentsNear: (
    position: { x: number; y: number; z: number },
    range: number
  ): Agent[] => {
    const agents = get().agents;
    const rangeSq = range * range;
    const result: Agent[] = [];

    for (const agent of agents.values()) {
      const dx = agent.position.x - position.x;
      const dy = agent.position.y - position.y;
      const dz = agent.position.z - position.z;
      if (dx * dx + dy * dy + dz * dz <= rangeSq) {
        result.push(agent);
      }
    }

    return result;
  },
}));

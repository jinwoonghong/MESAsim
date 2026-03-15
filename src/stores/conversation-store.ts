import { create } from "zustand";

export interface ActiveConversation {
  id: string; // interaction key like "agent1-agent2"
  agentIds: [string, string];
  dialogue: { speaker: string; text: string }[];
  mood: "positive" | "neutral" | "negative";
  summary: string;
  startedAt: number;
  endedAt: number | null; // set when interaction ends, used for fade-out timing
}

interface ConversationState {
  conversations: Map<string, ActiveConversation>;

  startConversation: (id: string, agentIds: [string, string]) => void;
  updateConversation: (
    id: string,
    dialogue: { speaker: string; text: string }[],
    mood: "positive" | "neutral" | "negative",
    summary: string
  ) => void;
  endConversation: (id: string) => void;
  removeConversation: (id: string) => void;
  getActiveConversations: () => ActiveConversation[];
}

export const useConversationStore = create<ConversationState>()((set, get) => ({
  conversations: new Map<string, ActiveConversation>(),

  startConversation: (id: string, agentIds: [string, string]): void => {
    set((state) => {
      const next = new Map(state.conversations);
      next.set(id, {
        id,
        agentIds,
        dialogue: [],
        mood: "neutral",
        summary: "",
        startedAt: Date.now(),
        endedAt: null,
      });
      return { conversations: next };
    });
  },

  updateConversation: (
    id: string,
    dialogue: { speaker: string; text: string }[],
    mood: "positive" | "neutral" | "negative",
    summary: string
  ): void => {
    set((state) => {
      const existing = state.conversations.get(id);
      if (!existing) return state;

      const next = new Map(state.conversations);
      next.set(id, {
        ...existing,
        dialogue,
        mood,
        summary,
      });
      return { conversations: next };
    });
  },

  endConversation: (id: string): void => {
    set((state) => {
      const existing = state.conversations.get(id);
      if (!existing) return state;

      const next = new Map(state.conversations);
      next.set(id, {
        ...existing,
        endedAt: Date.now(),
      });
      return { conversations: next };
    });
  },

  removeConversation: (id: string): void => {
    set((state) => {
      const next = new Map(state.conversations);
      next.delete(id);
      return { conversations: next };
    });
  },

  getActiveConversations: (): ActiveConversation[] => {
    return Array.from(get().conversations.values());
  },
}));

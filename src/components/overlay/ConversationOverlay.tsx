"use client";

import { useEffect, useRef } from "react";
import { useConversationStore } from "@/stores/conversation-store";
import { useAgentStore } from "@/stores/agent-store";
import { useUIStore } from "@/stores/ui-store";
import AgentBubble from "./AgentBubble";

// Delay before removing ended conversations (REQ-OVL-024)
const REMOVAL_DELAY_MS = 2000;
// Cleanup interval frequency
const CLEANUP_INTERVAL_MS = 500;

/**
 * Manager component rendering active AgentBubble instances inside R3F scene.
 * Reads from conversationStore and conditionally renders based on uiStore.showBubbles.
 * Handles cleanup of ended conversations after fade-out delay (REQ-OVL-024).
 * Supports multiple simultaneous conversations (REQ-OVL-027).
 */
export default function ConversationOverlay(): React.JSX.Element | null {
  const showBubbles = useUIStore((s) => s.showBubbles);
  const conversations = useConversationStore((s) => s.conversations);
  const removeConversation = useConversationStore((s) => s.removeConversation);
  const agents = useAgentStore((s) => s.agents);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Periodic cleanup of ended conversations (REQ-OVL-024)
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const all = useConversationStore.getState().conversations;
      for (const [id, conv] of all) {
        if (conv.endedAt !== null && now - conv.endedAt >= REMOVAL_DELAY_MS) {
          removeConversation(id);
        }
      }
    }, CLEANUP_INTERVAL_MS);

    return (): void => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [removeConversation]);

  // Toggle via showBubbles (REQ-OVL-025)
  if (!showBubbles) return null;

  const conversationList = Array.from(conversations.values());

  return (
    <>
      {conversationList.map((conv) => {
        const agentA = agents.get(conv.agentIds[0]);
        const agentB = agents.get(conv.agentIds[1]);

        // Skip if either agent is missing from the store
        if (!agentA || !agentB) return null;

        return (
          <AgentBubble
            key={conv.id}
            conversation={conv}
            agentPositions={[agentA.position, agentB.position]}
          />
        );
      })}
    </>
  );
}

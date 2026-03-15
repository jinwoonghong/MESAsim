"use client";

import { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { ActiveConversation } from "@/stores/conversation-store";

// Distance threshold for hiding bubbles (REQ-OVL-026)
const CAMERA_DISTANCE_THRESHOLD = 150;

// Mood color mapping (REQ-OVL-030)
const MOOD_COLORS: Record<ActiveConversation["mood"], string> = {
  positive: "#22c55e",
  neutral: "#6b7280",
  negative: "#ef4444",
};

interface AgentBubbleProps {
  conversation: ActiveConversation;
  agentPositions: [
    { x: number; y: number; z: number },
    { x: number; y: number; z: number },
  ];
}

/**
 * Single conversation bubble rendered in 3D space using drei Html.
 * Positioned at midpoint between two interacting agents (REQ-OVL-022).
 * Fades out when conversation ends (REQ-OVL-024).
 * Hides when camera is too far (REQ-OVL-026).
 */
export default function AgentBubble({
  conversation,
  agentPositions,
}: AgentBubbleProps): React.JSX.Element | null {
  const { camera } = useThree();
  const [visible, setVisible] = useState(true);
  const midpointRef = useRef(new THREE.Vector3());

  // Calculate midpoint between two agents + vertical offset
  const [posA, posB] = agentPositions;
  const midX = (posA.x + posB.x) / 2;
  const midY = (posA.y + posB.y) / 2 + 3; // Offset above agents
  const midZ = (posA.z + posB.z) / 2;

  // Per-frame camera distance check (REQ-OVL-026)
  useFrame(() => {
    midpointRef.current.set(midX, midY, midZ);
    const distance = camera.position.distanceTo(midpointRef.current);
    setVisible(distance <= CAMERA_DISTANCE_THRESHOLD);
  });

  if (!visible) return null;

  // Get the latest dialogue line (REQ-OVL-021)
  const lastDialogue =
    conversation.dialogue.length > 0
      ? conversation.dialogue[conversation.dialogue.length - 1]
      : null;

  // Determine fade state (REQ-OVL-024)
  const isEnding = conversation.endedAt !== null;
  const moodColor = MOOD_COLORS[conversation.mood];

  return (
    <group position={[midX, midY, midZ]}>
      <Html
        center
        distanceFactor={15}
        style={{
          pointerEvents: "none",
          transition: "opacity 1.5s ease-out",
          opacity: isEnding ? 0 : 1,
        }}
      >
        <div
          className="relative max-w-[220px] rounded-lg px-3 py-2 shadow-lg"
          style={{
            backgroundColor: "rgba(17, 24, 39, 0.85)",
            borderLeft: `3px solid ${moodColor}`,
          }}
        >
          {/* Speaker name and dialogue (REQ-OVL-020, REQ-OVL-021) */}
          {lastDialogue ? (
            <>
              <p
                className="mb-0.5 text-[10px] font-semibold"
                style={{ color: moodColor }}
              >
                {lastDialogue.speaker}
              </p>
              <p className="text-[11px] leading-tight text-white/90">
                {lastDialogue.text.length > 80
                  ? `${lastDialogue.text.slice(0, 80)}...`
                  : lastDialogue.text}
              </p>
            </>
          ) : (
            <p className="text-[11px] italic text-white/50">...</p>
          )}

          {/* Tail arrow pointing down */}
          <div
            className="absolute -bottom-1.5 left-1/2 h-0 w-0 -translate-x-1/2"
            style={{
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "6px solid rgba(17, 24, 39, 0.85)",
            }}
          />
        </div>
      </Html>
    </group>
  );
}

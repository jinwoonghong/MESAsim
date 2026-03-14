"use client";

import { useMemo } from "react";
import { Html } from "@react-three/drei";
import { useAgentStore } from "@/stores";
import type { Agent, AgentState } from "@/types";

const STATE_COLORS: Record<AgentState, string> = {
  idle: "#4CAF50",
  moving: "#2196F3",
  interacting: "#FF9800",
  sleeping: "#9E9E9E",
};

function AgentMesh({
  agent,
  isSelected,
  onSelect,
}: {
  agent: Agent;
  isSelected: boolean;
  onSelect: () => void;
}): React.JSX.Element {
  const color = useMemo(() => STATE_COLORS[agent.state], [agent.state]);

  return (
    <group position={[agent.position.x, 0, agent.position.z]}>
      {/* Agent body as cylinder */}
      <mesh
        position={[0, 0.9, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <cylinderGeometry args={[0.3, 0.3, 1.8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={isSelected ? color : "#000000"}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </mesh>

      {/* Agent head as sphere */}
      <mesh position={[0, 2.0, 0]}>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Name label */}
      <Html
        position={[0, 2.8, 0]}
        center
        distanceFactor={15}
        style={{ pointerEvents: "none" }}
      >
        <div
          className="whitespace-nowrap rounded bg-black/70 px-1.5 py-0.5 text-xs text-white"
        >
          {agent.name}
        </div>
      </Html>

      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1.0, 16]} />
          <meshBasicMaterial color="#FFD700" transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
}

export default function AgentRenderer(): React.JSX.Element {
  const agents = useAgentStore((s) => s.agents);
  const selectedAgentId = useAgentStore((s) => s.selectedAgentId);
  const selectAgent = useAgentStore((s) => s.selectAgent);

  const agentList = useMemo(() => Array.from(agents.values()), [agents]);

  return (
    <group>
      {agentList.map((agent: Agent) => (
        <AgentMesh
          key={agent.id}
          agent={agent}
          isSelected={agent.id === selectedAgentId}
          onSelect={() => selectAgent(agent.id)}
        />
      ))}
    </group>
  );
}

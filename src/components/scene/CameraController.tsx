"use client";

import { useRef, useEffect } from "react";
import { OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useAgentStore } from "@/stores";
import * as THREE from "three";

export default function CameraController(): React.JSX.Element {
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const selectedAgentId = useAgentStore((s) => s.selectedAgentId);
  const agents = useAgentStore((s) => s.agents);

  const targetPosition = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (!selectedAgentId) return;
    const agent = agents.get(selectedAgentId);
    if (agent) {
      targetPosition.current.set(
        agent.position.x,
        agent.position.y,
        agent.position.z
      );
    }
  }, [selectedAgentId, agents]);

  useFrame(() => {
    if (!selectedAgentId || !controlsRef.current) return;

    const agent = agents.get(selectedAgentId);
    if (!agent) return;

    targetPosition.current.set(
      agent.position.x,
      agent.position.y,
      agent.position.z
    );

    const controls = controlsRef.current;
    const currentTarget = controls.target as THREE.Vector3;
    currentTarget.lerp(targetPosition.current, 0.05);
    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.1}
      minDistance={10}
      maxDistance={500}
      minPolarAngle={0.1}
      maxPolarAngle={Math.PI / 2 - 0.05}
    />
  );
}

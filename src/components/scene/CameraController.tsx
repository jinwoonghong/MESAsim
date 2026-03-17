"use client";

import { useRef, useEffect, useMemo } from "react";
import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useAgentStore, useUIStore } from "@/stores";
import * as THREE from "three";

// Preset camera positions
const CAMERA_PRESETS = {
  "top-down": { position: new THREE.Vector3(0, 200, 0), lookAt: new THREE.Vector3(0, 0, 0) },
  isometric: { position: new THREE.Vector3(100, 100, 100), lookAt: new THREE.Vector3(0, 0, 0) },
  "street-level": { position: new THREE.Vector3(5, 5, 20), lookAt: new THREE.Vector3(0, 0, 0) },
} as const;

export default function CameraController(): React.JSX.Element {
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const selectedAgentId = useAgentStore((s) => s.selectedAgentId);
  const agents = useAgentStore((s) => s.agents);

  const cameraPreset = useUIStore((s) => s.cameraPreset);
  const followAgent = useUIStore((s) => s.followAgent);
  const orbitSpeed = useUIStore((s) => s.orbitSpeed);
  const dampingFactor = useUIStore((s) => s.dampingFactor);
  const fov = useUIStore((s) => s.fov);
  const minZoom = useUIStore((s) => s.minZoom);
  const maxZoom = useUIStore((s) => s.maxZoom);

  const cameraTarget = useUIStore((s) => s.cameraTarget);
  const setCameraTarget = useUIStore((s) => s.setCameraTarget);

  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(0, 0, 0));
  const previousPreset = useRef(cameraPreset);

  // Update FOV when it changes
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, fov]);

  // Animate to preset position when preset changes
  useEffect(() => {
    if (cameraPreset === "custom" || cameraPreset === previousPreset.current) return;
    previousPreset.current = cameraPreset;

    const preset = CAMERA_PRESETS[cameraPreset];
    if (!preset) return;

    // Animate camera position
    const startPos = camera.position.clone();
    const endPos = preset.position.clone();
    const startTime = performance.now();
    const duration = 800; // ms

    function animate(): void {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);

      camera.position.lerpVectors(startPos, endPos, eased);

      if (controlsRef.current) {
        const controls = controlsRef.current;
        const currentTarget = controls.target as THREE.Vector3;
        currentTarget.lerp(preset.lookAt, eased);
        controls.update();
      }

      if (t < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [cameraPreset, camera]);

  // Animate camera to selected agent position (one-shot)
  useEffect(() => {
    if (!cameraTarget || !controlsRef.current) return;

    const endTarget = new THREE.Vector3(cameraTarget.x, cameraTarget.y, cameraTarget.z);
    const controls = controlsRef.current;
    const startTarget = (controls.target as THREE.Vector3).clone();
    const startPos = camera.position.clone();

    // Compute end position: offset from target maintaining current camera distance and angle
    const offset = startPos.clone().sub(startTarget);
    const distance = Math.min(offset.length(), 80);
    offset.normalize().multiplyScalar(distance);
    const endPos = endTarget.clone().add(offset);

    const startTime = performance.now();
    const duration = 600;

    function animateToAgent(): void {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);

      camera.position.lerpVectors(startPos, endPos, eased);
      const currentTarget = controls.target as THREE.Vector3;
      currentTarget.lerpVectors(startTarget, endTarget, eased);
      controls.update();

      if (t < 1) {
        requestAnimationFrame(animateToAgent);
      }
    }

    requestAnimationFrame(animateToAgent);
    setCameraTarget(null);
  }, [cameraTarget, camera, setCameraTarget]);

  // Follow agent logic
  const shouldFollow = useMemo(
    () => followAgent && selectedAgentId !== null,
    [followAgent, selectedAgentId]
  );

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
    if (!shouldFollow || !controlsRef.current || !selectedAgentId) return;

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
      dampingFactor={dampingFactor}
      rotateSpeed={orbitSpeed}
      minDistance={minZoom}
      maxDistance={maxZoom}
      minPolarAngle={0.1}
      maxPolarAngle={Math.PI / 2 - 0.05}
    />
  );
}

"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useSimulationStore } from "@/stores/simulation-store";

const RAIN_COUNT = 2000;
const STORM_COUNT = 4000;
const RAIN_SPEED = 0.8;
const STORM_SPEED = 1.6;
const STORM_WIND_DRIFT = 0.15;
const PARTICLE_SIZE_RAIN = 0.15;
const PARTICLE_SIZE_STORM = 0.18;
const SPAWN_HEIGHT = 100;
const SPREAD = 200;

/**
 * Creates an initial Float32Array of random particle positions
 * spread across the XZ plane and vertically from 0 to SPAWN_HEIGHT.
 */
function createPositions(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * SPREAD; // x
    positions[i3 + 1] = Math.random() * SPAWN_HEIGHT; // y
    positions[i3 + 2] = (Math.random() - 0.5) * SPREAD; // z
  }
  return positions;
}

export default function WeatherEffects(): React.JSX.Element | null {
  const weather = useSimulationStore((s) => s.weather);
  const effectsEnabled = useSimulationStore((s) => s.weatherEffectsEnabled);
  const pointsRef = useRef<THREE.Points>(null);
  const { scene } = useThree();

  const isStormy = weather === "stormy";
  const isRainy = weather === "rainy";
  const isActive = effectsEnabled && (isRainy || isStormy);

  const particleCount = isStormy ? STORM_COUNT : RAIN_COUNT;

  // Pre-allocate position arrays for both rain and storm.
  // We use the larger array size and simply render fewer particles for rain.
  const positions = useMemo(() => createPositions(STORM_COUNT), []);

  // Fog reference for stormy weather
  const fogRef = useRef<THREE.Fog | null>(null);

  useFrame((_state, delta) => {
    if (!isActive || !pointsRef.current) return;

    const geom = pointsRef.current.geometry;
    const posAttr = geom.getAttribute("position") as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    const speed = isStormy ? STORM_SPEED : RAIN_SPEED;
    const windDrift = isStormy ? STORM_WIND_DRIFT : 0;
    // Cap delta to avoid large jumps when tab is backgrounded
    const dt = Math.min(delta, 0.1);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Fall downward
      arr[i3 + 1] -= speed * dt * 60;

      // Horizontal wind drift for storms
      if (windDrift > 0) {
        arr[i3] += windDrift * dt * 60;
      }

      // Reset particle to top when it reaches the ground
      if (arr[i3 + 1] < 0) {
        arr[i3] = (Math.random() - 0.5) * SPREAD;
        arr[i3 + 1] = SPAWN_HEIGHT + Math.random() * 10;
        arr[i3 + 2] = (Math.random() - 0.5) * SPREAD;
      }
    }

    posAttr.needsUpdate = true;

    // Manage fog for stormy weather
    if (isStormy && !fogRef.current) {
      fogRef.current = new THREE.Fog("#1a1a2e", 100, 500);
      scene.fog = fogRef.current;
    } else if (!isStormy && fogRef.current) {
      scene.fog = null;
      fogRef.current = null;
    }
  });

  // Clean up fog when component unmounts or weather changes to non-active
  useFrame(() => {
    if (!isActive && fogRef.current) {
      scene.fog = null;
      fogRef.current = null;
    }
  });

  if (!isActive) {
    // Clean up fog on render if weather turned off
    if (fogRef.current) {
      scene.fog = null;
      fogRef.current = null;
    }
    return null;
  }

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={particleCount}
        />
      </bufferGeometry>
      <pointsMaterial
        color={isStormy ? "#a0b0c0" : "#b0d0e8"}
        size={isStormy ? PARTICLE_SIZE_STORM : PARTICLE_SIZE_RAIN}
        transparent
        opacity={isStormy ? 0.6 : 0.4}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

"use client";

import { useMemo } from "react";
import { useSimulationStore } from "@/stores";
import type { TimeOfDay } from "@/types";

interface LightConfig {
  ambientColor: string;
  ambientIntensity: number;
  directionalColor: string;
  directionalIntensity: number;
  directionalPosition: [number, number, number];
}

const LIGHT_CONFIGS: Record<TimeOfDay, LightConfig> = {
  dawn: {
    ambientColor: "#ffa54f",
    ambientIntensity: 0.4,
    directionalColor: "#ff8c42",
    directionalIntensity: 0.6,
    directionalPosition: [50, 30, -30],
  },
  day: {
    ambientColor: "#ffffff",
    ambientIntensity: 0.6,
    directionalColor: "#fffaf0",
    directionalIntensity: 0.8,
    directionalPosition: [30, 80, 30],
  },
  dusk: {
    ambientColor: "#ff6b6b",
    ambientIntensity: 0.35,
    directionalColor: "#ff4500",
    directionalIntensity: 0.5,
    directionalPosition: [-50, 30, -30],
  },
  night: {
    ambientColor: "#2c3e6b",
    ambientIntensity: 0.2,
    directionalColor: "#1a1a2e",
    directionalIntensity: 0.1,
    directionalPosition: [0, 50, 0],
  },
};

export default function Lighting(): React.JSX.Element {
  const timeOfDay = useSimulationStore((s) => s.time.timeOfDay);

  const config = useMemo(() => LIGHT_CONFIGS[timeOfDay], [timeOfDay]);

  return (
    <>
      <ambientLight color={config.ambientColor} intensity={config.ambientIntensity} />
      <directionalLight
        color={config.directionalColor}
        intensity={config.directionalIntensity}
        position={config.directionalPosition}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
    </>
  );
}

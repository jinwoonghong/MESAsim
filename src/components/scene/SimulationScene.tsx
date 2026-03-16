"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import CityRenderer from "./CityRenderer";
import AgentRenderer from "./AgentRenderer";
import Lighting from "./Lighting";
import CameraController from "./CameraController";
import WeatherEffects from "./WeatherEffects";
import POIMarkers from "./POIMarkers";
import CityLabels from "./CityLabels";
import VehicleRenderer from "./VehicleRenderer";
import ConversationOverlay from "../overlay/ConversationOverlay";
import { useSimulationStore } from "@/stores";
import { simulationEngine } from "@/simulation/engine";

function GroundPlane(): React.JSX.Element {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[1000, 1000]} />
      <meshStandardMaterial color="#1a1a1a" />
    </mesh>
  );
}

function SceneContent(): React.JSX.Element {
  const vehiclesEnabled = useSimulationStore((s) => s.config.vehiclesEnabled);

  return (
    <>
      <Lighting />
      <CameraController />
      <GroundPlane />
      <CityRenderer />
      <AgentRenderer />
      {vehiclesEnabled && <VehicleRenderer />}
      <WeatherEffects />
      <POIMarkers />
      <CityLabels />
      <ConversationOverlay />
    </>
  );
}

export default function SimulationScene(): React.JSX.Element {
  const status = useSimulationStore((s) => s.status);
  const engineStarted = useRef(false);

  useEffect(() => {
    if (status === "running" && !engineStarted.current) {
      simulationEngine.start();
      engineStarted.current = true;
    } else if (status === "idle") {
      simulationEngine.stop();
      engineStarted.current = false;
    }
    return () => {
      simulationEngine.stop();
      engineStarted.current = false;
    };
  }, [status]);

  return (
    <div className="h-full w-full">
      <Canvas
        camera={{ position: [100, 120, 100], fov: 50, near: 0.1, far: 2000 }}
        shadows
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
}

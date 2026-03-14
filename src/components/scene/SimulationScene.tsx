"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import CityRenderer from "./CityRenderer";
import AgentRenderer from "./AgentRenderer";
import Lighting from "./Lighting";
import CameraController from "./CameraController";

function GroundPlane(): React.JSX.Element {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[1000, 1000]} />
      <meshStandardMaterial color="#1a1a1a" />
    </mesh>
  );
}

function SceneContent(): React.JSX.Element {
  return (
    <>
      <Lighting />
      <CameraController />
      <GroundPlane />
      <CityRenderer />
      <AgentRenderer />
    </>
  );
}

export default function SimulationScene(): React.JSX.Element {
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

"use client";

import dynamic from "next/dynamic";
import ControlPanel from "@/components/ui/ControlPanel";

// Dynamic import to avoid SSR issues with Three.js / React Three Fiber
const SimulationScene = dynamic(
  () => import("@/components/scene/SimulationScene"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-gray-950 text-gray-500">
        Loading 3D Scene...
      </div>
    ),
  },
);

export default function Home(): React.JSX.Element {
  return (
    <div className="flex h-screen flex-row bg-gray-950">
      {/* 3D Viewport - fills remaining space */}
      <div className="flex-1">
        <SimulationScene />
      </div>

      {/* Control Panel - fixed width on the right */}
      <ControlPanel />
    </div>
  );
}

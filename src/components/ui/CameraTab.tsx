"use client";

import { useUIStore } from "@/stores";
import type { CameraPreset } from "@/stores/ui-store";

const CAMERA_PRESETS: { id: CameraPreset; label: string }[] = [
  { id: "top-down", label: "Top-down" },
  { id: "isometric", label: "Isometric" },
  { id: "street-level", label: "Street-level" },
];

export default function CameraTab(): React.JSX.Element {
  const cameraPreset = useUIStore((s) => s.cameraPreset);
  const followAgent = useUIStore((s) => s.followAgent);
  const orbitSpeed = useUIStore((s) => s.orbitSpeed);
  const dampingFactor = useUIStore((s) => s.dampingFactor);
  const fov = useUIStore((s) => s.fov);
  const minZoom = useUIStore((s) => s.minZoom);
  const maxZoom = useUIStore((s) => s.maxZoom);

  const setCameraPreset = useUIStore((s) => s.setCameraPreset);
  const setFollowAgent = useUIStore((s) => s.setFollowAgent);
  const setOrbitSpeed = useUIStore((s) => s.setOrbitSpeed);
  const setDampingFactor = useUIStore((s) => s.setDampingFactor);
  const setFov = useUIStore((s) => s.setFov);
  const setMinZoom = useUIStore((s) => s.setMinZoom);
  const setMaxZoom = useUIStore((s) => s.setMaxZoom);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Camera View Presets */}
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
          Camera View Presets
        </h3>
        <div className="flex gap-1">
          {CAMERA_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setCameraPreset(preset.id)}
              className={`flex-1 rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                cameraPreset === preset.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      {/* Follow Agent */}
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
          Tracking
        </h3>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={followAgent}
            onChange={(e) => setFollowAgent(e.target.checked)}
            className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
          />
          Follow Selected Agent
        </label>
      </section>

      {/* Orbit Speed */}
      <section className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Orbit Speed</span>
          <span className="text-xs font-mono text-gray-500">{orbitSpeed.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min={0.1}
          max={2.0}
          step={0.1}
          value={orbitSpeed}
          onChange={(e) => setOrbitSpeed(parseFloat(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gray-700 accent-blue-500"
        />
      </section>

      {/* Damping */}
      <section className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Damping</span>
          <span className="text-xs font-mono text-gray-500">{dampingFactor.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0.01}
          max={0.5}
          step={0.01}
          value={dampingFactor}
          onChange={(e) => setDampingFactor(parseFloat(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gray-700 accent-blue-500"
        />
      </section>

      {/* FOV */}
      <section className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Field of View</span>
          <span className="text-xs font-mono text-gray-500">{fov}</span>
        </div>
        <input
          type="range"
          min={30}
          max={120}
          step={1}
          value={fov}
          onChange={(e) => setFov(parseInt(e.target.value, 10))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gray-700 accent-blue-500"
        />
      </section>

      {/* Zoom Range */}
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
          Zoom Range
        </h3>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Min Distance</span>
            <span className="text-xs font-mono text-gray-500">{minZoom}</span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            step={1}
            value={minZoom}
            onChange={(e) => setMinZoom(parseInt(e.target.value, 10))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gray-700 accent-blue-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Max Distance</span>
            <span className="text-xs font-mono text-gray-500">{maxZoom}</span>
          </div>
          <input
            type="range"
            min={100}
            max={1000}
            step={10}
            value={maxZoom}
            onChange={(e) => setMaxZoom(parseInt(e.target.value, 10))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gray-700 accent-blue-500"
          />
        </div>
      </section>
    </div>
  );
}

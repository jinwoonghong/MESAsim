"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAgentStore, useSimulationStore, useUIStore, useSettingsStore } from "@/stores";

// Chrome-only memory info type
interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatElapsed(time: { hour: number; minute: number; day: number }): string {
  const totalHours = (time.day - 1) * 24 + time.hour;
  const totalMinutes = totalHours * 60 + time.minute;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m (Day ${time.day})`;
}

export default function SystemTab(): React.JSX.Element {
  const agents = useAgentStore((s) => s.agents);
  const tickCount = useSimulationStore((s) => s.tickCount);
  const time = useSimulationStore((s) => s.time);
  const debugOverlay = useUIStore((s) => s.debugOverlay);
  const setDebugOverlay = useUIStore((s) => s.setDebugOverlay);

  const [fps, setFps] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState<string>("N/A");

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const rafIdRef = useRef(0);

  // FPS counter using requestAnimationFrame
  useEffect(() => {
    function measureFps(now: number): void {
      frameCountRef.current += 1;
      const elapsed = now - lastTimeRef.current;

      if (elapsed >= 500) {
        const currentFps = Math.round((frameCountRef.current / elapsed) * 1000);
        setFps(currentFps);
        frameCountRef.current = 0;
        lastTimeRef.current = now;

        // Update memory usage (Chrome only)
        const perf = performance as PerformanceWithMemory;
        if (perf.memory) {
          setMemoryUsage(formatBytes(perf.memory.usedJSHeapSize));
        }
      }

      rafIdRef.current = requestAnimationFrame(measureFps);
    }

    rafIdRef.current = requestAnimationFrame(measureFps);

    return () => {
      cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  const handleResetSettings = useCallback((): void => {
    const confirmed = window.confirm(
      "Reset all settings to defaults? This will clear saved preferences for UI, simulation, and API settings."
    );
    if (!confirmed) return;

    // Clear all persisted stores
    localStorage.removeItem("mesasim-ui");
    localStorage.removeItem("mesasim-simulation");
    localStorage.removeItem("mesasim-settings");

    // Reset in-memory stores
    useUIStore.setState({
      cameraPreset: "custom",
      followAgent: false,
      orbitSpeed: 1.0,
      dampingFactor: 0.1,
      fov: 75,
      minZoom: 10,
      maxZoom: 500,
      debugOverlay: false,
      showMinimap: true,
      showBubbles: true,
    });

    useSimulationStore.setState({
      autoWeather: false,
      weatherEffectsEnabled: true,
      maxVehicleCount: 10,
      vehicleTypes: { car: true, bus: true, taxi: true },
      spawnRate: 5,
    });

    useSettingsStore.setState({
      geminiApiKey: "",
      geminiModel: "gemini-2.0-flash",
      autoSave: true,
    });
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Performance Stats */}
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
          Performance
        </h3>
        <div className="rounded bg-gray-800 p-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">FPS</span>
              <span
                className={`font-mono ${
                  fps >= 50
                    ? "text-green-400"
                    : fps >= 30
                      ? "text-yellow-400"
                      : "text-red-400"
                }`}
              >
                {fps}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Agent Count</span>
              <span className="font-mono text-white">{agents.size}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Memory Usage</span>
              <span className="font-mono text-white">{memoryUsage}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Simulation Tick</span>
              <span className="font-mono text-white">{tickCount}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Elapsed Time */}
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
          Simulation Time
        </h3>
        <div className="rounded bg-gray-800 px-3 py-2">
          <span className="font-mono text-sm text-white">
            {formatElapsed(time)}
          </span>
        </div>
      </section>

      {/* Debug Overlay */}
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
          Debug
        </h3>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={debugOverlay}
            onChange={(e) => setDebugOverlay(e.target.checked)}
            className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
          />
          Debug Overlay
        </label>
      </section>

      {/* Reset Settings */}
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
          Danger Zone
        </h3>
        <button
          onClick={handleResetSettings}
          className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
        >
          Reset All Settings
        </button>
      </section>
    </div>
  );
}

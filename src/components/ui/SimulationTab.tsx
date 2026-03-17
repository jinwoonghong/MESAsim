"use client";

import { useCallback, useState } from "react";
import { useSimulationStore, useCityStore } from "@/stores";
import { getAllRegions, getRegionById } from "@/city/korean-regions";
import { fetchOSMData } from "@/city/osm-fetcher";
import { parseOSMResponse } from "@/city/osm-parser";
import type { SpeedMultiplier } from "@/types/simulation";

const SPEED_OPTIONS: SpeedMultiplier[] = [0.5, 1, 2, 5, 10] as SpeedMultiplier[];

export default function SimulationTab(): React.JSX.Element {
  const status = useSimulationStore((s) => s.status);
  const time = useSimulationStore((s) => s.time);
  const weather = useSimulationStore((s) => s.weather);
  const tickCount = useSimulationStore((s) => s.tickCount);
  const config = useSimulationStore((s) => s.config);
  const start = useSimulationStore((s) => s.start);
  const pause = useSimulationStore((s) => s.pause);
  const reset = useSimulationStore((s) => s.reset);
  const setSpeed = useSimulationStore((s) => s.setSpeed);
  const setMaxAgents = useSimulationStore((s) => s.setMaxAgents);

  const selectedRegion = useCityStore((s) => s.selectedRegion);
  const setSelectedRegion = useCityStore((s) => s.setSelectedRegion);
  const setCityData = useCityStore((s) => s.setCityData);
  const setLoading = useCityStore((s) => s.setLoading);
  const setError = useCityStore((s) => s.setError);
  const loading = useCityStore((s) => s.loading);
  const error = useCityStore((s) => s.error);

  const [loadingRegionName, setLoadingRegionName] = useState<string | null>(
    null,
  );

  const regions = getAllRegions();

  const formattedTime = `Day ${time.day} - ${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`;

  // Handle region selection and OSM data fetching
  const handleRegionChange = useCallback(
    async (regionId: string): Promise<void> => {
      if (!regionId) {
        setSelectedRegion(null);
        return;
      }

      const region = getRegionById(regionId);
      if (!region) return;

      setSelectedRegion(regionId);
      setLoading(true);
      setError(null);
      setLoadingRegionName(region.nameEn);

      try {
        const raw = await fetchOSMData(region.bounds);
        const data = parseOSMResponse(
          raw,
          region.center,
          region.nameEn,
          region.bounds,
        );
        setCityData(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load region data";
        setError(message);
      } finally {
        setLoadingRegionName(null);
      }
    },
    [setSelectedRegion, setLoading, setError, setCityData],
  );

  // Determine the primary action button label based on status
  function getActionLabel(): string {
    if (status === "paused") return "Resume";
    if (status === "running") return "Pause";
    return "Start";
  }

  function handleAction(): void {
    if (status === "running") {
      pause();
    } else {
      start();
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Region Selection */}
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
          Region
        </h3>
        <select
          value={selectedRegion ?? ""}
          onChange={(e) => void handleRegionChange(e.target.value)}
          disabled={loading}
          className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Select a region...</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.nameEn})
            </option>
          ))}
        </select>

        {loading && loadingRegionName && (
          <div className="flex items-center gap-2 text-xs text-blue-400">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
            Loading {loadingRegionName}...
          </div>
        )}

        {error && (
          <p className="rounded bg-red-900/40 px-3 py-2 text-xs text-red-400">
            {error}
          </p>
        )}
      </section>

      {/* Controls */}
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
          Controls
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleAction}
            className={`flex-1 rounded px-4 py-2 text-sm font-medium text-white transition-colors ${
              status === "running"
                ? "bg-yellow-600 hover:bg-yellow-500"
                : "bg-green-600 hover:bg-green-500"
            }`}
          >
            {getActionLabel()}
          </button>
          <button
            onClick={reset}
            className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
          >
            Reset
          </button>
        </div>
      </section>

      {/* Agent Count */}
      <section className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Agents</span>
          <span className="text-xs font-mono text-gray-500">{config.maxAgents}</span>
        </div>
        <input
          type="range"
          min={1}
          max={50}
          value={config.maxAgents}
          onChange={(e) => setMaxAgents(Number(e.target.value))}
          disabled={status !== "idle"}
          className="w-full accent-blue-500 disabled:opacity-50"
        />
        <div className="flex justify-between text-[10px] text-gray-600">
          <span>1</span>
          <span>25</span>
          <span>50</span>
        </div>
        {status !== "idle" && (
          <p className="text-[10px] text-gray-600">
            Reset to change agent count
          </p>
        )}
      </section>

      {/* Speed */}
      <section className="flex flex-col gap-1">
        <span className="text-sm text-gray-400">Speed</span>
        <div className="flex gap-1">
          {SPEED_OPTIONS.map((speed) => (
            <button
              key={speed}
              onClick={() => setSpeed(speed)}
              className={`flex-1 rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                config.speedMultiplier === speed
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </section>

      {/* Status */}
      <section className="rounded bg-gray-800 p-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Time</span>
            <span className="font-mono text-white">{formattedTime}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Weather</span>
            <span className="capitalize text-white">{weather}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Status</span>
            <span className="capitalize text-white">{status}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Ticks</span>
            <span className="font-mono text-white">{tickCount}</span>
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import { useSimulationStore } from "@/stores";
import type { WeatherState } from "@/types/simulation";

const WEATHER_OPTIONS: { id: WeatherState; label: string }[] = [
  { id: "clear", label: "Clear" },
  { id: "cloudy", label: "Cloudy" },
  { id: "rainy", label: "Rainy" },
  { id: "stormy", label: "Stormy" },
];

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function WeatherTab(): React.JSX.Element {
  const status = useSimulationStore((s) => s.status);
  const weather = useSimulationStore((s) => s.weather);
  const autoWeather = useSimulationStore((s) => s.autoWeather);
  const weatherEffectsEnabled = useSimulationStore((s) => s.weatherEffectsEnabled);
  const config = useSimulationStore((s) => s.config);

  const setWeather = useSimulationStore((s) => s.setWeather);
  const setAutoWeather = useSimulationStore((s) => s.setAutoWeather);
  const setWeatherEffectsEnabled = useSimulationStore((s) => s.setWeatherEffectsEnabled);
  const setDayDuration = useSimulationStore((s) => s.setDayDuration);

  const isDisabled = status !== "running";

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Disabled guard */}
      {isDisabled && (
        <div className="rounded bg-yellow-900/30 px-3 py-2 text-xs text-yellow-400">
          Start simulation to control weather
        </div>
      )}

      {/* Weather Type */}
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
          Weather Type
        </h3>
        <div className="flex gap-1">
          {WEATHER_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => setWeather(option.id)}
              disabled={isDisabled}
              className={`flex-1 rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                weather === option.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {/* Auto Weather */}
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
          Automation
        </h3>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={autoWeather}
            onChange={(e) => setAutoWeather(e.target.checked)}
            disabled={isDisabled}
            className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
          Auto Weather
        </label>
      </section>

      {/* Day Duration */}
      <section className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Day Duration</span>
          <span className="text-xs font-mono text-gray-500">
            {formatDuration(config.dayDurationMs)}
          </span>
        </div>
        <input
          type="range"
          min={30000}
          max={600000}
          step={10000}
          value={config.dayDurationMs}
          onChange={(e) => setDayDuration(parseInt(e.target.value, 10))}
          disabled={isDisabled}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gray-700 accent-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <div className="flex justify-between text-xs text-gray-600">
          <span>0:30</span>
          <span>10:00</span>
        </div>
      </section>

      {/* Weather Effects */}
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
          Effects
        </h3>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={weatherEffectsEnabled}
            onChange={(e) => setWeatherEffectsEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
          />
          Weather Effects
        </label>
      </section>
    </div>
  );
}

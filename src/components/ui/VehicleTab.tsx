"use client";

import { useSimulationStore } from "@/stores";

export default function VehicleTab(): React.JSX.Element {
  const config = useSimulationStore((s) => s.config);
  const maxVehicleCount = useSimulationStore((s) => s.maxVehicleCount);
  const vehicleTypes = useSimulationStore((s) => s.vehicleTypes);
  const spawnRate = useSimulationStore((s) => s.spawnRate);

  const setMaxVehicleCount = useSimulationStore((s) => s.setMaxVehicleCount);
  const setVehicleTypes = useSimulationStore((s) => s.setVehicleTypes);
  const setSpawnRate = useSimulationStore((s) => s.setSpawnRate);

  const vehiclesEnabled = config.vehiclesEnabled;

  function handleToggleVehicleType(type: "car" | "bus" | "taxi"): void {
    setVehicleTypes({
      ...vehicleTypes,
      [type]: !vehicleTypes[type],
    });
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Pending notice */}
      <div className="rounded bg-amber-900/30 border border-amber-700/50 px-3 py-2 text-xs text-amber-400">
        Vehicle system is under development. Settings will be saved and applied when
        implemented.
      </div>

      {/* Enable Vehicles */}
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
          Vehicles
        </h3>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={vehiclesEnabled}
            readOnly
            disabled
            className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
          Enable Vehicles (coming soon)
        </label>
      </section>

      {/* Max Vehicle Count */}
      <section className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Max Vehicle Count</span>
          <span className="text-xs font-mono text-gray-500">{maxVehicleCount}</span>
        </div>
        <input
          type="range"
          min={0}
          max={50}
          step={1}
          value={maxVehicleCount}
          onChange={(e) => setMaxVehicleCount(parseInt(e.target.value, 10))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gray-700 accent-blue-500"
        />
      </section>

      {/* Vehicle Types */}
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
          Vehicle Types
        </h3>
        <div className="flex flex-col gap-1">
          {(["car", "bus", "taxi"] as const).map((type) => (
            <label
              key={type}
              className="flex items-center gap-2 text-sm text-gray-300"
            >
              <input
                type="checkbox"
                checked={vehicleTypes[type]}
                onChange={() => handleToggleVehicleType(type)}
                className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
              />
              <span className="capitalize">{type}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Spawn Rate */}
      <section className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Spawn Rate</span>
          <span className="text-xs font-mono text-gray-500">{spawnRate}s</span>
        </div>
        <input
          type="range"
          min={1}
          max={30}
          step={1}
          value={spawnRate}
          onChange={(e) => setSpawnRate(parseInt(e.target.value, 10))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gray-700 accent-blue-500"
        />
      </section>

      {/* Empty state */}
      {vehiclesEnabled && maxVehicleCount === 0 && (
        <div className="rounded bg-gray-800 px-3 py-2 text-center text-xs text-gray-500">
          No active vehicles
        </div>
      )}
    </div>
  );
}

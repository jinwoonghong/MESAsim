"use client";

import { useSimulationStore } from "@/stores";

export default function VehicleTab(): React.JSX.Element {
  const vehiclesEnabled = useSimulationStore((s) => s.config.vehiclesEnabled);
  const maxVehicleCount = useSimulationStore((s) => s.maxVehicleCount);
  const vehicleTypes = useSimulationStore((s) => s.vehicleTypes);
  const spawnRate = useSimulationStore((s) => s.spawnRate);
  const vehicleCount = useSimulationStore((s) => s.vehicles.length);

  const setMaxVehicleCount = useSimulationStore((s) => s.setMaxVehicleCount);
  const setVehicleTypes = useSimulationStore((s) => s.setVehicleTypes);
  const setSpawnRate = useSimulationStore((s) => s.setSpawnRate);
  const setVehiclesEnabled = useSimulationStore((s) => s.setVehiclesEnabled);

  function handleToggleVehicleType(type: "car" | "bus" | "taxi"): void {
    setVehicleTypes({
      ...vehicleTypes,
      [type]: !vehicleTypes[type],
    });
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Enable Vehicles */}
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
          Vehicles
        </h3>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={vehiclesEnabled}
            onChange={(e) => setVehiclesEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
          />
          Enable Vehicles
        </label>
        {vehiclesEnabled && (
          <span className="text-xs text-gray-500">
            Active: {vehicleCount} / {maxVehicleCount}
          </span>
        )}
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

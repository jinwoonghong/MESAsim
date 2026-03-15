"use client";

import { useMemo } from "react";
import { useSimulationStore } from "@/stores";
import { VEHICLE_SPECS } from "@/systems/vehicles";
import type { Vehicle } from "@/types/simulation";

function VehicleMesh({ vehicle }: { vehicle: Vehicle }): React.JSX.Element {
  const spec = VEHICLE_SPECS[vehicle.type];

  // Compute rotation: face direction of next waypoint
  const rotation = useMemo((): number => {
    if (vehicle.pathIndex >= vehicle.path.length) return 0;
    const target = vehicle.path[vehicle.pathIndex];
    const dx = target.x - vehicle.position.x;
    const dz = target.y - vehicle.position.z;
    return Math.atan2(dx, dz);
  }, [vehicle.position.x, vehicle.position.z, vehicle.pathIndex, vehicle.path]);

  return (
    <mesh
      position={[vehicle.position.x, spec.height / 2, vehicle.position.z]}
      rotation={[0, rotation, 0]}
    >
      <boxGeometry args={[spec.width, spec.height, spec.depth]} />
      <meshStandardMaterial color={spec.color} />
    </mesh>
  );
}

export default function VehicleRenderer(): React.JSX.Element | null {
  const vehicles = useSimulationStore((s) => s.vehicles);

  if (vehicles.length === 0) return null;

  return (
    <>
      {vehicles.map((vehicle) => (
        <VehicleMesh key={vehicle.id} vehicle={vehicle} />
      ))}
    </>
  );
}

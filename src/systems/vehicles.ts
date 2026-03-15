import type { Vehicle } from "@/types/simulation";
import type { RoadGraph } from "@/city/road-network";
import { findPath } from "@/systems/pathfinding";

export type VehicleType = "car" | "bus" | "taxi";

// Vehicle type specifications: speed, dimensions, and render color
export const VEHICLE_SPECS = {
  car:  { speed: 8.0, width: 1.8, height: 1.4, depth: 4.0, color: "#3B82F6" },
  bus:  { speed: 5.0, width: 2.4, height: 2.8, depth: 8.0, color: "#F59E0B" },
  taxi: { speed: 7.5, width: 1.8, height: 1.4, depth: 4.0, color: "#FBBF24" },
} as const;

interface VehicleTypes {
  car: boolean;
  bus: boolean;
  taxi: boolean;
}

/**
 * Returns an array of enabled vehicle type keys.
 */
export function getEnabledTypes(vehicleTypes: VehicleTypes): VehicleType[] {
  const types: VehicleType[] = [];
  if (vehicleTypes.car) types.push("car");
  if (vehicleTypes.bus) types.push("bus");
  if (vehicleTypes.taxi) types.push("taxi");
  return types;
}

/**
 * Spawns a vehicle at a random origin node, pathfinding to a random destination node.
 * Returns null if no valid path is found or no enabled types exist.
 */
export function spawnVehicle(
  graph: RoadGraph,
  enabledTypes: VehicleType[],
): Vehicle | null {
  if (enabledTypes.length === 0) return null;

  const nodeArray = Array.from(graph.nodes.values());
  if (nodeArray.length < 2) return null;

  // Pick random origin and destination nodes (must be different)
  const originIndex = Math.floor(Math.random() * nodeArray.length);
  let destIndex = Math.floor(Math.random() * (nodeArray.length - 1));
  if (destIndex >= originIndex) destIndex += 1;

  const originNode = nodeArray[originIndex];
  const destNode = nodeArray[destIndex];

  const result = findPath(graph, originNode.position, destNode.position);
  if (!result.found || result.path.length < 2) return null;

  const type = enabledTypes[Math.floor(Math.random() * enabledTypes.length)];
  const startPos = result.path[0];

  return {
    id: crypto.randomUUID(),
    position: { x: startPos.x, y: 0, z: startPos.y },
    path: result.path,
    pathIndex: 1, // Start moving toward second waypoint
    speed: VEHICLE_SPECS[type].speed,
    type,
  };
}

/**
 * Determines whether a new vehicle should be spawned based on timing and capacity.
 */
export function shouldSpawn(
  lastSpawnTime: number,
  currentTime: number,
  spawnRate: number,
  vehicleCount: number,
  maxCount: number,
): boolean {
  if (vehicleCount >= maxCount) return false;
  if (maxCount <= 0) return false;
  // spawnRate is in seconds
  return (currentTime - lastSpawnTime) >= spawnRate * 1000;
}

interface VehicleMovementResult {
  updated: Vehicle[];
  despawned: string[];
}

/**
 * Advances all vehicles along their paths and identifies despawned vehicles.
 * Vehicle.path is 2D {x,y}[] but Vehicle.position is 3D {x,y,z} where y=0.
 * Movement maps path.x -> position.x and path.y -> position.z.
 */
export function processVehicleMovement(
  vehicles: Vehicle[],
  speedMultiplier: number,
  weatherModifier: number,
  dt: number,
): VehicleMovementResult {
  const updated: Vehicle[] = [];
  const despawned: string[] = [];

  for (const vehicle of vehicles) {
    if (vehicle.pathIndex >= vehicle.path.length) {
      despawned.push(vehicle.id);
      continue;
    }

    const target = vehicle.path[vehicle.pathIndex];
    // Map 2D path coords to 3D: path.x -> position.x, path.y -> position.z
    const dx = target.x - vehicle.position.x;
    const dz = target.y - vehicle.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    const step = vehicle.speed * speedMultiplier * weatherModifier * dt;

    if (dist <= step) {
      // Reached waypoint, advance to next
      const nextIndex = vehicle.pathIndex + 1;
      if (nextIndex >= vehicle.path.length) {
        // Reached final destination -- despawn
        despawned.push(vehicle.id);
      } else {
        updated.push({
          ...vehicle,
          position: { x: target.x, y: 0, z: target.y },
          pathIndex: nextIndex,
        });
      }
    } else {
      // Move toward waypoint
      const ratio = step / dist;
      updated.push({
        ...vehicle,
        position: {
          x: vehicle.position.x + dx * ratio,
          y: 0,
          z: vehicle.position.z + dz * ratio,
        },
      });
    }
  }

  return { updated, despawned };
}

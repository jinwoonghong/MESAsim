import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getEnabledTypes,
  shouldSpawn,
  processVehicleMovement,
  spawnVehicle,
  VEHICLE_SPECS,
} from "./vehicles";
import type { Vehicle } from "@/types/simulation";
import type { RoadGraph } from "@/city/road-network";

// Mock pathfinding module
vi.mock("@/systems/pathfinding", () => ({
  findPath: vi.fn(),
}));

import { findPath } from "@/systems/pathfinding";

const mockFindPath = vi.mocked(findPath);

function createMockGraph(nodeCount: number = 3): RoadGraph {
  const nodes = new Map<string, { id: string; position: { x: number; y: number }; connections: string[] }>();
  for (let i = 0; i < nodeCount; i++) {
    nodes.set(`node-${i}`, {
      id: `node-${i}`,
      position: { x: i * 10, y: i * 10 },
      connections: [],
    });
  }

  return {
    nodes: nodes as RoadGraph["nodes"],
    edges: new Map(),
    getNeighbors: vi.fn().mockReturnValue([]),
    getNearestNode: vi.fn(),
    getEdge: vi.fn(),
  };
}

function createVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: "v-1",
    position: { x: 0, y: 0, z: 0 },
    path: [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: 0 },
    ],
    pathIndex: 1,
    speed: 8.0,
    type: "car",
    ...overrides,
  };
}

describe("getEnabledTypes", () => {
  it("returns all types when all enabled", () => {
    const result = getEnabledTypes({ car: true, bus: true, taxi: true });
    expect(result).toEqual(["car", "bus", "taxi"]);
  });

  it("returns only enabled types", () => {
    const result = getEnabledTypes({ car: true, bus: false, taxi: true });
    expect(result).toEqual(["car", "taxi"]);
  });

  it("returns empty array when none enabled", () => {
    const result = getEnabledTypes({ car: false, bus: false, taxi: false });
    expect(result).toEqual([]);
  });
});

describe("shouldSpawn", () => {
  it("returns true when enough time has passed and under max count", () => {
    expect(shouldSpawn(0, 5000, 5, 3, 10)).toBe(true);
  });

  it("returns false when not enough time has passed", () => {
    expect(shouldSpawn(0, 4000, 5, 3, 10)).toBe(false);
  });

  it("returns false when at max count", () => {
    expect(shouldSpawn(0, 10000, 5, 10, 10)).toBe(false);
  });

  it("returns false when over max count", () => {
    expect(shouldSpawn(0, 10000, 5, 15, 10)).toBe(false);
  });

  it("returns false when maxCount is 0", () => {
    expect(shouldSpawn(0, 10000, 5, 0, 0)).toBe(false);
  });
});

describe("processVehicleMovement", () => {
  it("moves vehicle toward next waypoint", () => {
    const vehicle = createVehicle({
      position: { x: 0, y: 0, z: 0 },
      pathIndex: 1,
      speed: 5.0,
    });

    const result = processVehicleMovement([vehicle], 1.0, 1.0, 1.0);

    expect(result.updated).toHaveLength(1);
    expect(result.despawned).toHaveLength(0);
    // Vehicle should move toward {x:10, z:0}
    expect(result.updated[0].position.x).toBeGreaterThan(0);
    expect(result.updated[0].position.y).toBe(0);
  });

  it("advances pathIndex when reaching a waypoint", () => {
    const vehicle = createVehicle({
      position: { x: 9.9, y: 0, z: 0 },
      pathIndex: 1,
      speed: 10.0,
    });

    const result = processVehicleMovement([vehicle], 1.0, 1.0, 1.0);

    expect(result.updated).toHaveLength(1);
    expect(result.updated[0].pathIndex).toBe(2);
    expect(result.updated[0].position.x).toBe(10);
    expect(result.updated[0].position.z).toBe(0);
  });

  it("despawns vehicle at end of path", () => {
    const vehicle = createVehicle({
      position: { x: 19.9, y: 0, z: 0 },
      pathIndex: 2, // Last waypoint
      speed: 10.0,
    });

    const result = processVehicleMovement([vehicle], 1.0, 1.0, 1.0);

    expect(result.updated).toHaveLength(0);
    expect(result.despawned).toEqual(["v-1"]);
  });

  it("despawns vehicle when pathIndex exceeds path length", () => {
    const vehicle = createVehicle({
      pathIndex: 5, // Beyond path length
    });

    const result = processVehicleMovement([vehicle], 1.0, 1.0, 1.0);

    expect(result.despawned).toEqual(["v-1"]);
  });

  it("applies weather modifier to movement speed", () => {
    const vehicle = createVehicle({
      position: { x: 0, y: 0, z: 0 },
      pathIndex: 1,
      speed: 10.0,
    });

    const normalResult = processVehicleMovement([vehicle], 1.0, 1.0, 1.0);
    const rainyResult = processVehicleMovement([vehicle], 1.0, 0.7, 1.0);

    // Rainy movement should be slower
    expect(rainyResult.updated[0].position.x).toBeLessThan(
      normalResult.updated[0].position.x,
    );
  });

  it("applies speed multiplier to movement", () => {
    const vehicle = createVehicle({
      position: { x: 0, y: 0, z: 0 },
      pathIndex: 1,
      speed: 5.0,
    });

    const x1Result = processVehicleMovement([vehicle], 1.0, 1.0, 1.0);
    const x2Result = processVehicleMovement([vehicle], 2.0, 1.0, 1.0);

    expect(x2Result.updated[0].position.x).toBeCloseTo(
      x1Result.updated[0].position.x * 2,
      5,
    );
  });

  it("handles multiple vehicles", () => {
    const vehicles = [
      createVehicle({ id: "v-1", position: { x: 0, y: 0, z: 0 }, pathIndex: 1 }),
      createVehicle({ id: "v-2", position: { x: 19.9, y: 0, z: 0 }, pathIndex: 2, speed: 10.0 }),
    ];

    const result = processVehicleMovement(vehicles, 1.0, 1.0, 1.0);

    expect(result.updated).toHaveLength(1);
    expect(result.updated[0].id).toBe("v-1");
    expect(result.despawned).toEqual(["v-2"]);
  });
});

describe("spawnVehicle", () => {
  beforeEach(() => {
    mockFindPath.mockReset();
  });

  it("returns null when no enabled types", () => {
    const graph = createMockGraph();
    const result = spawnVehicle(graph, []);
    expect(result).toBeNull();
  });

  it("returns null when graph has fewer than 2 nodes", () => {
    const graph = createMockGraph(1);
    const result = spawnVehicle(graph, ["car"]);
    expect(result).toBeNull();
  });

  it("returns null when no path found", () => {
    mockFindPath.mockReturnValue({
      found: false,
      path: [],
      distance: 0,
      nodeIds: [],
    });

    const graph = createMockGraph();
    const result = spawnVehicle(graph, ["car"]);
    expect(result).toBeNull();
  });

  it("creates a vehicle with valid path", () => {
    const path = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 20, y: 20 },
    ];
    mockFindPath.mockReturnValue({
      found: true,
      path,
      distance: 28.28,
      nodeIds: ["node-0", "node-1", "node-2"],
    });

    const graph = createMockGraph();
    const result = spawnVehicle(graph, ["car"]);

    expect(result).not.toBeNull();
    expect(result!.id).toBeTruthy();
    expect(result!.path).toEqual(path);
    expect(result!.pathIndex).toBe(1);
    expect(result!.position.x).toBe(0);
    expect(result!.position.y).toBe(0);
    expect(result!.position.z).toBe(0);
    expect(result!.type).toBe("car");
    expect(result!.speed).toBe(VEHICLE_SPECS.car.speed);
  });

  it("assigns correct speed for bus type", () => {
    mockFindPath.mockReturnValue({
      found: true,
      path: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
      distance: 14.14,
      nodeIds: ["node-0", "node-1"],
    });

    const graph = createMockGraph();
    const result = spawnVehicle(graph, ["bus"]);

    expect(result).not.toBeNull();
    expect(result!.type).toBe("bus");
    expect(result!.speed).toBe(VEHICLE_SPECS.bus.speed);
  });
});

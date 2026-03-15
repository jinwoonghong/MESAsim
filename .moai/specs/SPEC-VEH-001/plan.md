---
id: SPEC-VEH-001
title: "Vehicle System - Implementation Plan"
parent: SPEC-SIM-001
tags: [vehicle, traffic, simulation, rendering, pathfinding]
---

# SPEC-VEH-001: Implementation Plan

## 1. Primary Goal - Vehicle Core Logic

### 1.1 Store Extension (simulation-store.ts)

- Add `vehicles: Vehicle[]` state field
- Add mutation methods: `addVehicle`, `removeVehicle`, `updateVehicle`, `clearVehicles`
- Add `setVehiclesEnabled` action that updates `config.vehiclesEnabled` and calls `clearVehicles()` when disabling
- Exclude `vehicles` from persistence (ephemeral state)

### 1.2 Vehicle System Module (src/systems/vehicles.ts)

- `spawnVehicle(graph: RoadGraph, enabledTypes: VehicleTypes): Vehicle | null`
  - Select random origin node from road graph
  - Select random destination node (minimum 3 edges from origin)
  - Compute path via `findPath`
  - Return null if path not found
  - Assign speed from type specification table

- `processVehicleMovement(vehicles: Vehicle[], speedMultiplier: number, weatherModifier: number, dt: number): { updated: Vehicle[]; despawned: string[] }`
  - Advance each vehicle along its path
  - Return updated positions and list of despawned vehicle IDs

- `shouldSpawn(lastSpawnTime: number, currentTime: number, spawnRate: number, vehicleCount: number, maxCount: number): boolean`
  - Check spawn interval elapsed
  - Check vehicle count below maximum

### 1.3 Engine Integration (engine.ts)

- Add `processVehicles()` private method
- Track `lastVehicleSpawnTime` for spawn interval
- Call spawn logic, then movement logic each tick
- Insert after `processMovement()` in tick sequence

## 2. Secondary Goal - 3D Rendering

### 2.1 VehicleRenderer Component (src/components/scene/VehicleRenderer.tsx)

- React Three Fiber component subscribing to `useSimulationStore` vehicles
- Render each vehicle as a `<mesh>` with `<boxGeometry>` sized per vehicle type
- Apply color per vehicle type from specification table
- Orient vehicle mesh to face movement direction (rotation based on path direction vector)
- Use `useFrame` for smooth position interpolation between ticks

### 2.2 SimulationScene Integration

- Import and render `<VehicleRenderer />` inside `SimulationScene.tsx`
- Conditionally render only when `vehiclesEnabled` is true

## 3. Final Goal - UI and Polish

### 3.1 VehicleTab Updates

- Remove "under development" amber notice banner
- Change toggle from `disabled`/`readOnly` to functional
- Wire toggle to `setVehiclesEnabled` action
- Display active vehicle count

### 3.2 Performance Optimization

- If vehicle count > 20, switch to `THREE.InstancedMesh` for batched rendering
- Use Zustand shallow equality selectors to minimize re-renders
- Batch vehicle position updates in a single store call per tick

## 4. Optional Goal - Visual Enhancements

- Add headlight point lights for night-time vehicles
- Add simple exhaust particle effect
- Add vehicle shadow projections

## 5. Technical Approach

### Architecture

```
VehicleTab (UI) --> simulation-store --> engine.ts --> vehicles.ts
                                                          |
                                                     pathfinding.ts
                                                          |
SimulationScene --> VehicleRenderer <-- simulation-store (vehicles[])
```

### Key Design Decisions

1. **Ephemeral state**: Vehicles are not persisted to IndexedDB. They respawn naturally on simulation restart.
2. **Reuse pathfinding**: No changes to `findPath` or `RoadGraph` needed. Vehicle paths use the same A* algorithm as agent paths.
3. **Simple geometry**: Box meshes keep draw calls and GPU memory minimal. InstancedMesh upgrade path exists for scaling.
4. **Weather parity**: Vehicles use the same weather speed modifier as agents for consistency.

### Risks and Mitigation

| Risk | Mitigation |
|---|---|
| FPS degradation with 50 vehicles | InstancedMesh batching reduces draw calls from 50 to 1 |
| Store update thrashing | Batch all vehicle updates into single `set()` call per tick |
| Path computation spike on mass spawn | Stagger spawns via spawnRate interval; one vehicle per tick max |
| Direction interpolation jitter | Use `THREE.Vector3.lerp` for smooth orientation transitions |

## 6. Milestones

| Milestone | Priority | Dependencies |
|---|---|---|
| Store extension with vehicle state | Primary | None |
| Vehicle system module (spawn + move) | Primary | Store extension |
| Engine integration | Primary | Vehicle system module |
| VehicleRenderer component | Secondary | Store extension |
| SimulationScene integration | Secondary | VehicleRenderer |
| VehicleTab functional toggle | Final | Engine integration |
| InstancedMesh optimization | Optional | VehicleRenderer |
| Visual enhancements (lights, particles) | Optional | VehicleRenderer |

## 7. Files Changed

| File | Action | Priority |
|---|---|---|
| `src/stores/simulation-store.ts` | Modify | Primary |
| `src/systems/vehicles.ts` | Create | Primary |
| `src/simulation/engine.ts` | Modify | Primary |
| `src/components/scene/VehicleRenderer.tsx` | Create | Secondary |
| `src/components/scene/SimulationScene.tsx` | Modify | Secondary |
| `src/components/ui/VehicleTab.tsx` | Modify | Final |
| `src/systems/vehicles.test.ts` | Create | Primary |

---
id: SPEC-VEH-001
title: "Vehicle System - Spawning, Movement, and Rendering"
version: 0.1.0
status: draft
created: 2026-03-15
updated: 2026-03-15
author: MoAI
priority: low
issue_number: 0
parent: SPEC-SIM-001
lifecycle: spec-first
tags: [vehicle, traffic, simulation, rendering, pathfinding]
---

# SPEC-VEH-001: Vehicle System - Spawning, Movement, and Rendering

## 1. Environment

### 1.1 Project Context

MESAsim is a 3D autonomous agent simulation for Korean cities using Next.js 15 + TypeScript + React Three Fiber + Zustand + Gemini API. The simulation currently supports AI-driven pedestrian agents navigating a road network built from OpenStreetMap data.

### 1.2 Existing Infrastructure

- **Vehicle type**: Already defined in `src/types/simulation.ts` with `id`, `position`, `path`, `pathIndex`, `speed`, and `type` fields.
- **Simulation store**: `src/stores/simulation-store.ts` has vehicle settings (`vehiclesEnabled`, `maxVehicleCount`, `vehicleTypes`, `spawnRate`) with persistence.
- **VehicleTab UI**: `src/components/ui/VehicleTab.tsx` exists with controls for max count, vehicle type toggles, and spawn rate slider. Currently shows "under development" notice with a disabled enable toggle.
- **Road network**: `src/systems/pathfinding.ts` provides `RoadGraph` with A* pathfinding (`findPath`) and road node/segment data.
- **Engine loop**: `src/simulation/engine.ts` has a unified tick loop calling `processWeather`, `tick`, `processDecisions`, `processMovement`, `processInteractions`, and `processHomeDirection`.
- **City data**: `src/types/city.ts` defines `CityData` with `roadNodes` and `roadSegments`.

### 1.3 Technology Constraints

| Constraint | Value |
|---|---|
| Runtime | Browser (WebGL 2, evergreen browsers) |
| 3D Renderer | React Three Fiber 8 + Three.js 0.171 |
| State Management | Zustand 5 |
| Build | Next.js 15 with Turbopack |
| Filesystem | exFAT (D: drive) - must use Turbopack |
| Language | TypeScript 5.7+ strict mode |

### 1.4 Performance Baseline

The simulation currently renders 3D buildings, terrain, road network, and up to ~20 AI agents at 60 FPS on mid-range hardware. Vehicle rendering must not degrade this baseline below 30 FPS.

## 2. Assumptions

- **A1**: The existing `RoadGraph` and `findPath` function can be reused for vehicle path calculation without modification.
- **A2**: Vehicles travel only on road segments (not off-road or on sidewalks).
- **A3**: Vehicle 3D models will use simple procedural geometry (colored boxes with proportional dimensions) rather than loaded GLTF assets, keeping bundle size minimal.
- **A4**: Vehicle-to-agent and vehicle-to-vehicle collision detection is explicitly out of scope for this SPEC (per R5.2.1 - no collisions).
- **A5**: The existing `Vehicle` interface in `simulation.ts` is sufficient and does not need schema changes.
- **A6**: Vehicle spawning uses road network edge endpoints as spawn/despawn locations.

## 3. Requirements

### 3.1 Vehicle Spawning (R5.1.1)

**WHEN** the simulation is running **AND** `vehiclesEnabled` is `true`,
**THEN** the system **shall** spawn vehicles on road network nodes at the configured `spawnRate` interval.

**WHEN** a vehicle is spawned,
**THEN** the system **shall** select a random road node as the origin, compute a path to a different random road node using `findPath`, and assign a speed based on the vehicle type.

**WHEN** a vehicle type is disabled in `vehicleTypes` settings,
**THEN** the system **shall not** spawn vehicles of that type.

### 3.2 Vehicle Movement (R5.1.2)

**WHEN** a vehicle has an active path,
**THEN** the system **shall** move the vehicle along its path waypoints at the vehicle's assigned speed, scaled by the simulation `speedMultiplier`.

**WHEN** a vehicle reaches the final waypoint of its path,
**THEN** the system **shall** remove the vehicle from the simulation (despawn).

**IF** `vehiclesEnabled` is `false`,
**THEN** the system **shall** immediately remove all active vehicles and stop spawning.

### 3.3 No Collision (R5.2.1)

The system **shall not** implement vehicle-to-vehicle or vehicle-to-agent collision detection. Vehicles pass through each other and through agents.

### 3.4 Vehicle Count Limit (R5.2.2)

**WHILE** the number of active vehicles equals `maxVehicleCount`,
**WHEN** the spawn timer fires,
**THEN** the system **shall** skip spawning until an active vehicle despawns.

### 3.5 Vehicle Rendering

**WHEN** one or more vehicles exist in the simulation,
**THEN** the system **shall** render each vehicle as a 3D box mesh with dimensions and color based on vehicle type.

**WHILE** the simulation is running,
**THEN** the system **shall** interpolate vehicle positions between ticks for smooth visual movement.

### 3.6 VehicleTab Integration

**WHEN** the user toggles `vehiclesEnabled` in the VehicleTab,
**THEN** the system **shall** update the simulation config and start or stop the vehicle system accordingly.

The system **shall** remove the "under development" notice and enable the toggle checkbox in VehicleTab.

### 3.7 Weather Impact

**WHILE** weather is `rainy` or `stormy`,
**THEN** the system **shall** apply the same speed modifier to vehicles as applied to agents (rainy=0.7, stormy=0.4).

## 4. Specifications

### 4.1 Vehicle Type Specifications

| Type | Speed (units/s) | Dimensions (w x h x d) | Color |
|---|---|---|---|
| car | 8.0 | 1.8 x 1.4 x 4.0 | `#3B82F6` (blue) |
| bus | 5.0 | 2.4 x 2.8 x 8.0 | `#F59E0B` (amber) |
| taxi | 7.5 | 1.8 x 1.4 x 4.0 | `#FBBF24` (yellow) |

### 4.2 Spawn Logic

- Spawn interval: Controlled by `spawnRate` (seconds), default 5s.
- Origin selection: Random road node from `RoadGraph`.
- Destination selection: Random road node different from origin, minimum 3 edges apart.
- Path computation: Reuse `findPath(graph, originPos, destPos)`.
- Vehicle ID: Generated via `crypto.randomUUID()`.
- Type selection: Random from enabled types in `vehicleTypes`.

### 4.3 Movement Logic

- Each tick, advance vehicle along `path` by `speed * speedMultiplier * weatherModifier * (tickInterval / 1000)` units.
- When distance to next waypoint is less than step size, advance `pathIndex`.
- When `pathIndex >= path.length`, despawn vehicle.
- Vehicle y-position: Fixed at 0 (ground level on road surface).

### 4.4 Vehicle State Management

Vehicles are stored in `simulation-store.ts` as a `Vehicle[]` array. No persistence to IndexedDB is required (vehicles are ephemeral).

New store fields:
- `vehicles: Vehicle[]` - Active vehicle list
- `addVehicle(v: Vehicle): void` - Add a spawned vehicle
- `removeVehicle(id: string): void` - Remove a despawned vehicle
- `updateVehicle(id: string, updates: Partial<Vehicle>): void` - Update position/pathIndex
- `clearVehicles(): void` - Remove all vehicles

### 4.5 File Structure

**Files to create:**

| File | Purpose |
|---|---|
| `src/systems/vehicles.ts` | Vehicle spawning, movement, despawn logic |
| `src/components/scene/VehicleRenderer.tsx` | 3D rendering of vehicles using R3F |
| `src/systems/vehicles.test.ts` | Unit tests for vehicle system logic |

**Files to modify:**

| File | Change |
|---|---|
| `src/simulation/engine.ts` | Add `processVehicles()` call in tick loop after `processMovement()` |
| `src/components/scene/SimulationScene.tsx` | Add `<VehicleRenderer />` component |
| `src/components/ui/VehicleTab.tsx` | Remove "under development" notice, enable toggle |
| `src/stores/simulation-store.ts` | Add `vehicles[]` state and mutation methods |

### 4.6 Engine Integration

In `engine.ts`, add a new step in the `tick()` method:

```
private tick(): void {
  // 0. Weather transitions
  this.processWeather();
  // 1. Advance simulation time
  simStore.tick();
  // 2. AI decisions
  this.processDecisions();
  // 3. Agent movement
  this.processMovement();
  // 3.5 Vehicle spawning and movement  <-- NEW
  this.processVehicles();
  // 4. Agent interactions
  this.processInteractions();
  // 5. Nighttime / storm shelter
  this.processHomeDirection();
}
```

### 4.7 Performance Budget

| Metric | Target |
|---|---|
| Max vehicles at 60 FPS | 20 |
| Max vehicles at 30 FPS | 50 |
| Draw calls per vehicle | 1 (single mesh) |
| Memory per vehicle | < 1 KB |
| Spawn path computation | < 5 ms |

Use `THREE.InstancedMesh` if vehicle count exceeds 20 to batch draw calls.

## 5. Out of Scope

- Collision detection (explicitly excluded by R5.2.1)
- Traffic signals or traffic rules
- Vehicle-agent interaction (e.g., agents boarding buses)
- Loaded 3D vehicle models (GLTF/GLB assets)
- Vehicle persistence to IndexedDB
- Vehicle AI decision-making
- Lane-based driving (vehicles follow path centerline)

## 6. Dependencies

| Dependency | Source |
|---|---|
| `RoadGraph` | `src/systems/pathfinding.ts` |
| `findPath` | `src/systems/pathfinding.ts` |
| `Vehicle` interface | `src/types/simulation.ts` |
| `SimulationConfig` | `src/types/simulation.ts` |
| `useSimulationStore` | `src/stores/simulation-store.ts` |
| `useCityStore` | `src/stores/city-store.ts` (for road graph access) |

## 7. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| FPS drop with many vehicles | Medium | High | Use InstancedMesh for batching; enforce maxVehicleCount |
| Path computation bottleneck | Low | Medium | A* is already optimized with binary min-heap; paths are short |
| Visual clipping with terrain | Low | Low | Fix vehicle y-offset if needed |
| Store update frequency causing re-renders | Medium | Medium | Use Zustand selectors; update positions in batch |

## 8. Traceability

| Requirement | Parent | Test |
|---|---|---|
| R5.1.1 Vehicle spawning | SPEC-SIM-001 R5 | AC-1, AC-2 |
| R5.1.2 Vehicle movement | SPEC-SIM-001 R5 | AC-3, AC-4 |
| R5.2.1 No collisions | SPEC-SIM-001 R5 | AC-5 |
| R5.2.2 Max count limit | SPEC-SIM-001 R5 | AC-6 |

---
id: SPEC-VEH-001
title: "Vehicle System - Acceptance Criteria"
parent: SPEC-SIM-001
tags: [vehicle, traffic, simulation, rendering, pathfinding]
---

# SPEC-VEH-001: Acceptance Criteria

## AC-1: Vehicle Spawning on Road Network (R5.1.1)

### Scenario: Vehicles spawn at configured interval

```gherkin
Given the simulation is running
  And vehiclesEnabled is true
  And maxVehicleCount is 10
  And spawnRate is 5 seconds
When 5 seconds elapse since the last spawn
Then a new vehicle is created on a random road node
  And the vehicle has a computed path to a different road node
  And the vehicle type is randomly selected from enabled types
  And the vehicle has the correct speed for its type
```

### Scenario: Only enabled vehicle types spawn

```gherkin
Given vehicleTypes has car=true, bus=false, taxi=true
When a vehicle spawns
Then its type is either "car" or "taxi"
  And no vehicle with type "bus" is created
```

### Scenario: No vehicles spawn when disabled

```gherkin
Given vehiclesEnabled is false
When the spawn timer fires
Then no vehicle is created
  And the vehicles array remains empty
```

## AC-2: Vehicle Path Computation

### Scenario: Valid path is computed for spawned vehicle

```gherkin
Given a road graph with at least 2 nodes
When a vehicle is spawned
Then findPath is called with a random origin and destination
  And the vehicle's path array has at least 2 waypoints
  And pathIndex is set to 0
```

### Scenario: Spawn is skipped when no valid path exists

```gherkin
Given a road graph where origin and destination are disconnected
When spawn is attempted
Then no vehicle is added to the simulation
  And no error is thrown
```

## AC-3: Vehicle Movement Along Path (R5.1.2)

### Scenario: Vehicle advances along its path each tick

```gherkin
Given a vehicle at pathIndex 0 with path of 5 waypoints
  And speed is 8.0 units/s
  And speedMultiplier is 1
  And tickInterval is 100ms
When one tick elapses
Then the vehicle position moves 0.8 units toward waypoint 1
```

### Scenario: Vehicle advances to next waypoint

```gherkin
Given a vehicle is within step distance of waypoint 1
When one tick elapses
Then pathIndex advances to 1
  And the vehicle continues toward waypoint 2
```

### Scenario: Weather modifier affects vehicle speed

```gherkin
Given weather is "rainy" (modifier 0.7)
  And a vehicle has speed 8.0
When one tick elapses
Then the effective movement is 8.0 * 0.7 * speedMultiplier * dt
```

## AC-4: Vehicle Despawn at Path End (R5.1.2)

### Scenario: Vehicle is removed when reaching final waypoint

```gherkin
Given a vehicle at the second-to-last waypoint
  And it is within step distance of the final waypoint
When one tick elapses
Then the vehicle is removed from the vehicles array
  And the active vehicle count decreases by 1
```

### Scenario: All vehicles removed when system is disabled

```gherkin
Given 5 vehicles are active
When vehiclesEnabled is set to false
Then the vehicles array becomes empty
  And no new vehicles spawn
```

## AC-5: No Collision Detection (R5.2.1)

### Scenario: Vehicles pass through each other

```gherkin
Given two vehicles occupy the same road segment
  And their positions overlap
When movement is processed
Then both vehicles continue along their respective paths
  And no collision event is triggered
  And no speed or direction change occurs
```

### Scenario: Vehicles pass through agents

```gherkin
Given a vehicle and an agent occupy the same position
When the tick is processed
Then neither entity is affected by the other
```

## AC-6: Max Vehicle Count Enforcement (R5.2.2)

### Scenario: No spawn when at maximum capacity

```gherkin
Given maxVehicleCount is 10
  And 10 vehicles are currently active
When the spawn timer fires
Then no new vehicle is created
  And the vehicle count remains 10
```

### Scenario: Spawning resumes after despawn

```gherkin
Given maxVehicleCount is 10
  And 10 vehicles are active
  And one vehicle reaches its path end and despawns
When the next spawn timer fires
Then a new vehicle is spawned
  And the vehicle count is 10
```

## AC-7: 3D Rendering

### Scenario: Vehicles render with correct geometry

```gherkin
Given a car vehicle exists in the simulation
When the scene renders
Then a box mesh with dimensions 1.8 x 1.4 x 4.0 is visible
  And the mesh color is #3B82F6 (blue)
  And the mesh is positioned at the vehicle's coordinates
```

### Scenario: Vehicle orientation follows path direction

```gherkin
Given a vehicle is moving from waypoint A to waypoint B
When the scene renders
Then the vehicle mesh faces the direction from A to B
```

### Scenario: No rendering when vehicles disabled

```gherkin
Given vehiclesEnabled is false
When the scene renders
Then no vehicle meshes are present in the scene
```

## AC-8: VehicleTab UI

### Scenario: Toggle enables/disables vehicle system

```gherkin
Given the VehicleTab is displayed
  And vehiclesEnabled is false
When the user clicks the enable toggle
Then vehiclesEnabled becomes true
  And the "under development" notice is not displayed
  And vehicles begin spawning at the configured rate
```

### Scenario: Settings persist across page reloads

```gherkin
Given the user sets maxVehicleCount to 15
  And sets spawnRate to 10
  And enables only "bus" and "taxi" types
When the page is reloaded
Then maxVehicleCount is 15
  And spawnRate is 10
  And vehicleTypes shows bus=true, taxi=true, car=false
```

## AC-9: Performance

### Scenario: FPS remains above 30 with max vehicles

```gherkin
Given 50 vehicles are active
  And 20 agents are active
  And the city is fully rendered
When the simulation runs for 10 seconds
Then the average FPS is above 30
```

### Scenario: Spawn path computation completes quickly

```gherkin
Given a road graph with 500+ nodes
When a vehicle spawn is triggered
Then path computation completes in under 5ms
```

## Definition of Done

- [ ] All AC-1 through AC-8 scenarios pass
- [ ] `src/systems/vehicles.test.ts` exists with unit tests for spawn, movement, and despawn logic
- [ ] FPS does not drop below 30 with 50 vehicles and 20 agents
- [ ] VehicleTab toggle is functional (no "under development" notice)
- [ ] Vehicles visually move along roads in the 3D scene
- [ ] Vehicle count respects `maxVehicleCount` setting
- [ ] Weather modifier applies to vehicle speed
- [ ] No TypeScript errors (`npx tsc --noEmit` passes)
- [ ] No ESLint errors (`npx next lint` passes)

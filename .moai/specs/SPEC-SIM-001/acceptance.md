# SPEC-SIM-001: Acceptance Criteria

## SPEC Reference

| Field    | Value       |
| -------- | ----------- |
| SPEC ID  | SPEC-SIM-001 |
| Title    | MESAsim - 3D Autonomous Agent Simulation Service |

---

## SC1: Agent System

### SC1.1: Agent Core

**Given** the simulation is initialized with 5 agents
**When** the simulation starts
**Then** all 5 agents have unique IDs, names, positions, and an active state

**Given** a simulation tick occurs
**When** agents are in active state
**Then** each active agent's position and state are updated based on their current behavior

### SC1.2: Agent Generation via Gemini

**Given** a valid Gemini API key is configured
**When** the user requests a new agent
**Then** the system calls the Gemini API and creates an agent with a unique name, personality traits, occupation, and daily routine within 5 seconds

**Given** the Gemini API is unreachable
**When** the user requests a new agent
**Then** the system creates an agent with randomized default attributes and displays a notification

### SC1.3: Agent Movement

**Given** an agent has destination building B
**When** the pathfinding system computes a route
**Then** the agent moves along the road network toward B at its configured speed

**Given** an agent has a destination with no valid path
**When** pathfinding fails
**Then** the agent receives an alternative nearby destination or remains idle

### SC1.4: Agent Interaction

**Given** Agent A and Agent B are within 5 units of each other
**When** neither agent is already in an interaction
**Then** an interaction event triggers and the Gemini API generates a conversation

**Given** an interaction between Agent A and Agent B concludes
**When** the conversation summary is generated
**Then** both agents' memory stores contain the interaction summary with timestamp

### SC1.5: Agent Home Management

**Given** the simulation time transitions to nighttime (e.g., 22:00)
**When** agents are not already at home
**Then** agents navigate to their assigned home building

**Given** a new agent is created
**When** residential buildings with capacity exist
**Then** the agent is assigned a home building

### SC1.6: Agent Persistence

**Given** agents exist in the simulation
**When** the user refreshes the browser
**Then** all agent state (position, memory, relationships) is restored from IndexedDB

---

## SC2: City System

### SC2.1: City Generation

**Given** the user selects city size "medium"
**When** the city is generated
**Then** the city contains buildings of at least 4 different types arranged in a grid layout with roads connecting all blocks

**Given** the city is generated
**When** the 3D scene renders
**Then** buildings are visible as 3D objects with colors matching their building type

### SC2.2: Road Network

**Given** a city is generated
**When** the road network is constructed
**Then** all city blocks are reachable via the road network (connected graph)

---

## SC3: Pathfinding System

### SC3.1: A* Pathfinding

**Given** a road network graph with N intersections
**When** an agent requests a path from intersection A to intersection B
**Then** the A* algorithm returns the shortest path as an ordered list of waypoints within 50ms for graphs up to 500 nodes

**Given** a computed path for an agent
**When** the agent follows the path
**Then** the agent stays on road geometry and never passes through buildings

### SC3.2: Invalid Paths

**Given** a destination on a disconnected road segment
**When** pathfinding is requested
**Then** the system returns null/failure and no path is assigned

---

## SC4: Weather System

### SC4.1: Weather State Transitions

**Given** the simulation is running
**When** the weather transition timer triggers
**Then** the weather state changes according to configured probabilities (clear, cloudy, rainy, stormy)

### SC4.2: Weather Visual Effects

**Given** the weather state is "rainy"
**When** the scene renders
**Then** particle-based rain effects are visible in the 3D scene

### SC4.3: Weather Agent Impact

**Given** the weather state is "rainy"
**When** agents are moving
**Then** agent movement speed is reduced by the configured rain factor (e.g., 0.7x)

**Given** the weather state is "stormy"
**When** agents are outdoors
**Then** agents navigate to the nearest building for shelter

### SC4.4: Day/Night Cycle

**Given** the simulation is running
**When** the simulation time progresses
**Then** scene lighting transitions smoothly between day and night states

---

## SC5: Vehicle System

### SC5.1: Vehicle Spawning

**Given** the simulation is running with vehicles enabled
**When** the vehicle count is below the configured maximum
**Then** new vehicles spawn at road entry points and travel along the road network

### SC5.2: Vehicle Collision Avoidance

**Given** a vehicle approaches another vehicle or agent on the road
**When** the distance is below a safety threshold
**Then** the trailing vehicle decelerates or stops to maintain safe distance

---

## SC6: 3D Rendering

### SC6.1: Performance

**Given** a simulation with 20 active agents, a medium city, and weather effects
**When** the scene renders
**Then** the frame rate remains at or above 30 FPS on a mid-range GPU (e.g., GTX 1060 equivalent)

### SC6.2: Camera Controls

**Given** the 3D viewport is displayed
**When** the user uses mouse drag, scroll, and right-click
**Then** orbit, zoom, and pan controls respond smoothly

**Given** an agent is selected
**When** follow-camera mode is activated
**Then** the camera smoothly tracks the selected agent's position

### SC6.3: Agent Visualization

**Given** agents are in the scene
**When** the scene renders
**Then** each agent has a visible 3D representation with a name label above it

**Given** an agent transitions state (idle to moving, moving to interacting)
**When** the scene renders
**Then** the agent's visual appearance changes (color, animation, or icon) to reflect the new state

---

## SC7: Control Panel UI

### SC7.1: Tab Navigation

**Given** the control panel is visible
**When** the user clicks a tab header
**Then** the corresponding tab content is displayed and the previous tab content is hidden

### SC7.2: API Key Management

**Given** the API Settings tab is open
**When** the user enters a valid Gemini API key and clicks Save
**Then** the key is validated, stored in browser storage, and a success indicator appears

**Given** no API key is configured
**When** the user attempts to start the simulation
**Then** a prompt directs the user to enter an API key first

### SC7.3: Simulation Controls

**Given** the simulation is paused
**When** the user clicks Play
**Then** the simulation loop resumes and agents begin moving

**Given** the simulation is running at 1x speed
**When** the user selects 2x speed
**Then** the simulation tick rate doubles

**Given** the user clicks Reset
**When** the confirmation dialog is accepted
**Then** all agents are removed, the city is regenerated, and the simulation resets to initial state

### SC7.4: Agent Management

**Given** the Agent tab is open
**When** agents exist in the simulation
**Then** a scrollable list displays all agents with name and current state

**Given** the user clicks an agent in the 3D scene
**When** the click is detected via raycasting
**Then** the agent is selected, highlighted in the scene, and details panel opens

---

## SC8: Gemini API Integration

### SC8.1: API Proxy Security

**Given** a client-side request to /api/gemini
**When** the request is processed
**Then** the API key is injected server-side and never appears in client responses or network payloads

### SC8.2: Rate Limiting

**Given** more than 30 Gemini API requests arrive within 60 seconds
**When** the rate limit is exceeded
**Then** subsequent requests receive a 429 status and are queued for retry

### SC8.3: Error Fallback

**Given** the Gemini API returns an error (500, timeout, malformed response)
**When** an agent awaits a decision
**Then** the agent falls back to deterministic behavior (random valid destination) and a warning is logged

### SC8.4: Response Caching

**Given** Agent A requests a decision with context hash X
**When** a cached response exists for context hash X within the TTL window
**Then** the cached response is returned without making a Gemini API call

---

## Quality Gates

### Performance Gate

- [ ] 30+ FPS with 20 agents on mid-range hardware
- [ ] Initial page load under 5 seconds
- [ ] Agent decision response under 3 seconds (including API latency)
- [ ] Memory usage under 512 MB

### Functionality Gate

- [ ] All EARS requirements (R1-R8) implemented and passing
- [ ] Simulation runs without errors for 30+ minutes continuously
- [ ] Agent persistence survives page refresh
- [ ] All 7 control panel tabs functional

### Code Quality Gate

- [ ] TypeScript strict mode enabled, zero type errors
- [ ] ESLint passing with zero warnings
- [ ] 85%+ test coverage for simulation logic (agents, pathfinding, weather)
- [ ] E2E tests passing for core simulation workflow

### Security Gate

- [ ] Gemini API key never exposed in client-side code or network responses
- [ ] API proxy rate limiting active
- [ ] No XSS vulnerabilities in user-configurable inputs

---

## Definition of Done

1. All quality gates pass
2. All acceptance criteria scenarios verified
3. Simulation runs in Chrome, Firefox, Safari, and Edge
4. Control panel is keyboard-navigable
5. Documentation includes setup instructions and API key configuration guide
6. No known critical or high severity bugs

---

## Traceability

| Scenario | Requirement | Milestone   |
| -------- | ----------- | ----------- |
| SC1      | R1.x        | M1, M2, M3  |
| SC2      | R2.x        | M1          |
| SC3      | R3.x        | M1          |
| SC4      | R4.x        | M2          |
| SC5      | R5.x        | M2          |
| SC6      | R6.x        | M1, M3      |
| SC7      | R7.x        | M2, M3      |
| SC8      | R8.x        | M1, M3      |

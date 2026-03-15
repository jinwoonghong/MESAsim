# Module Descriptions

## Domain Logic Layer

### agents/ (7 files)

Agent lifecycle management covering creation, movement, interaction, memory, and persistence.

- **Agent Creation** (`agent-generation.ts`): Entry point for spawning new agents. Calls the Gemini API to generate agent personality, traits, and backstory. Returns a structured agent object ready for store insertion.
- **Agent Movement** (`agent-movement.ts`): Path-following logic. Each tick, the agent advances along its `currentPath` toward the next waypoint. Handles arrival detection and destination reassignment.
- **Agent Interaction** (`agent-interaction.ts`): Proximity-based interaction system. When agents are within a configurable radius, they may initiate conversations or exchanges mediated by AI.
- **Agent Memory** (`agent-memory.ts`): LRU-based memory system with a capacity of 50 entries. Agents remember past interactions, locations visited, and notable events. Oldest memories are evicted when capacity is reached.
- **Agent Home Assignment** (`agent-home.ts`): Assigns residential buildings to agents as home locations. Agents return home during nighttime simulation hours.
- **Agent Persistence** (`agent-persistence.ts`): IndexedDB-based persistence using the `idb` library. Saves and restores agent state across browser sessions.
- **Agent Processing** (`agent-processing.ts`): Per-tick agent update logic called by the simulation engine. Orchestrates movement, interaction checks, and state transitions.

### city/ (7 files)

City data pipeline from region selection through to renderable geometry and pathfinding graph.

- **Region Presets** (`regions.ts`): Predefined Korean city bounding boxes (Seoul, Busan, Incheon, etc.) with center coordinates and zoom levels.
- **OSM Fetcher** (`osm-fetcher.ts`): Fetches raw OpenStreetMap data from the Overpass API given geographic bounds. Returns raw OSM JSON response.
- **OSM Parser** (`osm-parser.ts`): Parses raw OSM JSON into structured domain objects: buildings, roads, and intersections with geographic coordinates.
- **Building Domain** (`building.ts`): Building domain object with position, dimensions, type classification, and rendering properties.
- **Road Domain** (`road.ts`): Road domain object with path segments, width, road type, and connectivity information.
- **Intersection Domain** (`intersection.ts`): Intersection domain object representing road junctions as graph nodes.
- **Road Network** (`road-network.ts`): Constructs a graph data structure from roads and intersections. Provides `getNearestNode()` for mapping world positions to graph nodes. Used by the pathfinding system.

### simulation/ (2 files)

Game loop engine managing time progression and agent processing.

- **Simulation Engine** (`engine.ts`): Core game loop using `requestAnimationFrame`. Manages tick timing with configurable tick rate and speed multiplier. Each tick advances simulation time and triggers agent processing. Time scale: 24 real minutes equals 1 in-game day.
- **Time Manager** (`time.ts`): Tracks in-game time (hour, day, season). Provides time-based queries for agent behavior (is it nighttime, work hours, etc.).

## Application/Store Layer

### stores/ (5 files)

Five Zustand stores providing reactive state management.

- **Simulation Store** (`simulation-store.ts`): Simulation control state -- running/paused/stopped status, speed multiplier, current game time, tick count.
- **Agent Store** (`agent-store.ts`): Agent collection using `Map<string, Agent>` for O(1) lookups. Provides `addAgent`, `updateAgent`, `removeAgent`, and bulk query operations.
- **City Store** (`city-store.ts`): City data state -- buildings, roads, intersections, road network graph. Set once after OSM data is fetched and parsed.
- **UI Store** (`ui-store.ts`): UI interaction state -- selected agent ID, active panel tab, camera follow mode, debug overlays.
- **Settings Store** (`settings-store.ts`): User preferences persisted to `localStorage` -- API key, simulation speed, visual quality, agent count limits.

## Infrastructure Layer

### services/ (3 files)

External API integration and caching.

- **Gemini Client** (`gemini-client.ts`): HTTP client that sends requests to the `/api/ai` proxy route. Handles request formatting and response parsing for Gemini API calls.
- **Prompt Builders** (`prompt-builders.ts`): Constructs prompts for agent generation, interaction, and decision-making. Encodes agent personality, context, and constraints into structured prompts.
- **Cache** (`cache.ts`): In-memory TTL cache for AI responses. Prevents redundant API calls for similar prompts within a configurable time window.

### systems/ (1 file)

Core algorithms.

- **Pathfinding** (`pathfinding.ts`): A* pathfinding implementation with a binary min-heap priority queue. Operates on the road network graph from `city/road-network.ts`. Returns an ordered list of waypoints from start to destination.

### lib/ (utilities)

Shared utility functions, type definitions, and helper modules.

## Presentation Layer

### components/scene/ (5 files)

React Three Fiber 3D scene components.

- **SimulationScene** (`SimulationScene.tsx`): Root R3F Canvas component. Sets up lighting, camera, and scene graph. Dynamically imported in page.tsx to avoid SSR issues.
- **CityRenderer** (`CityRenderer.tsx`): Renders city buildings as box geometries and roads as flat box geometries. Positions and scales based on parsed OSM data.
- **AgentRenderer** (`AgentRenderer.tsx`): Renders agents as cylinder (body) + sphere (head) composites. Color-coded by agent state. Updates position each frame from store subscriptions.
- **CameraController** (`CameraController.tsx`): Orbit camera that follows the currently selected agent. Provides smooth transitions when selection changes.
- **DebugOverlay** (`DebugOverlay.tsx`): Optional debug visualization showing pathfinding routes, interaction radii, and performance metrics.

### components/ui/ (4 files)

React UI control panel with tabbed interface.

- **ControlPanel** (`ControlPanel.tsx`): Main UI container with tabbed navigation. Houses all control sub-panels.
- **RegionSelector** (`RegionSelector.tsx`): Dropdown for selecting Korean city regions. Triggers OSM data fetch on selection change.
- **SimulationControls** (`SimulationControls.tsx`): Play/pause/stop buttons, speed slider, time display, agent spawn controls.
- **AgentInspector** (`AgentInspector.tsx`): Displays detailed information about the selected agent -- personality, current activity, memory log, path visualization.

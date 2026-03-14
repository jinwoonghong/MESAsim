# SPEC-SIM-001: MESAsim - 3D Autonomous Agent Simulation Service

## Metadata

| Field       | Value                                           |
| ----------- | ----------------------------------------------- |
| SPEC ID     | SPEC-SIM-001                                    |
| Title       | MESAsim - 3D Autonomous Agent Simulation Service |
| Created     | 2026-03-15                                      |
| Status      | Planned                                         |
| Priority    | High                                            |
| Lifecycle   | spec-anchored                                   |

## Overview

MESAsim is a web-based 3D autonomous agent simulation service inspired by MESA (Multi-Entity Simulation Architecture). AI-powered agents, driven by the Gemini API, autonomously navigate, interact, and make decisions within **real Korean cities** rendered in 3D via Three.js (through @react-three/fiber). Users select a Korean region (e.g., Gangnam, Hongdae, Haeundae) and the system fetches real map data from OpenStreetMap to build the 3D city environment. The system is built with Next.js and TypeScript, deployed as a browser-only web application.

### Reference Architecture

Based on the MESA project (github.com/oggata/MultiEntitySimulationArchitecture), which provides:
- Agent system with LLM-driven behavior (generation, movement, interaction, home management)
- City system with building layout, roads, and segmentation-based generation
- Pathfinding system using A* algorithm on road networks
- Weather simulation, vehicle management, and camera control
- 7-tab control panel UI for simulation management

MESAsim adapts this architecture to a modern Next.js + TypeScript + React Three Fiber stack with Gemini API as the exclusive AI backend.

---

## Environment

| Aspect              | Specification                                              |
| ------------------- | ---------------------------------------------------------- |
| Runtime             | Browser (modern Chrome, Firefox, Safari, Edge)             |
| Framework           | Next.js 15+ with App Router, TypeScript 5.5+               |
| 3D Rendering        | Three.js via @react-three/fiber and @react-three/drei      |
| AI Backend          | Google Gemini API (gemini-2.0-flash or later)              |
| State Management    | Zustand for simulation state                               |
| Styling             | Tailwind CSS 4.x                                           |
| Package Manager     | pnpm                                                       |
| Deployment          | Web only (Vercel, Cloudflare Pages, or similar)            |
| Min Browser Support | ES2022+ capable browsers                                   |

---

## Assumptions

1. Users have a valid Gemini API key configured via the application settings UI.
2. The browser supports WebGL 2.0 for 3D rendering.
3. Network connectivity is available for Gemini API calls (no offline LLM mode).
4. Simulation runs client-side; Next.js API routes proxy Gemini API calls to protect API keys.
5. City layout is generated from real Korean map data via OpenStreetMap Overpass API. Users select a Korean region (si/gu/dong) to simulate.
6. Agent count is limited to a practical range (1-50 agents) for browser performance.
7. The simulation runs in real-time with configurable speed multiplier.

---

## Requirements

### R1: Agent System

#### R1.1 Agent Core (Ubiquitous)

- **R1.1.1**: The system **shall** represent each agent with a unique identity, position, state, personality traits, and memory.
- **R1.1.2**: The system **shall** maintain an agent lifecycle (spawned, active, idle, sleeping, removed).
- **R1.1.3**: The system **shall** update all active agents on each simulation tick.

#### R1.2 Agent Generation (Event-Driven)

- **R1.2.1**: **When** the user requests agent creation, the system **shall** call the Gemini API to generate a unique agent profile including name, personality, occupation, and daily routine.
- **R1.2.2**: **When** the simulation starts, the system **shall** generate an initial population of agents based on configuration.

#### R1.3 Agent Movement (State-Driven)

- **R1.3.1**: **While** an agent has a destination, the system **shall** move the agent along the pathfinding-computed route at the agent's configured speed.
- **R1.3.2**: **While** an agent is idle, the system **shall** request the Gemini API to determine the agent's next action and destination.
- **R1.3.3**: **If** no valid path exists to a destination, **then** the system **shall** assign an alternative nearby destination or keep the agent idle.

#### R1.4 Agent Interaction (Event-Driven)

- **R1.4.1**: **When** two agents are within interaction range, the system **shall** trigger an interaction event.
- **R1.4.2**: **When** an interaction event occurs, the system **shall** use the Gemini API to generate a contextual conversation between the agents based on their personalities and memories.
- **R1.4.3**: **When** an interaction concludes, the system **shall** update both agents' memories with a summary of the conversation.

#### R1.5 Agent Home Management (State-Driven)

- **R1.5.1**: **While** the simulation time is nighttime, the system **shall** direct agents toward their assigned home buildings.
- **R1.5.2**: **When** an agent is created, the system **shall** assign the agent a home from available residential buildings.

#### R1.6 Agent Storage (Ubiquitous)

- **R1.6.1**: The system **shall** persist agent state (position, memory, relationships) in browser localStorage or IndexedDB.
- **R1.6.2**: The system **shall** restore agent state when the simulation is reloaded.

### R2: City System (Korea-based Real Map)

#### R2.1 Map Data Source (Ubiquitous)

- **R2.1.1**: The system **shall** use OpenStreetMap (OSM) data via Overpass API to fetch real Korean city map data including buildings, roads, and land use.
- **R2.1.2**: The system **shall** convert OSM geographic coordinates (WGS84) to a local 3D coordinate system for Three.js rendering.
- **R2.1.3**: The system **shall** cache fetched map data in IndexedDB to avoid redundant API calls.

#### R2.2 Korean Region Selection (Event-Driven)

- **R2.2.1**: **When** the simulation starts for the first time, the system **shall** present a region selection UI with a searchable list of Korean cities and districts (si/gu/dong).
- **R2.2.2**: **When** the user selects a region, the system **shall** fetch the corresponding bounding box area from OSM and generate the 3D city from that data.
- **R2.2.3**: **When** the user enters a custom address or place name, the system **shall** use Nominatim geocoding API to resolve it to coordinates and fetch the surrounding area.
- **R2.2.4**: The system **shall** provide preset Korean locations (e.g., Gangnam, Hongdae, Haeundae, Myeongdong) for quick selection.

#### R2.3 Building Rendering (Ubiquitous)

- **R2.3.1**: The system **shall** render OSM buildings as 3D extruded polygons with height derived from OSM `building:levels` or `height` tags, falling back to a default height per building type.
- **R2.3.2**: The system **shall** classify buildings using OSM tags into Korean-relevant types: apartment (APT), officetel, commercial, convenience store, cafe, restaurant, school, hospital, park, and public facility.
- **R2.3.3**: The system **shall** assign distinct colors per building type following a configurable color scheme.

#### R2.4 Road Network (Ubiquitous)

- **R2.4.1**: The system **shall** extract road network data from OSM `highway` tags and render roads as flat geometry with width based on road classification (motorway, primary, secondary, residential, footway).
- **R2.4.2**: The system **shall** render Korean-style road features including crosswalks, bus stops, and pedestrian paths where OSM data is available.
- **R2.4.3**: The system **shall** generate a navigation graph from the OSM road network for pathfinding.

#### R2.5 Korean Urban Features (Optional)

- **R2.5.1**: **Where** OSM data includes amenity tags, the system **shall** render points of interest (convenience stores, cafes, subway stations) with appropriate 3D markers.
- **R2.5.2**: **Where** OSM data includes `railway=subway_entrance` nodes, the system **shall** render subway station entrances as recognizable landmarks.
- **R2.5.3**: **Where** available, the system **shall** display Korean place names (hangul) as labels on buildings and landmarks.

### R3: Pathfinding System

#### R3.1 Graph Construction (Ubiquitous)

- **R3.1.1**: The system **shall** construct a navigation graph from the OSM road network data upon Korean region loading.
- **R3.1.2**: The system **shall** represent OSM road intersections as graph nodes and road segments as edges with real-world distance weights.

#### R3.2 Route Computation (Event-Driven)

- **R3.2.1**: **When** an agent requires navigation, the system **shall** compute the shortest path using the A* algorithm.
- **R3.2.2**: **When** a route is computed, the system **shall** return a sequence of waypoints for the agent to follow.

#### R3.3 Unwanted Behavior

- **R3.3.1**: The system **shall not** allow agents to move through buildings or off-road areas.
- **R3.3.2**: The system **shall not** compute paths that traverse disconnected road segments.

### R4: Weather System

#### R4.1 Weather Simulation (State-Driven)

- **R4.1.1**: **While** the simulation is running, the system **shall** cycle through weather states (clear, cloudy, rainy, stormy) based on configurable probabilities.
- **R4.1.2**: **While** weather is rainy or stormy, the system **shall** render particle-based rain effects.

#### R4.2 Weather Effects (State-Driven)

- **R4.2.1**: **While** weather is rainy, the system **shall** reduce agent movement speed by a configurable factor.
- **R4.2.2**: **While** weather is stormy, the system **shall** direct agents to seek shelter in the nearest building.

#### R4.3 Day/Night Cycle (Ubiquitous)

- **R4.3.1**: The system **shall** simulate a day/night cycle with configurable duration.
- **R4.3.2**: The system **shall** adjust scene lighting (ambient, directional) based on time of day.

### R5: Vehicle System

#### R5.1 Vehicle Management (State-Driven)

- **R5.1.1**: **While** the simulation is running, the system **shall** spawn and manage autonomous vehicles on the road network.
- **R5.1.2**: **While** a vehicle is active, the system **shall** move the vehicle along road paths at vehicle-appropriate speeds.

#### R5.2 Vehicle Behavior (Unwanted)

- **R5.2.1**: The system **shall not** allow vehicles to collide with each other or with agents.
- **R5.2.2**: The system **shall not** spawn vehicles beyond the configured maximum count.

### R6: 3D Rendering System

#### R6.1 Scene Management (Ubiquitous)

- **R6.1.1**: The system **shall** render the city, agents, vehicles, and environment in a 3D scene using React Three Fiber.
- **R6.1.2**: The system **shall** maintain a minimum of 30 FPS on mid-range hardware with 20 agents active.

#### R6.2 Camera System (Event-Driven)

- **R6.2.1**: **When** the user interacts with the viewport, the system **shall** support orbit, pan, and zoom camera controls.
- **R6.2.2**: **When** the user selects an agent, the system **shall** provide a follow-camera mode tracking the selected agent.

#### R6.3 Agent Visualization (Ubiquitous)

- **R6.3.1**: The system **shall** render agents as 3D character models or distinct geometric representations.
- **R6.3.2**: The system **shall** display agent name labels above their 3D representation.
- **R6.3.3**: The system **shall** visually indicate agent state (moving, talking, idle, sleeping) through animation or color.

### R7: Control Panel UI

#### R7.1 Settings Panel (Ubiquitous)

- **R7.1.1**: The system **shall** provide a control panel with tabs for: API Settings, Simulation, Agents, Camera, Weather, Vehicles, and System.
- **R7.1.2**: The system **shall** persist all panel settings in browser storage.

#### R7.2 API Settings Tab (Event-Driven)

- **R7.2.1**: **When** the user enters a Gemini API key, the system **shall** validate the key and store it securely in browser storage.
- **R7.2.2**: **When** no valid API key is configured, the system **shall** display a setup prompt before allowing simulation start.

#### R7.3 Simulation Controls (Event-Driven)

- **R7.3.1**: **When** the user clicks Play/Pause, the system **shall** start or pause the simulation loop.
- **R7.3.2**: **When** the user adjusts simulation speed, the system **shall** change the tick rate accordingly (0.5x, 1x, 2x, 4x).
- **R7.3.3**: **When** the user clicks Reset, the system **shall** clear all agents and regenerate the city.

#### R7.4 Agent Management Tab (Event-Driven)

- **R7.4.1**: **When** the user requests to add an agent, the system **shall** generate a new agent via Gemini API.
- **R7.4.2**: **When** the user selects an agent from the list, the system **shall** display agent details (name, personality, current action, memory log).
- **R7.4.3**: **When** the user clicks on an agent in the 3D scene, the system **shall** select that agent and open its details.

#### R7.5 Information Overlay (Optional)

- **R7.5.1**: **Where** performance permits, the system **shall** display a real-time minimap of the city with agent positions.
- **R7.5.2**: **Where** the user enables it, the system **shall** show agent conversation bubbles in the 3D scene.

### R8: Gemini API Integration

#### R8.1 API Proxy (Ubiquitous)

- **R8.1.1**: The system **shall** proxy all Gemini API calls through Next.js API routes to protect the API key from client-side exposure.
- **R8.1.2**: The system **shall** implement rate limiting on API proxy routes.

#### R8.2 Prompt Engineering (Ubiquitous)

- **R8.2.1**: The system **shall** use structured prompts for agent generation, decision-making, and conversation with consistent JSON response schemas.
- **R8.2.2**: The system **shall** include agent personality, current state, nearby context, and memory in decision prompts.

#### R8.3 Error Handling (Event-Driven)

- **R8.3.1**: **When** a Gemini API call fails, the system **shall** fall back to a deterministic behavior (random movement, scripted responses).
- **R8.3.2**: **When** the API rate limit is exceeded, the system **shall** queue pending requests and retry with exponential backoff.

#### R8.4 Cost Optimization (Ubiquitous)

- **R8.4.1**: The system **shall** batch agent decision requests where possible to minimize API calls.
- **R8.4.2**: The system **shall** cache recent Gemini responses for identical context to avoid redundant calls.

---

## Specifications

### S1: Technology Stack

| Layer            | Technology                                      |
| ---------------- | ----------------------------------------------- |
| Framework        | Next.js 15+ (App Router)                        |
| Language         | TypeScript 5.5+                                 |
| 3D Engine        | Three.js via @react-three/fiber, @react-three/drei |
| AI API           | Google Gemini API (@google/generative-ai)        |
| State Management | Zustand                                          |
| Styling          | Tailwind CSS 4.x                                |
| UI Components    | shadcn/ui (for control panel)                   |
| Map Data         | OpenStreetMap Overpass API + Nominatim Geocoding  |
| Pathfinding      | Custom A* implementation on OSM road graph        |
| Storage          | IndexedDB (via idb) + localStorage               |
| Linting          | ESLint + Prettier                                |
| Testing          | Vitest + React Testing Library + Playwright      |
| Package Manager  | pnpm                                             |

### S2: Project File Structure

```
MESAsim/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Main simulation page
│   │   └── api/
│   │       └── gemini/
│   │           └── route.ts          # Gemini API proxy
│   ├── components/
│   │   ├── scene/                    # 3D scene components
│   │   │   ├── SimulationScene.tsx   # Main R3F Canvas
│   │   │   ├── CityRenderer.tsx      # City buildings/roads
│   │   │   ├── AgentRenderer.tsx     # Agent 3D models
│   │   │   ├── VehicleRenderer.tsx   # Vehicle models
│   │   │   ├── WeatherEffects.tsx    # Rain/weather particles
│   │   │   ├── Lighting.tsx          # Day/night lighting
│   │   │   └── CameraController.tsx  # Orbit/follow camera
│   │   ├── ui/                       # Control panel UI
│   │   │   ├── ControlPanel.tsx      # Tab container
│   │   │   ├── ApiSettingsTab.tsx    # API key config
│   │   │   ├── SimulationTab.tsx     # Play/pause/speed
│   │   │   ├── AgentTab.tsx          # Agent management
│   │   │   ├── CameraTab.tsx         # Camera controls
│   │   │   ├── WeatherTab.tsx        # Weather settings
│   │   │   ├── VehicleTab.tsx        # Vehicle settings
│   │   │   └── SystemTab.tsx         # Debug/system info
│   │   └── overlay/                  # HUD overlay
│   │       ├── Minimap.tsx           # City minimap
│   │       └── AgentBubble.tsx       # Conversation bubbles
│   ├── simulation/                   # Core simulation logic
│   │   ├── engine.ts                 # Simulation loop/tick
│   │   ├── types.ts                  # Core type definitions
│   │   └── config.ts                 # Simulation configuration
│   ├── agents/                       # Agent system
│   │   ├── agent-core.ts             # Agent class/state machine
│   │   ├── agent-generation.ts       # LLM-powered agent creation
│   │   ├── agent-movement.ts         # Movement along paths
│   │   ├── agent-interaction.ts      # Agent-to-agent interaction
│   │   ├── agent-home.ts             # Home assignment logic
│   │   ├── agent-memory.ts           # Agent memory management
│   │   └── agent-storage.ts          # IndexedDB persistence
│   ├── city/                         # City system (Korea-based)
│   │   ├── osm-fetcher.ts           # OpenStreetMap Overpass API client
│   │   ├── osm-parser.ts            # OSM data → 3D city conversion
│   │   ├── korean-regions.ts        # Korean region presets (si/gu/dong)
│   │   ├── building-types.ts        # Korean building type classification
│   │   ├── road-network.ts          # Road graph from OSM highway data
│   │   └── city-config.ts           # City configuration/presets
│   ├── systems/                      # Additional systems
│   │   ├── pathfinding.ts            # A* pathfinding implementation
│   │   ├── weather.ts                # Weather state machine
│   │   ├── vehicles.ts               # Vehicle management
│   │   └── day-night-cycle.ts        # Time/lighting simulation
│   ├── services/                     # External services
│   │   ├── gemini-client.ts          # Gemini API client
│   │   ├── gemini-prompts.ts         # Prompt templates
│   │   └── gemini-cache.ts           # Response caching
│   ├── stores/                       # Zustand stores
│   │   ├── simulation-store.ts       # Simulation state
│   │   ├── agent-store.ts            # Agent state
│   │   ├── city-store.ts             # City state
│   │   ├── ui-store.ts               # UI/panel state
│   │   └── settings-store.ts         # Settings/config state
│   ├── hooks/                        # React hooks
│   │   ├── useSimulation.ts          # Simulation lifecycle
│   │   ├── useAgentSelection.ts      # Agent selection/tracking
│   │   └── useWeather.ts             # Weather effects
│   ├── lib/                          # Utilities
│   │   ├── math.ts                   # Vector/math utilities
│   │   ├── random.ts                 # Seeded random generator
│   │   └── constants.ts              # Global constants
│   └── types/                        # Shared type definitions
│       ├── agent.ts                  # Agent types
│       ├── city.ts                   # City/building types
│       ├── simulation.ts             # Simulation types
│       └── gemini.ts                 # API response types
├── public/
│   └── models/                       # 3D model assets (GLB)
├── tests/
│   ├── unit/                         # Unit tests
│   │   ├── agents/
│   │   ├── city/
│   │   ├── systems/
│   │   └── services/
│   ├── integration/                  # Integration tests
│   └── e2e/                          # Playwright E2E tests
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── package.json
└── .env.local                        # API keys (gitignored)
```

### S3: Module Breakdown

| Module        | Files | Description                                  |
| ------------- | ----- | -------------------------------------------- |
| Agent System  | 7     | Core agent logic, generation, movement, interaction, home, memory, storage |
| City System   | 6     | OSM data fetching/parsing, Korean regions, building types, road network, config |
| Pathfinding   | 1     | A* algorithm on road graph                    |
| Weather       | 1     | Weather state machine with particle effects   |
| Vehicles      | 1     | Vehicle spawning and management               |
| Day/Night     | 1     | Time simulation and lighting                  |
| Gemini Service| 3     | API client, prompt templates, response cache  |
| Stores        | 5     | Zustand state stores                          |
| 3D Scene      | 7     | React Three Fiber scene components            |
| Control Panel | 8     | UI tab components                             |
| Overlay       | 2     | Minimap and conversation bubbles              |
| Simulation    | 3     | Engine, types, configuration                  |
| Hooks         | 3     | React hooks                                   |
| Utilities     | 3     | Math, random, constants                       |
| Types         | 4     | Shared TypeScript type definitions            |
| API Routes    | 1     | Gemini API proxy                              |

### S4: Key Data Models

```typescript
// Agent
interface Agent {
  id: string;
  name: string;
  personality: AgentPersonality;
  occupation: string;
  position: Vector3;
  destination: Vector3 | null;
  currentPath: Vector3[];
  state: AgentState; // 'idle' | 'moving' | 'interacting' | 'sleeping'
  homeBuilding: string;
  memory: AgentMemory[];
  relationships: Map<string, number>; // agentId -> affinity score
  dailyRoutine: RoutineEntry[];
  speed: number;
}

// City
interface Building {
  id: string;
  type: BuildingType;
  position: Vector3;
  size: { width: number; height: number; depth: number };
  color: string;
  occupants: string[];
}

// Road Network
interface RoadNode {
  id: string;
  position: Vector2;
  connections: string[];
}

interface RoadEdge {
  from: string;
  to: string;
  weight: number;
}
```

### S5: Gemini API Integration Design

| Endpoint      | Purpose                            | Prompt Strategy                       |
| ------------- | ---------------------------------- | ------------------------------------- |
| POST /api/gemini | Proxy for all Gemini calls       | Structured JSON schema responses      |
| Agent Generation | Create new agent profile         | System prompt + city context          |
| Agent Decision   | Determine next action            | Agent state + nearby agents + memory  |
| Agent Conversation | Generate dialogue              | Both agents' profiles + topic + history |

### S6: Performance Budgets

| Metric                  | Target                |
| ----------------------- | --------------------- |
| Frame Rate              | >= 30 FPS (20 agents) |
| Initial Load            | < 5 seconds           |
| Agent Decision Latency  | < 3 seconds (API)     |
| Memory Usage            | < 512 MB              |
| Bundle Size (JS)        | < 2 MB gzipped        |

---

## Traceability

| Requirement | Plan Reference            | Acceptance Reference     |
| ----------- | ------------------------- | ------------------------ |
| R1.x        | plan.md - Milestone 1     | acceptance.md - SC1      |
| R2.x        | plan.md - Milestone 1     | acceptance.md - SC2      |
| R3.x        | plan.md - Milestone 1     | acceptance.md - SC3      |
| R4.x        | plan.md - Milestone 2     | acceptance.md - SC4      |
| R5.x        | plan.md - Milestone 2     | acceptance.md - SC5      |
| R6.x        | plan.md - Milestone 1     | acceptance.md - SC6      |
| R7.x        | plan.md - Milestone 2     | acceptance.md - SC7      |
| R8.x        | plan.md - Milestone 1     | acceptance.md - SC8      |

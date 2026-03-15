# MESAsim - Project Structure

## Architecture Pattern

Domain-driven layered architecture following a **Presentation -> Store -> Logic -> Infrastructure** flow:

- **Presentation** (`components/`): React and R3F components render the 3D scene and UI controls.
- **Store** (`stores/`): Zustand stores hold all application state, acting as the single source of truth.
- **Logic** (`agents/`, `simulation/`, `systems/`): Domain logic for agent behavior, the simulation engine loop, and algorithmic systems.
- **Infrastructure** (`services/`, `city/`, `lib/`): External API clients, data fetching/parsing, and shared utilities.

The simulation engine (`simulation/`) runs a decoupled `requestAnimationFrame` game loop independent of the React render cycle.

## Directory Tree

```
src/
├── app/                  - Next.js App Router entry points
│   ├── layout.tsx        - Root layout with metadata and font setup
│   ├── page.tsx          - Main page composing Scene and UI
│   └── api/
│       └── ai/
│           └── route.ts  - POST /api/ai endpoint (Gemini proxy with rate limiting)
│
├── agents/               - Agent domain (core behavior and lifecycle)
│   ├── core.ts           - Agent creation, update tick, status management
│   ├── generation.ts     - AI-powered agent generation via Gemini
│   ├── movement.ts       - Movement logic, destination selection, speed
│   ├── interaction.ts    - Agent-to-agent interaction and conversation triggers
│   ├── memory.ts         - Agent memory system (event recording, recall)
│   ├── home.ts           - Home location assignment and return behavior
│   └── storage.ts        - IndexedDB persistence for agent state
│
├── city/                 - City domain (geographic data and rendering data)
│   ├── osmFetcher.ts     - OpenStreetMap Overpass API client
│   ├── osmParser.ts      - Raw OSM data to internal city model parser
│   ├── buildingTypes.ts  - Building classification and metadata
│   ├── roadNetwork.ts    - Road graph construction for pathfinding
│   └── koreanRegions.ts  - Predefined bounding boxes for 8 Korean regions
│
├── components/
│   ├── scene/            - React Three Fiber 3D scene components
│   │   ├── SimulationScene.tsx  - Top-level R3F Canvas and scene graph
│   │   ├── CityRenderer.tsx     - Buildings, roads, ground plane rendering
│   │   ├── AgentRenderer.tsx    - Agent mesh instances and labels
│   │   ├── Lighting.tsx         - Day/night cycle directional and ambient light
│   │   └── Camera.tsx           - Orbit camera controls and positioning
│   │
│   └── ui/               - 2D control panel overlay
│       ├── ControlPanel.tsx     - Tabbed panel container
│       ├── SimulationTab.tsx    - Play/pause, speed, time, weather controls
│       ├── AgentTab.tsx         - Agent list, selection, detail inspector
│       └── ApiSettingsTab.tsx   - Gemini API key and model configuration
│
├── lib/                  - Shared utilities
│   ├── utils.ts          - cn() helper (clsx + tailwind-merge)
│   └── math.ts           - Coordinate conversion (lat/lng to local 3D)
│
├── services/             - External service clients
│   ├── geminiClient.ts   - Google Gemini API wrapper
│   ├── prompts.ts        - Prompt templates for generation, decision, conversation
│   └── cache.ts          - Client-side TTL cache for API responses
│
├── simulation/           - Simulation engine (decoupled from React)
│   ├── engine.ts         - requestAnimationFrame game loop, tick dispatch
│   └── config.ts         - Simulation constants (tick rate, bounds, defaults)
│
├── stores/               - Zustand 5 state management
│   ├── simulationStore.ts  - Simulation status, config, time, weather, tickCount
│   ├── agentStore.ts       - Agents Map, selectedAgentId, spatial queries
│   ├── cityStore.ts        - CityData, loading state, selectedRegion
│   ├── uiStore.ts          - activeTab, showMinimap, showBubbles, showDebug
│   └── settingsStore.ts    - geminiApiKey, geminiModel, autoSave (persisted)
│
├── systems/              - Algorithmic systems
│   └── pathfinding.ts    - A* search on road graph with binary min-heap
│
└── types/                - TypeScript type definitions
    ├── agent.ts          - Agent, Personality (OCEAN), AgentMemory, AgentAction
    ├── city.ts           - CityData, Building, Road, Region
    ├── simulation.ts     - SimulationConfig, TimeOfDay, Weather
    └── gemini.ts         - Gemini request/response types, prompt parameters
```

## Key File Locations

| Concern | Primary File |
|---|---|
| App entry point | `src/app/page.tsx` |
| API route | `src/app/api/ai/route.ts` |
| Simulation loop | `src/simulation/engine.ts` |
| Agent lifecycle | `src/agents/core.ts` |
| Pathfinding | `src/systems/pathfinding.ts` |
| City data fetch | `src/city/osmFetcher.ts` |
| 3D scene root | `src/components/scene/SimulationScene.tsx` |
| State (agents) | `src/stores/agentStore.ts` |
| State (simulation) | `src/stores/simulationStore.ts` |
| Type definitions | `src/types/` |

## Module Relationships

- `simulation/engine.ts` drives the tick loop, calling into `agents/core.ts` for each agent update.
- `agents/core.ts` delegates to `agents/movement.ts`, `agents/interaction.ts`, and `agents/memory.ts`.
- `agents/movement.ts` uses `systems/pathfinding.ts` which operates on the road graph built by `city/roadNetwork.ts`.
- `agents/generation.ts` and `agents/interaction.ts` call `services/geminiClient.ts` through the `/api/ai` proxy.
- `components/scene/` reads from `stores/agentStore` and `stores/cityStore` to render the 3D world.
- `components/ui/` reads from and writes to all five Zustand stores for user interaction.
- `stores/settingsStore.ts` persists to localStorage; `agents/storage.ts` persists to IndexedDB via `idb`.

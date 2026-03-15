# Dependencies

## External Dependencies

### Framework and Runtime

| Package | Version | Purpose |
|---------|---------|---------|
| next | 15 | Application framework, App Router, API routes, static export |
| react | 19 | UI component library, hooks, concurrent features |
| react-dom | 19 | DOM rendering |

### 3D Rendering

| Package | Version | Purpose |
|---------|---------|---------|
| three | 0.171 | 3D graphics engine, geometry, materials, scene graph |
| @react-three/fiber | 8 | React reconciler for Three.js, declarative 3D components |
| @react-three/drei | 9 | R3F utilities -- OrbitControls, helpers, abstractions |

### State Management

| Package | Version | Purpose |
|---------|---------|---------|
| zustand | 5 | Lightweight reactive state management with subscriptions |

### AI Integration

| Package | Version | Purpose |
|---------|---------|---------|
| @google/generative-ai | 0.24 | Google Gemini API client for agent personality generation |

### Data and Validation

| Package | Version | Purpose |
|---------|---------|---------|
| zod | 3.24 | Runtime type validation for API responses and configuration |
| idb | 8 | Promise-based IndexedDB wrapper for agent persistence |

### Styling

| Package | Version | Purpose |
|---------|---------|---------|
| tailwindcss | 4 | Utility-first CSS framework |
| clsx | - | Conditional className composition |
| tailwind-merge | - | Intelligent Tailwind class merging to resolve conflicts |

## Internal Module Dependency Map

### Presentation Layer Dependencies

```
components/scene/
  SimulationScene.tsx  --> CityRenderer, AgentRenderer, CameraController
  CityRenderer.tsx     --> stores/city-store (buildings, roads)
                       --> types/ (CityData)
  AgentRenderer.tsx    --> stores/agent-store (agent positions, states)
                       --> types/ (Agent)
  CameraController.tsx --> stores/ui-store (selectedAgentId)
                       --> stores/agent-store (agent position for follow)

components/ui/
  ControlPanel.tsx     --> RegionSelector, SimulationControls, AgentInspector
  RegionSelector.tsx   --> stores/city-store (setCityData)
                       --> city/regions (region presets)
                       --> city/osm-fetcher (fetchOSMData)
  SimulationControls   --> stores/simulation-store (play, pause, speed)
  AgentInspector.tsx   --> stores/agent-store (selected agent data)
                       --> stores/ui-store (selectedAgentId)
```

### Domain Logic Layer Dependencies

```
agents/
  agent-generation.ts  --> services/gemini-client (AI generation)
                       --> types/agent (Agent type)
  agent-movement.ts    --> systems/pathfinding (findPath)
                       --> city/road-network (getNearestNode)
  agent-interaction.ts --> services/gemini-client (AI interaction)
                       --> agents/agent-memory (read/write memories)
  agent-processing.ts  --> stores/agent-store (updateAgent)
                       --> agents/agent-movement
                       --> agents/agent-interaction
  agent-persistence.ts --> idb (IndexedDB operations)
                       --> stores/agent-store (agent data)

simulation/
  engine.ts            --> stores/simulation-store (time, tick state)
                       --> stores/agent-store (all agents)
                       --> agents/agent-processing (processAgents)

city/
  osm-fetcher.ts       --> Overpass API (external HTTP)
  osm-parser.ts        --> city/building, city/road, city/intersection
  road-network.ts      --> city/road, city/intersection (graph construction)
```

### Infrastructure Layer Dependencies

```
services/
  gemini-client.ts     --> app/api/ai/route.ts (HTTP POST)
                       --> types/gemini (request/response types)
  prompt-builders.ts   --> types/agent (Agent personality data)
  cache.ts             --> (self-contained, no external deps)

systems/
  pathfinding.ts       --> city/road-network (graph nodes, edges)
```

### API Route Dependencies

```
app/api/ai/route.ts   --> @google/generative-ai (Gemini SDK)
                       --> zod (request validation)
```

## Dependency Flow Summary

The dependency flow is strictly top-down through layers:

1. **Presentation** reads from **Stores** and triggers **Domain Logic** via store actions
2. **Stores** are written to by **Domain Logic** layer
3. **Domain Logic** uses **Infrastructure** for AI, pathfinding, and persistence
4. **Infrastructure** communicates with external APIs and browser storage
5. No circular dependencies exist between layers

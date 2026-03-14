# SPEC-SIM-001: Implementation Plan

## SPEC Reference

| Field    | Value       |
| -------- | ----------- |
| SPEC ID  | SPEC-SIM-001 |
| Title    | MESAsim - 3D Autonomous Agent Simulation Service |
| Priority | High        |

---

## Technical Approach

### Architecture Overview

MESAsim follows a **client-heavy, server-light** architecture:

- **Client-side**: All simulation logic, 3D rendering, agent management, pathfinding, and weather run in the browser using React Three Fiber and Zustand.
- **Server-side**: Next.js API routes serve as a thin proxy layer to the Gemini API, providing API key protection and rate limiting.
- **Persistence**: Browser-local storage (IndexedDB) for agent state, simulation snapshots, and settings.

### Core Design Decisions

1. **React Three Fiber over raw Three.js**: Provides React component lifecycle integration, declarative scene graph, and hooks-based API. Maintains Three.js performance while fitting the React/Next.js ecosystem.

2. **Zustand over Redux/Context**: Lightweight, minimal boilerplate, excellent React Three Fiber integration (can read state outside React render cycle for game loops).

3. **A* on client-side**: Pathfinding runs entirely in the browser. Road graphs are small enough (hundreds of nodes) for real-time A* computation.

4. **Simulation tick loop**: A `requestAnimationFrame`-based game loop decoupled from React rendering. Zustand stores bridge simulation state to React components.

5. **Gemini API proxy pattern**: All LLM calls go through `/api/gemini` route. Client never sees the API key. Rate limiting and caching happen server-side.

---

## Milestones

### Milestone 1: Foundation (Primary Goal)

**Scope**: Core simulation loop, city generation, agent system basics, 3D rendering, Gemini integration.

**Deliverables**:
- Next.js project scaffolding with TypeScript, Tailwind, R3F
- Simulation engine with tick-based game loop
- Procedural city generation (grid layout with buildings and roads)
- Road network graph construction
- A* pathfinding implementation
- Basic agent creation (hardcoded profiles, no LLM yet)
- Agent movement along computed paths
- 3D scene rendering: city, buildings, roads, agents
- Camera controls (orbit, pan, zoom)
- Gemini API proxy route with rate limiting
- Gemini client with structured prompt/response handling
- LLM-powered agent generation (name, personality, routine)
- Basic Zustand stores (simulation, agents, city, settings)

**Requirements Covered**: R1.1, R1.2, R1.3, R2.1, R2.2, R2.3, R3.1, R3.2, R3.3, R6.1, R6.2, R6.3, R8.1, R8.2

### Milestone 2: Intelligence and Systems (Secondary Goal)

**Scope**: Agent decision-making, interactions, weather, vehicles, control panel UI.

**Deliverables**:
- LLM-powered agent decision-making (idle -> choose action)
- Agent-to-agent interaction with generated conversations
- Agent memory system (store/recall interaction summaries)
- Agent home assignment and nighttime behavior
- Weather state machine (clear, cloudy, rainy, stormy)
- Weather visual effects (rain particles, lighting changes)
- Weather impact on agent behavior
- Day/night cycle with dynamic lighting
- Vehicle spawning and road movement
- Control panel with all 7 tabs
- API settings management (key input, validation)
- Simulation controls (play, pause, speed, reset)
- Agent management tab (list, details, add/remove)

**Requirements Covered**: R1.4, R1.5, R4.1, R4.2, R4.3, R5.1, R5.2, R7.1, R7.2, R7.3, R7.4

### Milestone 3: Polish and Optimization (Tertiary Goal)

**Scope**: Persistence, cost optimization, performance, overlay features.

**Deliverables**:
- IndexedDB persistence for agent state
- Simulation save/load functionality
- Gemini response caching
- Batched agent decision requests
- API error handling with deterministic fallback
- Exponential backoff retry logic
- Follow-camera mode for selected agents
- Minimap overlay
- Conversation bubble overlay
- Performance optimization (instanced meshes, LOD)
- Agent click-to-select in 3D scene

**Requirements Covered**: R1.6, R7.5, R8.3, R8.4

### Milestone 4: Quality and Testing (Final Goal)

**Scope**: Testing suite, documentation, production readiness.

**Deliverables**:
- Unit tests for pathfinding, city generation, agent logic
- Integration tests for Gemini API proxy
- E2E tests for simulation lifecycle (Playwright)
- Performance benchmarks (FPS, memory, load time)
- Error boundary and graceful degradation
- Accessibility for control panel UI

---

## Architecture Design Direction

### Component Architecture

```
[Next.js App Router]
  ├── page.tsx (main layout)
  │   ├── <SimulationScene />  (R3F Canvas - 3D viewport)
  │   │   ├── <CityRenderer />
  │   │   ├── <AgentRenderer />
  │   │   ├── <VehicleRenderer />
  │   │   ├── <WeatherEffects />
  │   │   ├── <Lighting />
  │   │   └── <CameraController />
  │   ├── <ControlPanel />     (Tabbed sidebar)
  │   └── <OverlayHUD />       (Minimap, bubbles)
  └── api/gemini/route.ts      (API proxy)
```

### State Flow

```
Simulation Engine (tick loop)
  → Updates agent positions, weather, vehicles
  → Writes to Zustand stores
  → React components subscribe and re-render
  → R3F renders updated 3D scene
```

### Gemini API Flow

```
Agent needs decision
  → Client calls /api/gemini with agent context
  → Next.js API route forwards to Gemini API
  → Response parsed as structured JSON
  → Agent state updated with decision
  → Cache response for identical contexts
```

---

## Risks and Mitigation

| Risk | Severity | Mitigation |
| ---- | -------- | ---------- |
| Gemini API latency causes simulation stutter | High | Async non-blocking calls; agents continue last action while awaiting; decision queue with timeout |
| Gemini API costs escalate with many agents | High | Response caching, batched requests, configurable decision interval, deterministic fallback mode |
| Browser performance degrades with many agents | Medium | Instanced rendering, LOD, configurable agent cap (max 50), FPS monitoring |
| WebGL compatibility issues | Low | Feature detection on load, fallback message for unsupported browsers |
| Gemini structured output parsing failures | Medium | Zod validation on responses, retry with simplified prompt, deterministic fallback |
| IndexedDB storage limits | Low | Storage quota monitoring, oldest data eviction, user notification |

---

## Dependencies

### External Dependencies

| Package                    | Purpose                     |
| -------------------------- | --------------------------- |
| next                       | Application framework       |
| react, react-dom           | UI framework                |
| @react-three/fiber         | React Three.js integration  |
| @react-three/drei          | R3F helper components       |
| three                      | 3D rendering engine         |
| @google/generative-ai      | Gemini API client           |
| zustand                    | State management            |
| tailwindcss                | Styling                     |
| idb                        | IndexedDB wrapper           |
| zod                        | Schema validation           |

### Development Dependencies

| Package                    | Purpose                     |
| -------------------------- | --------------------------- |
| typescript                 | Type safety                 |
| vitest                     | Unit testing                |
| @testing-library/react     | Component testing           |
| playwright                 | E2E testing                 |
| eslint                     | Linting                     |
| prettier                   | Formatting                  |

---

## Traceability

| Requirement | Milestone   |
| ----------- | ----------- |
| R1.1-R1.3   | Milestone 1 |
| R1.4-R1.5   | Milestone 2 |
| R1.6        | Milestone 3 |
| R2.x        | Milestone 1 |
| R3.x        | Milestone 1 |
| R4.x        | Milestone 2 |
| R5.x        | Milestone 2 |
| R6.x        | Milestone 1 |
| R7.1-R7.4   | Milestone 2 |
| R7.5        | Milestone 3 |
| R8.1-R8.2   | Milestone 1 |
| R8.3-R8.4   | Milestone 3 |

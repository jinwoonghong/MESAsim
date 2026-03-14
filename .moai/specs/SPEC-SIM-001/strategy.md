# Execution Strategy: SPEC-SIM-001 (Milestone 1 - Foundation)

Created: 2026-03-15
SPEC Version: 1.0.0
Status: READY FOR APPROVAL
Development Mode: hybrid (TDD for all new code - greenfield project)

---

## 1. Overview

### SPEC Summary

MESAsim is a web-based 3D autonomous agent simulation where AI-powered agents (via Gemini API) live in real Korean cities rendered in 3D. Users select a Korean region (Gangnam, Hongdae, Haeundae, etc.) and the system fetches real map data from OpenStreetMap to build a 3D city environment. The simulation runs client-side with Next.js API routes proxying Gemini API calls.

### Milestone 1 Scope (Foundation)

This strategy covers **Milestone 1** which establishes the core foundation:

- Next.js project scaffolding with full toolchain
- Korean map integration (OpenStreetMap Overpass API + Nominatim)
- Core simulation engine (tick-based game loop)
- Basic agent system (creation, movement, state machine)
- A* pathfinding on OSM road network
- 3D scene rendering with React Three Fiber
- Gemini API proxy with structured prompts
- Zustand state stores

### Requirements Covered

| Requirement Group | IDs | Description |
|---|---|---|
| Agent Core | R1.1.1-R1.1.3 | Agent identity, lifecycle, tick updates |
| Agent Generation | R1.2.1-R1.2.2 | Gemini-powered profile creation |
| Agent Movement | R1.3.1-R1.3.3 | Path-following movement, fallback destinations |
| City Map Data | R2.1.1-R2.1.3 | OSM Overpass API, WGS84 conversion, IndexedDB cache |
| Region Selection | R2.2.1-R2.2.4 | Korean si/gu/dong selection, Nominatim geocoding, presets |
| Building Rendering | R2.3.1-R2.3.3 | OSM building extrusion, Korean type classification, color coding |
| Road Network | R2.4.1-R2.4.3 | OSM highway extraction, Korean road features, navigation graph |
| Pathfinding Graph | R3.1.1-R3.1.2 | Graph from OSM, node/edge representation |
| Route Computation | R3.2.1-R3.2.2 | A* shortest path, waypoint sequences |
| Path Constraints | R3.3.1-R3.3.2 | No building traversal, no disconnected paths |
| Scene Management | R6.1.1-R6.1.2 | R3F rendering, 30 FPS target |
| Camera System | R6.2.1 | Orbit/pan/zoom controls |
| Agent Visualization | R6.3.1-R6.3.3 | 3D agent models, name labels, state indication |
| API Proxy | R8.1.1-R8.1.2 | Server-side proxy, rate limiting |
| Prompt Engineering | R8.2.1-R8.2.2 | Structured JSON prompts, context-rich decision prompts |

### Exclusions (Milestone 2+)

- Agent interaction/conversation (R1.4)
- Agent home management (R1.5)
- Agent persistence/IndexedDB (R1.6)
- Weather system (R4.x)
- Vehicle system (R5.x)
- Follow-camera mode (R6.2.2)
- Control panel UI tabs (R7.x)
- Minimap and overlays (R7.5)
- Error fallback/retry (R8.3)
- Response caching (R8.4)

---

## 2. Technology Stack

### Core Dependencies

| Library | Version | Purpose | Selection Rationale |
|---|---|---|---|
| next | ^15.1.0 | App framework | App Router, API routes, SSR/SSG, React 19 support |
| react / react-dom | ^19.0.0 | UI framework | Latest stable, required by Next.js 15 |
| typescript | ^5.7.0 | Type safety | Strict mode, satisfies TS 5.5+ requirement |
| @react-three/fiber | ^9.0.0 | React Three.js | Declarative 3D, React lifecycle integration |
| @react-three/drei | ^9.120.0 | R3F helpers | OrbitControls, Html, Text, useful abstractions |
| three | ^0.172.0 | 3D engine | Peer dependency for R3F |
| @google/generative-ai | ^0.24.0 | Gemini API | Official Google SDK for Gemini |
| zustand | ^5.0.0 | State management | Lightweight, works outside React render cycle |
| tailwindcss | ^4.0.0 | Styling | Utility-first CSS, v4 with new engine |
| idb | ^8.0.0 | IndexedDB wrapper | Promise-based, lightweight, typed |
| zod | ^3.24.0 | Schema validation | Gemini response validation, type inference |

### Development Dependencies

| Library | Version | Purpose | Selection Rationale |
|---|---|---|---|
| vitest | ^3.0.0 | Unit testing | Fast, Vite-native, TypeScript first-class |
| @testing-library/react | ^16.0.0 | Component testing | React 19 compatible, best practices |
| playwright | ^1.50.0 | E2E testing | Cross-browser, reliable, good DX |
| eslint | ^9.0.0 | Linting | Flat config, modern ESLint |
| prettier | ^3.4.0 | Formatting | Code style consistency |
| @types/three | ^0.172.0 | Three.js types | TypeScript support for Three.js |

### shadcn/ui Components (installed on-demand)

- Button, Input, Tabs, Card, Label, Select, Slider, Switch, ScrollArea
- Installed via CLI as needed per phase

### Environmental Requirements

- Node.js: 20.x LTS or 22.x
- pnpm: 9.x+
- Browser: ES2022+, WebGL 2.0

---

## 3. TAG Chain Design

### TAG List

```
TAG-001 (Scaffolding)
  --> TAG-002 (Types & Stores)
    --> TAG-003 (City/OSM) + TAG-004 (Gemini API)  [parallel]
      --> TAG-005 (Pathfinding)  [depends on TAG-003]
        --> TAG-006 (Agent System)  [depends on TAG-004, TAG-005]
          --> TAG-007 (3D Rendering)  [depends on TAG-003, TAG-006]
```

### TAG Dependency Diagram

```
[TAG-001] --> [TAG-002] --> [TAG-003] ---------> [TAG-005] --> [TAG-006] --> [TAG-007]
                       \                                  /
                        --> [TAG-004] ------------------>
```

### TAG Details

#### TAG-001: Project Scaffolding

- **Purpose**: Initialize Next.js project with all toolchain configuration
- **Scope**: Project creation, package installation, config files, directory structure
- **Completion Criteria**: Project builds and runs with `pnpm dev`, all configs valid
- **Dependencies**: None
- **Complexity**: S
- **Files Created**: ~12 config files + directory structure

#### TAG-002: Core Types, Stores, and Simulation Engine

- **Purpose**: Define all TypeScript types, create Zustand stores, build simulation tick loop
- **Scope**: Type definitions (agent, city, simulation, gemini), 5 Zustand stores, simulation engine, utility functions
- **Completion Criteria**: All types compile, stores are importable, simulation loop ticks correctly
- **Dependencies**: TAG-001
- **Complexity**: M
- **Files Created**: ~15 files (types/, stores/, simulation/, lib/)

#### TAG-003: City System - Korean Map Integration

- **Purpose**: Fetch and parse real Korean city data from OpenStreetMap
- **Scope**: Overpass API client, OSM data parser (WGS84 to 3D), Korean region presets, building type classification, road network extraction, IndexedDB caching
- **Completion Criteria**: Can fetch Gangnam district data, parse buildings and roads, convert to local 3D coordinates, cache in IndexedDB
- **Dependencies**: TAG-002
- **Complexity**: XL
- **Files Created**: 6 files (city/)

#### TAG-004: Gemini API Integration

- **Purpose**: Create API proxy route and client for Gemini API communication
- **Scope**: Next.js API route with rate limiting, Gemini client library, prompt templates for agent generation/decisions, Zod response validation
- **Completion Criteria**: API proxy accepts requests, forwards to Gemini, returns validated structured JSON, rate limiting works
- **Dependencies**: TAG-002
- **Complexity**: M
- **Files Created**: 4 files (api/gemini/route.ts, services/gemini-*.ts)

#### TAG-005: Pathfinding System

- **Purpose**: Implement A* pathfinding on OSM-derived road network graph
- **Scope**: Graph construction from OSM road data, A* algorithm, waypoint generation, path validation (no building traversal)
- **Completion Criteria**: A* finds shortest path on OSM road graph within 50ms for 500 nodes, paths stay on roads
- **Dependencies**: TAG-003 (needs road network data)
- **Complexity**: M
- **Files Created**: 1 file (systems/pathfinding.ts)

#### TAG-006: Agent System Core

- **Purpose**: Implement agent state machine, Gemini-powered generation, and path-following movement
- **Scope**: Agent core (identity, lifecycle, state machine), agent generation via Gemini API, agent movement along computed paths
- **Completion Criteria**: Agents are created with Gemini-generated profiles, agents move along A* paths, state transitions work correctly
- **Dependencies**: TAG-004 (Gemini client), TAG-005 (pathfinding)
- **Complexity**: L
- **Files Created**: 3 files (agents/agent-core.ts, agent-generation.ts, agent-movement.ts)

#### TAG-007: 3D Rendering with React Three Fiber

- **Purpose**: Render Korean city, agents, and controls in 3D scene
- **Scope**: R3F Canvas setup, city renderer (OSM buildings + roads), agent renderer (3D representation + labels), basic lighting, camera controls (orbit/pan/zoom), main page layout
- **Completion Criteria**: 3D scene renders Korean city from OSM data, agents visible with name labels, camera controls work, 30+ FPS with 20 agents
- **Dependencies**: TAG-003 (city data), TAG-006 (agent data)
- **Complexity**: L
- **Files Created**: ~8 files (components/scene/, app/page.tsx, app/layout.tsx)

---

## 4. Step-by-Step Implementation Plan

### Phase 1: Project Scaffolding [TAG-001] -- Complexity: S

**Goal**: Working Next.js project with full development toolchain

**Tasks**:

| Task ID | Description | Requirement | TDD Approach |
|---|---|---|---|
| TASK-001 | Create Next.js 15 project with pnpm, TypeScript, Tailwind 4, App Router | - | Config validation |
| TASK-002 | Configure ESLint 9 (flat config) + Prettier | - | Lint check passes |
| TASK-003 | Configure Vitest with React Testing Library | - | Sample test runs |
| TASK-004 | Configure Playwright for E2E tests | - | Sample E2E runs |
| TASK-005 | Create src/ directory structure per S2 spec | - | Directories exist |
| TASK-006 | Install R3F dependencies (@react-three/fiber, drei, three) | - | Import resolves |
| TASK-007 | Install runtime deps (zustand, idb, zod, @google/generative-ai) | - | Import resolves |
| TASK-008 | Create .env.local template with GEMINI_API_KEY placeholder | - | Env loads |
| TASK-009 | Initialize shadcn/ui with Tailwind 4 integration | - | Component renders |

**Acceptance**: `pnpm dev` starts without errors, `pnpm test` runs, `pnpm lint` passes

---

### Phase 2: Core Types, Stores, and Engine [TAG-002] -- Complexity: M

**Goal**: All foundational types, state management, and simulation loop

**Tasks**:

| Task ID | Description | Requirement | TDD Approach |
|---|---|---|---|
| TASK-010 | Define Agent types (Agent, AgentPersonality, AgentState, AgentMemory, RoutineEntry) | R1.1.1 | Type compilation |
| TASK-011 | Define City types (Building, BuildingType, RoadNode, RoadEdge, CityData, OSMData) | R2.3.2 | Type compilation |
| TASK-012 | Define Simulation types (SimulationConfig, SimulationState, TickEvent) | R1.1.3 | Type compilation |
| TASK-013 | Define Gemini types (GeminiRequest, GeminiResponse, AgentProfile, AgentDecision) | R8.2.1 | Zod schema validates |
| TASK-014 | Implement simulation-store (state, tick count, speed, running flag) | R1.1.3 | RED: store returns initial state; GREEN: implement |
| TASK-015 | Implement agent-store (agents map, add/remove/update) | R1.1.1 | RED: CRUD operations; GREEN: implement |
| TASK-016 | Implement city-store (buildings, roads, region, loaded flag) | R2.1.1 | RED: store city data; GREEN: implement |
| TASK-017 | Implement settings-store (API key, simulation config) | R7.2.1 | RED: persist/retrieve settings; GREEN: implement |
| TASK-018 | Implement ui-store (selected agent, panel state) | - | RED: UI state toggle; GREEN: implement |
| TASK-019 | Implement simulation engine (rAF loop, tick dispatch, speed control) | R1.1.3 | RED: tick fires at interval; GREEN: implement loop |
| TASK-020 | Implement math utilities (Vector3 ops, distance, lerp) | - | RED: math operations; GREEN: implement |
| TASK-021 | Implement constants (default config values, building colors, speeds) | - | Constants importable |
| TASK-022 | Implement seeded random generator | - | RED: deterministic sequence; GREEN: implement |

**Acceptance**: All stores operational, simulation engine ticks, types compile in strict mode

---

### Phase 3: City System - Korean Map Integration [TAG-003] -- Complexity: XL

**Goal**: Fetch real Korean city data from OSM and convert to 3D-ready format

**Tasks**:

| Task ID | Description | Requirement | TDD Approach |
|---|---|---|---|
| TASK-023 | Define Korean region presets (Gangnam, Hongdae, Haeundae, Myeongdong) with bounding boxes | R2.2.4 | RED: preset lookup returns bbox; GREEN: implement data |
| TASK-024 | Implement Nominatim geocoding client (address/place to coordinates) | R2.2.3 | RED: geocode "Gangnam" returns coords; GREEN: HTTP client (mock in test) |
| TASK-025 | Implement Overpass API fetcher (bbox query for buildings, roads, amenities) | R2.1.1 | RED: fetch returns OSM XML/JSON; GREEN: HTTP client (mock in test) |
| TASK-026 | Implement OSM building parser (extract building footprints, heights, types) | R2.3.1 | RED: parse OSM building data to Building[]; GREEN: parser logic |
| TASK-027 | Implement Korean building type classifier (APT, officetel, commercial, cafe, etc.) | R2.3.2 | RED: classify OSM tags to BuildingType; GREEN: classification rules |
| TASK-028 | Implement WGS84 to local 3D coordinate converter | R2.1.2 | RED: lat/lon converts to x/z with correct scale; GREEN: projection math |
| TASK-029 | Implement OSM road parser (extract road segments, classify by highway type) | R2.4.1 | RED: parse OSM ways to RoadSegment[]; GREEN: parser logic |
| TASK-030 | Implement road network graph builder (intersections as nodes, segments as edges) | R2.4.3, R3.1.1, R3.1.2 | RED: OSM roads produce connected graph; GREEN: graph construction |
| TASK-031 | Implement IndexedDB cache for fetched map data | R2.1.3 | RED: store/retrieve map data from IDB; GREEN: idb wrapper |
| TASK-032 | Implement city configuration (default heights per type, road widths, color scheme) | R2.3.3 | RED: config returns expected values; GREEN: implement config |
| TASK-033 | Integration test: fetch Gangnam preset, parse, produce CityData | R2.2.2 | Full pipeline test with mocked HTTP |

**Acceptance**: Korean region data fetched, parsed, converted to 3D coordinates, cached in IndexedDB. Graph is connected and navigable.

---

### Phase 4: Gemini API Integration [TAG-004] -- Complexity: M

**Goal**: Working API proxy with structured prompt/response handling

**Tasks**:

| Task ID | Description | Requirement | TDD Approach |
|---|---|---|---|
| TASK-034 | Implement Next.js API route /api/gemini/route.ts (POST handler) | R8.1.1 | RED: route accepts POST, returns response; GREEN: implement handler |
| TASK-035 | Implement rate limiter for API route (30 req/60s sliding window) | R8.1.2 | RED: 31st request returns 429; GREEN: implement rate limiter |
| TASK-036 | Implement Gemini client (wraps @google/generative-ai SDK) | R8.1.1 | RED: client sends prompt, receives response; GREEN: implement (mock SDK) |
| TASK-037 | Implement agent generation prompt template | R8.2.1 | RED: template produces valid prompt with city context; GREEN: template |
| TASK-038 | Implement agent decision prompt template | R8.2.2 | RED: template includes personality, state, nearby context, memory; GREEN: template |
| TASK-039 | Implement Zod schemas for Gemini response validation | R8.2.1 | RED: valid JSON passes, invalid fails; GREEN: Zod schemas |
| TASK-040 | Implement API key injection (server-side only, never in client response) | R8.1.1 | RED: response contains no API key; GREEN: server-side injection |

**Acceptance**: API proxy forwards requests, rate limiting works, prompts are structured, responses are validated

---

### Phase 5: Pathfinding System [TAG-005] -- Complexity: M

**Goal**: A* pathfinding on OSM-derived road graph

**Tasks**:

| Task ID | Description | Requirement | TDD Approach |
|---|---|---|---|
| TASK-041 | Implement A* algorithm (generic graph, heuristic-based) | R3.2.1 | RED: A* finds shortest path on test graph; GREEN: algorithm |
| TASK-042 | Implement waypoint generation from A* path result | R3.2.2 | RED: path returns ordered Vector3 waypoints; GREEN: conversion |
| TASK-043 | Implement path validation (no building traversal check) | R3.3.1 | RED: path through building area rejected; GREEN: validation |
| TASK-044 | Implement disconnected segment detection | R3.3.2 | RED: path to disconnected node returns null; GREEN: connectivity check |
| TASK-045 | Performance test: A* on 500-node graph completes in <50ms | R3.2.1 | Benchmark test with generated graph |

**Acceptance**: A* finds shortest paths, respects road constraints, performs within 50ms on 500 nodes

---

### Phase 6: Agent System Core [TAG-006] -- Complexity: L

**Goal**: Agents with Gemini-generated profiles that move along computed paths

**Tasks**:

| Task ID | Description | Requirement | TDD Approach |
|---|---|---|---|
| TASK-046 | Implement agent-core (unique ID, state machine: spawned/active/idle/sleeping/removed) | R1.1.1, R1.1.2 | RED: state transitions are valid; GREEN: state machine |
| TASK-047 | Implement agent update on simulation tick | R1.1.3 | RED: active agent updates on tick; GREEN: tick handler |
| TASK-048 | Implement agent-generation (call Gemini for profile, create Agent instance) | R1.2.1 | RED: generation returns Agent with name/personality/occupation; GREEN: implementation |
| TASK-049 | Implement initial population generation on simulation start | R1.2.2 | RED: start creates N agents; GREEN: batch creation |
| TASK-050 | Implement agent-movement (follow path waypoints at configured speed) | R1.3.1 | RED: agent moves toward destination along path; GREEN: movement logic |
| TASK-051 | Implement idle agent destination selection (request Gemini decision) | R1.3.2 | RED: idle agent gets new destination; GREEN: decision flow |
| TASK-052 | Implement fallback destination when no valid path exists | R1.3.3 | RED: agent gets alternative when pathfinding fails; GREEN: fallback logic |

**Acceptance**: Agents are created via Gemini, move along A* paths, transition states correctly, handle pathfinding failures

---

### Phase 7: 3D Rendering [TAG-007] -- Complexity: L

**Goal**: Korean city and agents rendered in interactive 3D scene

**Tasks**:

| Task ID | Description | Requirement | TDD Approach |
|---|---|---|---|
| TASK-053 | Implement SimulationScene (R3F Canvas, scene setup, fog, ground plane) | R6.1.1 | Component renders without errors |
| TASK-054 | Implement CityRenderer (extrude OSM building polygons as 3D boxes, color by type) | R2.3.1, R2.3.3, R6.1.1 | RED: buildings render from CityData; GREEN: mesh generation |
| TASK-055 | Implement road rendering (flat geometry from OSM road segments, width by classification) | R2.4.1 | RED: roads render from road data; GREEN: road mesh |
| TASK-056 | Implement AgentRenderer (3D capsule/cylinder per agent, name labels via Html/Text) | R6.3.1, R6.3.2 | RED: agent visible with label; GREEN: mesh + label |
| TASK-057 | Implement agent state visualization (color/animation change per state) | R6.3.3 | RED: color changes with state; GREEN: state-to-visual mapping |
| TASK-058 | Implement Lighting (ambient + directional, basic daytime scene) | R6.1.1 | Light renders in scene |
| TASK-059 | Implement CameraController (OrbitControls wrapper, pan/zoom/orbit) | R6.2.1 | Camera responds to mouse input |
| TASK-060 | Implement main page layout (R3F canvas + placeholder panel sidebar) | R6.1.1 | Page renders with 3D viewport |
| TASK-061 | Implement app layout (root layout with Tailwind, fonts, metadata) | - | Layout renders correctly |
| TASK-062 | Performance validation: 30 FPS with 20 agents on medium city | R6.1.2 | FPS counter meets target |

**Acceptance**: 3D scene renders Korean city from OSM data, agents visible and moving, camera controls work, 30+ FPS target met

---

## 5. Task Dependency Map

```
TASK-001..009 (Phase 1: Scaffolding)
    |
    v
TASK-010..022 (Phase 2: Types/Stores/Engine)
    |
    +--> TASK-023..033 (Phase 3: City/OSM)    +--> TASK-034..040 (Phase 4: Gemini API)
    |         |                                        |
    |         v                                        |
    |    TASK-041..045 (Phase 5: Pathfinding)           |
    |         |                                        |
    |         +---------------+------------------------+
    |                         |
    |                         v
    |              TASK-046..052 (Phase 6: Agents)
    |                         |
    |         +---------------+
    |         |
    |         v
    +--> TASK-053..062 (Phase 7: 3D Rendering)
```

Phases 3 and 4 can run in **parallel** after Phase 2 completes.

---

## 6. Risks and Mitigation

### Technical Risks

| Risk | Severity | Probability | Mitigation |
|---|---|---|---|
| OSM Overpass API rate limiting or downtime | High | Medium | IndexedDB caching (R2.1.3), generous TTL, offline fallback with sample data |
| WGS84 to local 3D coordinate conversion produces inaccurate scale | High | Medium | Use Mercator projection centered on region centroid; validate against known distances (e.g., Gangnam block size) |
| Large Korean city datasets cause performance issues | High | Medium | Limit fetch area to ~1km radius, LOD for distant buildings, instanced meshes |
| Korean building data in OSM is incomplete (missing heights, types) | Medium | High | Fallback defaults per building type; Korean-specific heuristics (APT = 15 floors, etc.) |
| Gemini structured JSON output is unreliable | Medium | Medium | Zod validation + retry with simplified prompt + deterministic fallback |
| R3F game loop integration with rAF tick loop causes frame drops | Medium | Low | Decouple simulation tick from render frame; Zustand transient updates |
| Rate limiting on free Gemini API tier is restrictive | Medium | Medium | Aggressive client-side caching, batch requests, configurable decision interval |
| Three.js bundle size exceeds 2MB target | Low | Medium | Tree-shaking, dynamic imports for R3F, code splitting |

### Compatibility Risks

| Risk | Severity | Probability | Mitigation |
|---|---|---|---|
| R3F v9 breaking changes vs drei v9 | Medium | Low | Pin exact versions, test on install |
| Tailwind CSS v4 new engine API differences | Low | Low | Follow official migration guide, shadcn/ui v4 support |
| Next.js 15 App Router edge cases with R3F | Medium | Medium | Use "use client" directive for all R3F components, dynamic import with ssr: false |

---

## 7. Assumptions

| Assumption | Confidence | Risk if Wrong | Validation |
|---|---|---|---|
| OSM has adequate building/road data for major Korean cities (Gangnam, Hongdae) | High | City renders sparse/empty | Test with Overpass query for Gangnam before implementation |
| Korean region bounding boxes of ~500m-1km radius produce manageable data sizes | Medium | Too many/few objects | Benchmark Overpass response sizes for target areas |
| OSM `building:levels` tag coverage for Korean buildings is >30% | Low | Most buildings need height defaults | Prepare comprehensive fallback height table by Korean building type |
| Gemini API gemini-2.0-flash supports structured JSON output mode | High | Need alternate output parsing | Verify with SDK documentation |
| Browser IndexedDB storage is sufficient for cached map data (~5-20MB) | High | Storage quota errors | Monitor usage, implement eviction |
| 500-node road graph is sufficient for ~1km Korean neighborhood | Medium | Graph too small or too large | Count OSM road intersections for target areas |

---

## 8. Expert Delegation Recommendations

Based on SPEC keyword analysis, the following expert agents should be involved:

| Expert Agent | Trigger Keywords | Recommended Delegation |
|---|---|---|
| expert-backend | api, server, authentication, proxy, rate limiting | API proxy route design, rate limiter implementation, Gemini client architecture |
| expert-frontend | ui, component, page, client-side, 3D scene | R3F scene architecture, component composition, Zustand store design |

### Delegation Sequence

1. **expert-backend** for TAG-004 (Gemini API proxy + rate limiting)
2. **expert-frontend** for TAG-007 (R3F scene composition + UI layout)
3. Other TAGs can be implemented by **manager-ddd** (general implementation agent)

---

## 9. Effort Summary

| Phase | TAG | Complexity | Estimated Tasks | Key Challenge |
|---|---|---|---|---|
| Phase 1: Scaffolding | TAG-001 | S | 9 | Toolchain compatibility (Next.js 15 + Tailwind 4 + R3F) |
| Phase 2: Types/Stores | TAG-002 | M | 13 | Comprehensive type design for simulation domain |
| Phase 3: City/OSM | TAG-003 | XL | 11 | OSM data parsing, WGS84 projection, Korean classification |
| Phase 4: Gemini API | TAG-004 | M | 7 | Structured prompt design, rate limiting, response validation |
| Phase 5: Pathfinding | TAG-005 | M | 5 | A* performance on real OSM graph, edge case handling |
| Phase 6: Agents | TAG-006 | L | 7 | State machine design, Gemini integration for decisions |
| Phase 7: 3D Rendering | TAG-007 | L | 10 | OSM polygon extrusion, performance with many objects |
| **Total** | **7 TAGs** | **--** | **62 tasks** | |

### Parallel Execution Opportunities

- **Phase 3 (City/OSM) and Phase 4 (Gemini API)** can execute in parallel after Phase 2
- Within Phase 7, individual scene components (CityRenderer, AgentRenderer, Lighting, CameraController) can be developed in parallel

---

## 10. Approval Checklist

- [ ] Technology stack approved (Next.js 15, R3F 9, Zustand 5, Tailwind 4)
- [ ] TAG chain sequence approved (7 TAGs, dependency order)
- [ ] Milestone 1 scope approved (R1.1-R1.3, R2.1-R2.4, R3.x, R6.1-R6.3, R8.1-R8.2)
- [ ] Risk mitigation strategies approved
- [ ] Phase 3/4 parallel execution approved
- [ ] Expert delegation plan approved

---

## 11. Next Steps

Upon approval, hand over the following to **manager-ddd**:

1. **TAG chain**: TAG-001 through TAG-007 in dependency order
2. **Library versions**: Pinned versions as specified in Section 2
3. **Task decomposition**: 62 atomic tasks across 7 phases
4. **Key decisions**:
   - Client-heavy architecture (simulation in browser)
   - OSM Overpass API for real Korean map data
   - WGS84 Mercator projection for coordinate conversion
   - rAF-based tick loop decoupled from React render
   - Gemini API proxy pattern through /api/gemini
   - TDD methodology (greenfield project)
5. **Risk awareness**: OSM data completeness for Korean cities, Gemini structured output reliability
6. **Development mode**: hybrid (effectively TDD for all code since greenfield)

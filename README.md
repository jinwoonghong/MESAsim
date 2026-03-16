# MESAsim - 3D Autonomous Agent Simulation

A 3D autonomous agent simulation platform that renders Korean cityscapes from real OpenStreetMap data and populates them with AI-driven agents powered by Google Gemini. Agents with distinct personalities navigate city streets, interact with each other, and form memories in a dynamic day/night cycle with weather effects.

## Features

### Core Simulation
- **3D City Rendering** -- Real OpenStreetMap data for Korean regions (Gangnam, Hongdae, Haeundae, Myeongdong, Itaewon, Bukchon, Yeouido, Jeju)
- **AI-Powered Agents** -- Google Gemini API drives agent generation, decision-making, and conversation
- **A\* Pathfinding** -- Road-network-aware navigation with a binary min-heap priority queue
- **Agent Personalities** -- Big Five (OCEAN) personality traits shape agent behavior and interactions
- **Agent Memory & Interaction** -- Agents remember encounters, form relationships, and hold conversations
- **IndexedDB Persistence** -- Simulation state saved locally in the browser across page reloads

### Korean Urban Features
- **POI Markers** -- Category-colored 3D markers for restaurants, cafes, shops, schools, hospitals, parks, and subway entrances (gold diamond shape)
- **Korean Hangul Labels** -- Building name labels with LOD-based visibility (hidden beyond 200 units), Korean font support (Noto Sans KR)
- **Geocoding Search** -- Search any Korean location via Nominatim API, auto-loads OSM data for the selected region

### Visual Systems
- **Day/Night Cycle** -- Dynamic lighting transitions throughout simulation time
- **Weather Effects** -- Rain, snow, and fog particle effects with visual atmosphere changes
- **Vehicle System** -- Cars and buses spawning on roads with physics-based movement

### Overlay & UI
- **Minimap** -- 200x200 canvas overlay showing building footprints, roads, and agent positions with status-colored dots
- **Conversation Bubbles** -- 3D speech bubbles showing agent conversations with mood-colored indicators
- **Control Panel** -- Tabbed interface for simulation, agents, camera, weather, vehicles, and system settings

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js (App Router) | 15 |
| UI Library | React | 19 |
| Language | TypeScript (strict mode) | 5.7+ |
| 3D Rendering | React Three Fiber + Three.js | R3F 9 / Three 0.171 |
| 3D Helpers | @react-three/drei | 9 |
| State Management | Zustand | 5 |
| AI | Google Gemini API | 0.24 |
| Styling | Tailwind CSS | 4 |
| Validation | Zod | 3.24 |
| Storage | IndexedDB (idb) | 8 |
| Testing | Vitest | 2 |
| Linting | ESLint | 9 |
| Dev Server | Turbopack | built-in |

### External APIs

| API | Purpose | Rate Limit |
|-----|---------|------------|
| Nominatim | Geocoding (location name to coordinates) | 1 req/sec |
| Overpass API | OSM data (buildings, roads, POIs, subway entrances) | Best-effort |
| Google Gemini | Agent AI (generation, decisions, conversations) | Per API key |

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                        │
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌─────────────────────┐ │
│  │ React UI     │   │ R3F Canvas   │   │ Simulation Engine   │ │
│  │ (Control     │   │ (3D Scene)   │   │ (rAF Game Loop)     │ │
│  │  Panel)      │   │              │   │                     │ │
│  └──────┬───────┘   └──────┬───────┘   └──────────┬──────────┘ │
│         │                  │                       │            │
│         └──────────┬───────┴───────────────────────┘            │
│                    ▼                                            │
│         ┌─────────────────────┐                                 │
│         │   Zustand Stores    │                                 │
│         │  (Single Source of  │                                 │
│         │      Truth)         │                                 │
│         └─────────┬───────────┘                                 │
│                   │                                             │
│    ┌──────────────┼──────────────┐                              │
│    ▼              ▼              ▼                              │
│  ┌──────┐  ┌───────────┐  ┌──────────┐                         │
│  │ IDB  │  │ /api/ai   │  │ OSM APIs │                         │
│  │      │  │ (Gemini   │  │ Overpass │                         │
│  │      │  │  Proxy)   │  │ Nominatim│                         │
│  └──────┘  └─────┬─────┘  └──────────┘                         │
└──────────────────┼──────────────────────────────────────────────┘
                   ▼
            Google Gemini API
```

### Data Flow

1. **City Loading**: User selects region → Nominatim geocoding → Overpass API fetch → `osm-parser` transforms raw OSM XML into `CityData` (buildings, roads, POIs) → stored in `city-store`
2. **Simulation Loop**: `SimulationEngine` runs a decoupled `requestAnimationFrame` loop independent of the React render cycle. Each tick processes: weather → time advance → AI decisions → agent movement → vehicle spawning → interactions → nighttime behavior
3. **AI Decisions**: Agents in `idle` state trigger async Gemini API calls (fire-and-forget, non-blocking). Responses drive `move`, `interact`, `go_home`, or `idle` actions. Falls back to random building navigation when API is unavailable.
4. **Rendering**: React Three Fiber reads from Zustand stores each frame. R3F components (`CityRenderer`, `AgentRenderer`, `POIMarkers`, etc.) react to state changes and re-render the 3D scene.

### Simulation Engine

The core engine (`src/simulation/engine.ts`) is a singleton class running outside the React lifecycle:

```
SimulationEngine.start()
  ├── initializePopulation()     # Spawn 5 default agents on road nodes
  └── requestAnimationFrame loop
        └── tick() (every tickInterval ms)
              ├── processWeather()        # Weather state machine transitions
              ├── simStore.tick()          # Advance simulation clock
              ├── processDecisions()      # AI decision-making (async, non-blocking)
              ├── processMovement()       # Move agents along A* paths
              ├── processVehicles()       # Spawn/move/despawn vehicles
              ├── processInteractions()   # Proximity-based agent conversations
              └── processHomeDirection()  # Night/storm behavior
```

- **Decoupled from React**: Reads/writes Zustand stores directly via `getState()`, no re-renders triggered per tick
- **Non-blocking AI**: Gemini API calls are fire-and-forget promises; the game loop never awaits them
- **Weather-aware**: Movement speed modified by weather (clear=1.0, rain=0.7, storm=0.4)

### Agent Lifecycle

```
┌─────────┐   Gemini API    ┌─────────┐   A* Path    ┌─────────┐
│  IDLE   │ ──────────────→ │ DECIDE  │ ───────────→ │ MOVING  │
│         │   or fallback   │         │              │         │
└────┬────┘                 └─────────┘              └────┬────┘
     │                                                    │
     │  proximity                              reached    │
     │  trigger                               destination │
     ▼                                                    ▼
┌─────────────┐   conversation end          ┌─────────────────┐
│ INTERACTING │ ──────────────────────────→ │      IDLE       │
│ (Gemini     │   memory + relationship     └────────┬────────┘
│  dialogue)  │   updated                            │
└─────────────┘                              night   │
                                            (22-06h) │
                                                     ▼
                                              ┌────────────┐
                                              │  SLEEPING  │
                                              │ (at home)  │
                                              └────────────┘
```

- **Personality**: Big Five OCEAN traits (openness, conscientiousness, extraversion, agreeableness, neuroticism) influence AI decisions
- **Memory**: Each interaction is recorded with summary, participants, and timestamp
- **Relationships**: Strength value tracked per agent pair, updated after each conversation
- **Daily Routine**: Occupation-based schedule templates (8 occupations with time-activity pairs)

### Pathfinding

A* search on the OSM road graph with a binary min-heap priority queue:

1. `buildRoadGraph()` converts OSM road nodes/segments into a bidirectional adjacency graph
2. `findPath()` runs A* from the nearest road node to the source position to the nearest road node to the destination
3. Returns a sequence of 2D waypoints converted to 3D coordinates for agent movement
4. Agents follow waypoints each tick with configurable speed and weather-based modifiers

### State Management

Six Zustand stores act as the single source of truth:

| Store | Responsibility |
|-------|---------------|
| `simulation-store` | Engine status, clock, weather, speed, vehicles, config |
| `agent-store` | Agent entities (Map), spatial queries, CRUD operations |
| `city-store` | CityData (buildings, roads, POIs), loading state, selected region |
| `ui-store` | Active tab, overlay toggles (POIs, labels, minimap, bubbles) |
| `settings-store` | Gemini API key, model selection (persisted to localStorage) |
| `conversation-store` | Active conversation tracking for overlay speech bubbles |

### Rendering Pipeline

```
Next.js Page (SSR disabled for 3D)
  └── SimulationScene (dynamic import, ssr: false)
        └── R3F <Canvas>
              ├── Lighting          # Directional + ambient, day/night color
              ├── CameraController  # OrbitControls wrapper
              ├── GroundPlane       # 1000x1000 dark plane
              ├── CityRenderer      # Instanced buildings + roads from CityData
              ├── AgentRenderer     # Agent mesh instances with name labels
              ├── VehicleRenderer   # Cars/buses on road paths
              ├── WeatherEffects    # Particle systems (rain/snow/fog)
              ├── POIMarkers        # Category-colored spheres + subway diamonds
              ├── CityLabels        # drei Html labels with LOD culling (200 units)
              └── ConversationOverlay  # drei Html speech bubbles (150 units)
```

- **LOD System**: Labels and bubbles use `useFrame` to check camera distance each frame, toggling `group.visible` without React re-renders
- **Dynamic Import**: `SimulationScene` is loaded with `next/dynamic` (`ssr: false`) to avoid Three.js SSR issues
- **Instanced Rendering**: Buildings use instanced meshes for performance with large city datasets

### API Proxy

The `/api/ai` route acts as a server-side proxy to Google Gemini:

- **Rate Limiting**: 30 requests per 60 seconds per client IP (in-memory Map)
- **Validation**: Zod schema validates request type (`generate_agent`, `decide_action`, `conversation`) and context
- **Security**: API key stays server-side, never exposed to the browser
- **Three AI modes**:
  - `generate_agent`: Creates agent profiles with personality, occupation, backstory
  - `decide_action`: Returns `move`/`interact`/`go_home`/`idle` decisions based on agent state and surroundings
  - `conversation`: Generates dialogue between two agents with mood and summary

---

## Getting Started

### Prerequisites

- **Node.js** 20 or later
- **npm** (recommended for exFAT filesystems) or **pnpm**
- A modern browser with **WebGL 2** support (Chrome, Firefox, Edge)
- (Optional) Google Gemini API key for AI-powered agent behavior

### Installation

```bash
git clone https://github.com/jinwoonghong/MESAsim.git
cd MESAsim
npm install
```

### Environment Setup (Optional)

For AI-powered agents, create a `.env.local` file:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
```

> The Gemini API key can also be entered at runtime through the **API Settings** tab in the control panel. Without an API key, the simulation runs with default agent behavior.

### Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The dev server uses **Turbopack** for fast hot module replacement.

## Usage Guide

### 1. Select a Region

When the app loads, you can either:
- Select one of the **8 preset Korean regions** from the dropdown in the Simulation tab (Gangnam, Hongdae, Haeundae, etc.)
- Use the **Search bar** to find any Korean location by name (e.g., "Seoul Station", "Busan Tower")

The app fetches real OpenStreetMap data for the selected area, including buildings, roads, POIs, and subway entrances.

### 2. Explore the 3D City

- **Orbit**: Left-click and drag to rotate the camera
- **Zoom**: Scroll wheel to zoom in/out
- **Pan**: Right-click and drag to move the view

As you zoom in, Korean building labels appear when within 200 units of the camera. POI markers show restaurants (red), cafes (brown), shops (blue), schools (yellow), hospitals (pink), parks (green), and subway entrances (gold diamond).

### 3. Manage the Simulation

In the **Simulation tab**:
- **Play/Pause** the simulation
- Adjust **simulation speed** (1x, 2x, 5x, 10x)
- **Reset** to restart the simulation
- Watch the **day/night cycle** progress

### 4. Observe Agents

In the **Agent tab**:
- View the list of all agents with their current status
- Click an agent to inspect their **personality traits** (OCEAN), current action, memories, and relationships
- Agents move along road networks, enter buildings, and interact with nearby agents
- **Conversation bubbles** appear above interacting agents

### 5. Toggle Overlays

In the **System tab**, toggle visibility of:
- **POI Markers** -- Show/hide Points of Interest
- **Building Labels** -- Show/hide Korean hangul labels
- **Minimap** -- Show/hide the 2D minimap overlay
- **Conversation Bubbles** -- Show/hide agent speech bubbles

### 6. Weather & Vehicles

- **Weather tab**: Change weather conditions (clear, cloudy, rain, snow, fog) -- visual particle effects respond accordingly
- **Vehicle tab**: Observe vehicles (cars, buses) spawning and moving along roads

## Testing

### Run All Tests

```bash
npm run test:run
```

Currently **91 tests** across 5 test suites, all passing.

### Run Tests in Watch Mode

```bash
npm test
```

Tests re-run automatically when source files change.

### Run with Coverage Report

```bash
npm run test:coverage
```

### Test Suites

| Test File | Tests | Description |
|-----------|-------|-------------|
| `src/city/poi-parser.test.ts` | 22 | POI classification and parsing from OSM data |
| `src/city/nominatim.test.ts` | 8 | Nominatim geocoding API and bounds conversion |
| `src/systems/weather.test.ts` | 21 | Weather state machine transitions and effects |
| `src/systems/vehicles.test.ts` | 20 | Vehicle spawning, movement, and lifecycle |
| `src/simulation/engine.test.ts` | 20 | Simulation engine tick loop and system integration |

### Type Checking

```bash
npx tsc --noEmit
```

Zero TypeScript errors in strict mode.

### Linting

```bash
npm run lint
```

ESLint 9 with Next.js and TypeScript rules.

## Project Structure

```
src/
  app/              # Next.js App Router entry points
    api/ai/         #   POST /api/ai Gemini proxy with rate limiting
  agents/           # Agent domain (behavior, personality, memory, movement)
  city/             # City data (OSM fetching, parsing, POI, geocoding)
    nominatim.ts    #   Nominatim geocoding API client
    osm-fetcher.ts  #   Overpass API client (buildings, roads, POIs, subway)
    osm-parser.ts   #   OSM data to 3D city model parser
    poi-parser.ts   #   POI extraction and classification (7 categories)
  components/
    scene/          #   3D scene components (city, agents, lighting, camera)
      CityLabels.tsx    # Korean hangul labels with LOD visibility
      POIMarkers.tsx    # Category-colored POI markers
      WeatherEffects.tsx # Rain/snow/fog particle effects
    overlay/        #   2D overlay components
      Minimap.tsx       # Canvas minimap with building footprints
      AgentBubble.tsx   # 3D conversation bubbles
      ConversationOverlay.tsx # Conversation management
    ui/             #   Control panel tabs
      SearchInput.tsx   # Geocoding search with dropdown
  lib/              # Shared utilities (cn helper, math)
  services/         # External APIs (Gemini client, prompts, cache)
  simulation/       # Simulation engine (game loop, config)
  stores/           # Zustand stores (simulation, agent, city, UI, settings)
  systems/          # Subsystems (pathfinding, weather, vehicles)
  types/            # TypeScript type definitions
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage report |

## License

[MIT](LICENSE)

# Architecture Overview

## System Summary

MESAsim is a 3D autonomous agent simulation built with Next.js 15, TypeScript, and React Three Fiber. AI-driven agents with unique personalities navigate Korean city environments reconstructed from OpenStreetMap data. The application runs primarily on the client side, with a minimal server component limited to proxying AI API calls.

## Architecture Pattern

Domain-driven layered architecture with clear separation of concerns:

```
Presentation Layer        components/ui + components/scene    React, React Three Fiber
Application/Store Layer   stores/                             Zustand 5
Domain Logic Layer        agents/, city/, simulation/         Business logic
Infrastructure Layer      services/, systems/, lib/           APIs, algorithms, utilities
```

## Key Architectural Decisions

### Client-Heavy, Server-Light

The application is fundamentally a client-side simulation. Next.js App Router serves the static client bundle. The only server-side logic is a single API route (`/api/ai`) that proxies requests to the Google Gemini API, keeping the API key secure.

### 3D Rendering with React Three Fiber

React Three Fiber (R3F) provides declarative 3D scene management within React's component model. The scene renders city buildings, roads, and agents as simple geometric primitives (boxes, cylinders, spheres). An orbit camera follows the currently selected agent.

### State Management with Zustand 5

Five Zustand stores manage all application state. Stores are decoupled from the rendering layer and consumed via subscriptions. The agent store uses a `Map` for O(1) lookups by agent ID. The settings store persists user preferences to `localStorage`.

### Simulation Engine Decoupled from React

The simulation engine runs on `requestAnimationFrame`, operating independently from the React render cycle. This ensures consistent tick rates regardless of component re-renders. Time progresses at a configurable speed (default: 24 real minutes equals 1 in-game day).

### OpenStreetMap Data Pipeline

City geometry is fetched client-side via the Overpass API. Raw OSM JSON is parsed into domain objects (buildings, roads, intersections) and a road graph structure used for agent pathfinding. Korean region presets provide predefined bounding boxes for major cities.

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 15 |
| UI Library | React | 19 |
| 3D Engine | Three.js | 0.171 |
| React 3D Binding | @react-three/fiber | 8 |
| State Management | Zustand | 5 |
| AI Service | Google Gemini (@google/generative-ai) | 0.24 |
| Validation | Zod | 3.24 |
| Persistence | idb (IndexedDB) | 8 |
| Styling | Tailwind CSS | 4 |

## Runtime Characteristics

- **Rendering**: 60 FPS target via requestAnimationFrame
- **Tick Rate**: Configurable simulation tick rate with speed multiplier
- **Time Scale**: 24 real minutes = 1 game day (default)
- **Agent Lookup**: O(1) via Map-based store
- **Pathfinding**: A* algorithm with binary min-heap priority queue
- **AI Calls**: Proxied through server-side API route with in-memory TTL cache

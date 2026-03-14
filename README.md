# MESAsim - 3D Autonomous Agent Simulation

A 3D autonomous agent simulation service inspired by Multi-Entity Simulation Architecture (MESA). Agents with AI-powered personalities navigate Korean city environments in real-time.

## Features

- **3D City Rendering** -- Real OpenStreetMap data for Korean regions including Gangnam, Hongdae, Haeundae, Myeongdong, Itaewon, Jamsil, Sinchon, and Daehakro
- **AI-Powered Agents** -- Google Gemini API drives agent decision-making and behavior
- **A\* Pathfinding** -- Navigation on actual OSM road networks
- **Agent Personalities** -- Big Five personality traits shape agent behavior
- **Interaction & Memory** -- Agents remember encounters and form relationships
- **Day/Night Cycle** -- Dynamic lighting transitions throughout simulation time
- **IndexedDB Persistence** -- Simulation state saved locally in the browser
- **Real-Time Controls** -- Adjust simulation speed, pause, and reset

## Tech Stack

- **Framework:** Next.js 15, React 19, TypeScript 5.7+
- **3D Rendering:** React Three Fiber, Three.js
- **State Management:** Zustand 5
- **AI:** Google Gemini API (`@google/generative-ai`)
- **Styling:** Tailwind CSS 4
- **Validation:** Zod
- **Storage:** IndexedDB (idb)
- **Testing:** Vitest, Testing Library

## Getting Started

### Prerequisites

- Node.js 20+
- npm, pnpm, or yarn

### Installation

```bash
git clone https://github.com/jinwoonghong/MESAsim.git
cd MESAsim
npm install
```

### Environment Setup

Create a `.env.local` file in the project root:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

### Run the Dev Server

```bash
npm run dev
```

The app starts at `http://localhost:3000`. The dev server uses Turbopack for fast refresh.

## Development

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:coverage # Run tests with coverage
```

## Project Structure

```
src/
  agents/        # Agent behavior, personality, and decision logic
  app/           # Next.js App Router pages and layouts
  city/          # City rendering, OSM data, building generation
  components/    # React UI components
  hooks/         # Custom React hooks
  lib/           # Shared utilities
  services/      # External service integrations (Gemini API)
  simulation/    # Core simulation loop and orchestration
  stores/        # Zustand state stores
  systems/       # Simulation subsystems (pathfinding, lighting)
  types/         # TypeScript type definitions
```

## License

[MIT](LICENSE)

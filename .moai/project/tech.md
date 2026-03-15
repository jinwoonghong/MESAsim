# MESAsim - Technology Stack

## Overview

MESAsim is a Next.js 15 application using React 19, TypeScript 5.7+, and React Three Fiber for 3D rendering. AI behavior is powered by Google Gemini. State management uses Zustand with five domain-specific stores. The project targets modern evergreen browsers with WebGL 2 support.

## Core Framework

| Dependency | Version | Purpose |
|---|---|---|
| Next.js | 15 | App Router framework with Turbopack dev server, API routes, SSR/SSG |
| React | 19 | UI library with concurrent features |
| TypeScript | 5.7+ | Static typing in strict mode across all source files |

## 3D Rendering

| Dependency | Version | Purpose |
|---|---|---|
| React Three Fiber | 8 | Declarative React renderer for Three.js scenes |
| Three.js | 0.171 | WebGL-based 3D graphics engine |
| @react-three/drei | 9 | Helper components (OrbitControls, Text, Html, etc.) |

## State Management

| Dependency | Version | Purpose |
|---|---|---|
| Zustand | 5 | Lightweight state management with 5 domain stores |

Five stores: `simulationStore` (engine state), `agentStore` (agent entities), `cityStore` (geographic data), `uiStore` (UI preferences), `settingsStore` (persisted user settings).

## AI Integration

| Dependency | Version | Purpose |
|---|---|---|
| @google/generative-ai | 0.24 | Google Gemini API client for agent generation, decision-making, and conversation |

The client-side SDK calls a server-side proxy at `POST /api/ai` which handles rate limiting (30 req/60s per IP) and Zod validation before forwarding to Gemini.

## Styling

| Dependency | Version | Purpose |
|---|---|---|
| Tailwind CSS | 4 | Utility-first CSS framework for UI components |
| clsx | latest | Conditional className composition |
| tailwind-merge | latest | Intelligent Tailwind class deduplication |

## Validation and Data

| Dependency | Version | Purpose |
|---|---|---|
| Zod | 3.24 | Runtime schema validation for API request/response payloads |
| idb | 8 | Promise-based IndexedDB wrapper for agent state persistence |

## Testing

| Dependency | Version | Purpose |
|---|---|---|
| Vitest | 2 | Unit and integration test runner (Vite-native, Jest-compatible API) |
| @testing-library/react | latest | React component testing utilities |

## Code Quality

| Dependency | Version | Purpose |
|---|---|---|
| ESLint | 9 | Linting with flat config format |
| Prettier | 3 | Opinionated code formatting |

## Development Environment Requirements

- **Node.js**: 20+ (LTS recommended)
- **Package Manager**: pnpm 9.15.0 (primary); npm may be used on exFAT filesystems where symlinks are unsupported
- **OS**: Windows (WSL2), macOS, or Linux
- **Browser**: Chrome, Firefox, or Edge with WebGL 2 support

## Build Configuration

- **Dev Server**: `next dev --turbopack` for fast HMR via Turbopack
- **Production Build**: `next build` producing optimized static and server bundles
- **Output**: Standalone Next.js output (default App Router behavior)
- **TypeScript**: Strict mode enabled (`strict: true` in `tsconfig.json`)
- **Path Aliases**: `@/*` mapped to `src/*`

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Yes (server) | Gemini API key used by the `/api/ai` route. Can alternatively be set client-side via the API Settings tab and stored in localStorage. |

No other environment variables are required for basic operation. The Gemini API key can be provided either as a server environment variable or entered by the user at runtime through the settings UI.

## External APIs

| API | Purpose | Rate Limit |
|---|---|---|
| Nominatim | Geocoding - convert location names to coordinates for map navigation | 1 request/second (OSM usage policy) |
| Overpass API | OSM data fetching - buildings, roads, POIs, and subway entrances for city rendering | Best-effort (no hard limit, but large queries throttled) |

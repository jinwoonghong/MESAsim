# Entry Points

## Web UI Entry Point

**File**: `src/app/page.tsx`

The root page component of the Next.js App Router. Dynamically imports `SimulationScene` (R3F canvas) and `ControlPanel` (UI) to avoid server-side rendering issues with Three.js. This is the primary user-facing entry point that bootstraps the entire application.

**Trigger**: Browser navigation to `/`

**Flow**: `page.tsx` --> dynamic import --> `SimulationScene` + `ControlPanel` --> stores initialize --> scene renders

---

## API Route Entry Point

**File**: `src/app/api/ai/route.ts`

POST handler that proxies requests to the Google Gemini API. Receives structured prompts from the client-side Gemini client, forwards them to the Gemini SDK with the server-side API key, and returns the AI-generated response. This is the only server-side logic in the application.

**Trigger**: HTTP POST from `services/gemini-client.ts`

**Flow**: Client POST --> `route.ts` --> `@google/generative-ai` SDK --> Gemini API --> response back to client

---

## Simulation Engine Entry Point

**File**: `src/simulation/engine.ts`

`SimulationEngine.start()` initializes the `requestAnimationFrame` loop. Each frame, the engine checks elapsed time against the configured tick rate, advances simulation time, and processes all agents. The engine is started/stopped via the simulation store.

**Trigger**: User clicks Play in `SimulationControls`

**Flow**: `start()` --> rAF loop --> `tick()` --> `advanceTime()` + `processAgents()` --> store updates --> React re-renders

---

## City Data Loading Entry Point

**File**: `src/city/osm-fetcher.ts`

`fetchOSMData(bounds)` is triggered when the user selects a Korean city region from the region selector dropdown. It queries the Overpass API with the geographic bounding box, receives raw OSM JSON, and passes it through the parser pipeline to populate the city store.

**Trigger**: User selects region in `RegionSelector`

**Flow**: `fetchOSMData(bounds)` --> Overpass API --> `parseOSMResponse()` --> domain objects --> `CityStore.setCityData()` --> `CityRenderer` updates

---

## Agent Creation Entry Point

**File**: `src/agents/agent-generation.ts`

`generateAgentViaGemini()` is the entry point for creating new AI-driven agents. It builds a generation prompt, calls the Gemini API through the proxy, parses the response into an agent object with personality traits and backstory, and adds it to the agent store.

**Trigger**: User spawns agent or simulation engine auto-spawns

**Flow**: `generateAgentViaGemini()` --> `promptBuilders.buildGenerationPrompt()` --> `geminiClient.generate()` --> POST `/api/ai` --> parse response --> `AgentStore.addAgent()` --> `AgentRenderer` renders new agent

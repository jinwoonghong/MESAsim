# Data Flow

## 1. City Loading Flow

User action initiates the city data pipeline from region selection through to 3D rendering.

```
User selects region
  |
  v
RegionSelector --> fetchOSMData(bounds)
  |
  v
Overpass API (HTTP GET)
  |
  v
Raw OSM JSON response
  |
  v
parseOSMResponse(json)
  |
  +--> Building[] (position, dimensions, type)
  +--> Road[] (path segments, width, type)
  +--> Intersection[] (junction nodes)
  |
  v
buildRoadNetwork(roads, intersections)
  |
  v
RoadNetwork (graph: nodes + edges)
  |
  v
CityStore.setCityData(buildings, roads, intersections, roadNetwork)
  |
  v
CityRenderer subscribes --> renders buildings (boxes) + roads (flat boxes)
```

## 2. Agent Creation Flow

New agents are generated via AI with unique personalities and added to the simulation.

```
User clicks "Spawn Agent" OR Engine auto-spawns
  |
  v
generateAgentViaGemini()
  |
  v
promptBuilders.buildGenerationPrompt(context)
  |
  v
geminiClient.generate(prompt)
  |
  v
POST /api/ai (server-side proxy)
  |
  v
Google Gemini API
  |
  v
AI response (personality, traits, backstory)
  |
  v
Zod validation --> createAgent(parsedData)
  |
  v
AgentStore.addAgent(agent)
  |
  v
AgentRenderer subscribes --> renders agent (cylinder + sphere)
```

## 3. Simulation Loop Flow

The game loop drives time progression and agent behavior on every tick.

```
SimulationEngine.start()
  |
  v
requestAnimationFrame loop
  |
  v
tick(deltaTime)
  |
  +---> advanceTime(deltaTime * speedMultiplier)
  |       |
  |       v
  |     SimulationStore.setGameTime(newTime)
  |
  +---> processAgents(allAgents, deltaTime)
          |
          v
          For each agent:
            |
            +---> moveAgentAlongPath(agent, dt)
            |       |
            |       v
            |     Update position toward next waypoint
            |     If arrived at destination --> assignNewDestination
            |
            +---> checkInteractions(agent, nearbyAgents)
            |       |
            |       v
            |     If agents within proximity radius --> triggerInteraction
            |
            v
          AgentStore.updateAgent(agentId, updates)
            |
            v
          React re-renders via Zustand subscriptions
```

## 4. Pathfinding Flow

Agents navigate the city road network using A* search.

```
Agent needs new destination
  |
  v
assignDestination(agent)
  |
  v
Select target location (random building, home, POI)
  |
  v
getNearestNode(agent.position) --> startNode
getNearestNode(target.position) --> endNode
  |
  v
findPath(roadNetwork, startNode, endNode)
  |
  v
A* search with binary min-heap priority queue
  |
  v
Path: [Node, Node, Node, ...] (ordered waypoints)
  |
  v
agent.currentPath = path
  |
  v
moveAgentAlongPath() consumes waypoints each tick
```

## 5. State Flow (Overall)

The unidirectional data flow pattern connecting all layers.

```
Infrastructure Layer          Domain Logic Layer         Store Layer              Presentation Layer
(services, systems, lib)      (agents, city, simulation) (Zustand stores)         (components)

Overpass API ----fetch----> city/osm-parser ----set----> CityStore ----subscribe----> CityRenderer
Gemini API -----generate--> agents/generation --add----> AgentStore ---subscribe----> AgentRenderer
                            simulation/engine --update-> SimStore ----subscribe----> SimControls
A* pathfinding <--query---- agents/movement
IndexedDB <-----persist---- agents/persistence
localStorage <--persist---- settings-store

                            User Input -----------------------------------------> UI Components
                            UI Components --dispatch--> Store Actions --> Domain Logic
```

## Key Characteristics

- **Unidirectional**: Data flows from infrastructure through domain logic to stores to presentation
- **Reactive**: Zustand subscriptions trigger React re-renders automatically
- **Decoupled**: Simulation engine operates independently from React render cycle
- **Cached**: AI responses are cached in-memory with TTL to reduce API calls
- **Persistent**: Agent state survives browser refresh via IndexedDB; settings via localStorage

import { useSimulationStore } from "@/stores/simulation-store";
import { useAgentStore } from "@/stores/agent-store";
import { useCityStore } from "@/stores/city-store";
import { generateDefaultAgent } from "@/agents/agent-generation";
import { assignHome, shouldGoHome, isAgentAtHome } from "@/agents/agent-home";
import { assignDestination } from "@/agents/agent-movement";
import {
  checkInteractions,
  endInteraction,
} from "@/agents/agent-interaction";
import { geminiClient } from "@/services/gemini-client";
import { useConversationStore } from "@/stores/conversation-store";
import { buildRoadGraph } from "@/city/road-network";
import type { RoadGraph } from "@/city/road-network";
import type { Building } from "@/types/city";
import {
  updateWeather,
  getWeatherCheckIntervalMs,
  WEATHER_SPEED_MODIFIER,
  shouldSeekShelter,
} from "@/systems/weather";
import {
  getEnabledTypes,
  spawnVehicle,
  shouldSpawn,
  processVehicleMovement,
} from "@/systems/vehicles";

// @MX:NOTE: Simulation engine decoupled from React render cycle.
// Reads/writes Zustand stores directly via getState().
class SimulationEngine {
  private animationFrameId: number | null = null;
  private lastTickTime: number = 0;
  private lastWeatherCheckTime: number = 0;
  private lastVehicleSpawnTime: number = 0;
  private pendingDecisions = new Set<string>();
  private activeInteractions = new Set<string>();
  private roadGraph: RoadGraph | null = null;

  start(): void {
    if (this.animationFrameId !== null) return;

    this.initializePopulation();

    this.lastTickTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // @MX:NOTE: Auto-populates 5 default agents when simulation starts with empty agent store.
  // Agents are placed at random road node positions and assigned residential homes.
  private initializePopulation(): void {
    const agentStore = useAgentStore.getState();
    if (agentStore.agents.size > 0) return;

    const cityStore = useCityStore.getState();
    const cityData = cityStore.cityData;
    if (!cityData) return;

    const { buildings, roadNodes, roadSegments } = cityData;

    // Build road graph once for pathfinding
    if (roadNodes.length > 0 && roadSegments.length > 0) {
      this.roadGraph = buildRoadGraph(roadNodes, roadSegments);
    }

    const defaultCount = 5;

    for (let i = 0; i < defaultCount; i++) {
      let agent = generateDefaultAgent(i);

      // Assign home building from available residential buildings
      agent = assignHome(agent, buildings);

      // Place at a random road node position instead of arbitrary xy
      if (roadNodes.length > 0) {
        const randomNode = roadNodes[Math.floor(Math.random() * roadNodes.length)];
        agent = {
          ...agent,
          position: {
            x: randomNode.position.x,
            y: 0,
            z: randomNode.position.y,
          },
        };
      }

      agentStore.addAgent(agent);
    }
  }

  private loop = (timestamp: number): void => {
    const simState = useSimulationStore.getState();

    if (simState.status !== "running") {
      this.animationFrameId = requestAnimationFrame(this.loop);
      return;
    }

    const elapsed = timestamp - this.lastTickTime;
    const { tickInterval } = simState.config;

    if (elapsed >= tickInterval) {
      this.lastTickTime = timestamp;
      this.tick();
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private tick(): void {
    const simStore = useSimulationStore.getState();

    // 0. Weather transitions (before time advance)
    this.processWeather();

    // 1. Advance simulation time
    simStore.tick();

    // 2. AI decisions for idle agents (non-blocking)
    this.processDecisions();

    // 3. Movement along paths
    this.processMovement();

    // 3.5. Vehicle spawning and movement
    this.processVehicles();

    // 4. Proximity-based conversations (non-blocking)
    this.processInteractions();

    // 5. Nighttime navigation home + storm shelter
    this.processHomeDirection();
  }

  // @MX:NOTE: Auto-transitions weather state based on probability when autoWeather is enabled.
  // Checks every WEATHER_CHECK_INTERVAL simulation seconds to avoid per-tick overhead.
  private processWeather(): void {
    const simStore = useSimulationStore.getState();
    if (!simStore.autoWeather) return;

    const { time, config } = simStore;
    // Convert simulation time to total milliseconds for interval tracking
    const simTimeMs =
      ((time.day - 1) * 1440 + time.hour * 60 + time.minute) * (config.dayDurationMs / 1440);

    const checkInterval = getWeatherCheckIntervalMs();
    if (simTimeMs - this.lastWeatherCheckTime < checkInterval) return;

    this.lastWeatherCheckTime = simTimeMs;

    const elapsed = checkInterval;
    const newWeather = updateWeather(simStore.weather, elapsed);
    if (newWeather !== simStore.weather) {
      simStore.setWeather(newWeather);
    }
  }

  // @MX:NOTE: AI decision-making fires async Gemini calls without blocking the rAF loop.
  // Uses pendingDecisions set to prevent duplicate requests for the same agent.
  private processDecisions(): void {
    const agentStore = useAgentStore.getState();
    const simStore = useSimulationStore.getState();
    const cityStore = useCityStore.getState();
    const cityData = cityStore.cityData;
    const { agentDecisionInterval } = simStore.config;

    if (!cityData) return;

    // Ensure road graph is available
    if (!this.roadGraph && cityData.roadNodes.length > 0 && cityData.roadSegments.length > 0) {
      this.roadGraph = buildRoadGraph(cityData.roadNodes, cityData.roadSegments);
    }

    const now = Date.now();

    for (const agent of agentStore.agents.values()) {
      if (agent.state !== "idle") continue;
      if (this.pendingDecisions.has(agent.id)) continue;
      if (now - agent.lastDecisionTime < agentDecisionInterval) continue;

      this.pendingDecisions.add(agent.id);

      // Collect context for the AI decision
      const nearbyAgents = agentStore.getAgentsNear(agent.position, simStore.config.agentInteractionRange * 3);
      const nearbyBuildingNames = cityData.buildings
        .filter((b) => {
          const dx = b.position.x - agent.position.x;
          const dy = b.position.y - agent.position.z;
          return dx * dx + dy * dy < 2500; // within ~50 units
        })
        .map((b) => b.name ?? b.type)
        .slice(0, 10);

      // Fire-and-forget async call
      geminiClient
        .decideAction(agent, nearbyAgents, nearbyBuildingNames)
        .then((response) => {
          const currentAgentStore = useAgentStore.getState();
          const currentAgent = currentAgentStore.getAgentById(agent.id);
          if (!currentAgent || currentAgent.state !== "idle") return;

          if (response.success && response.data) {
            this.applyDecision(currentAgent, response.data, cityData.buildings);
          } else {
            // Fallback: pick a random building as destination
            this.applyFallbackDecision(currentAgent, cityData.buildings);
          }
        })
        .catch(() => {
          // API error fallback: navigate to a random building
          const currentAgentStore = useAgentStore.getState();
          const currentAgent = currentAgentStore.getAgentById(agent.id);
          if (currentAgent && currentAgent.state === "idle") {
            this.applyFallbackDecision(currentAgent, cityData.buildings);
          }
        })
        .finally(() => {
          this.pendingDecisions.delete(agent.id);
          const currentAgentStore = useAgentStore.getState();
          currentAgentStore.updateAgent(agent.id, { lastDecisionTime: Date.now() });
        });
    }
  }

  private applyDecision(
    agent: import("@/types/agent").Agent,
    decision: import("@/types/gemini").GeminiDecision,
    buildings: Building[],
  ): void {
    const agentStore = useAgentStore.getState();

    switch (decision.action) {
      case "move": {
        if (!decision.destination) break;

        // Find building by destination name
        const targetBuilding = buildings.find(
          (b) => b.name?.toLowerCase() === decision.destination?.toLowerCase()
            || b.type === decision.destination?.toLowerCase(),
        );

        if (targetBuilding && this.roadGraph) {
          const dest3D = { x: targetBuilding.position.x, y: 0, z: targetBuilding.position.y };
          const updated = assignDestination(agent, dest3D, this.roadGraph);
          if (updated.state === "moving") {
            agentStore.updateAgent(agent.id, {
              currentPath: updated.currentPath,
              destination: updated.destination,
              pathIndex: updated.pathIndex,
              state: updated.state,
            });
            return;
          }
        }

        // Could not find building or path; fall through to fallback
        this.applyFallbackDecision(agent, buildings);
        break;
      }

      case "interact": {
        // Find nearest idle agent for interaction
        const nearbyAgents = useAgentStore.getState().getAgentsNear(
          agent.position,
          useSimulationStore.getState().config.agentInteractionRange,
        );
        const target = nearbyAgents.find(
          (a) => a.id !== agent.id && a.state === "idle",
        );
        if (target) {
          // Mark both as interacting; processInteractions will handle conversation
          agentStore.updateAgent(agent.id, { state: "interacting" });
          agentStore.updateAgent(target.id, { state: "interacting" });
        }
        break;
      }

      case "go_home": {
        if (!agent.homeBuilding || !this.roadGraph) break;

        const homeBuilding = buildings.find((b) => b.id === agent.homeBuilding);
        if (!homeBuilding) break;

        const homeDest = { x: homeBuilding.position.x, y: 0, z: homeBuilding.position.y };
        const updated = assignDestination(agent, homeDest, this.roadGraph);
        if (updated.state === "moving") {
          agentStore.updateAgent(agent.id, {
            currentPath: updated.currentPath,
            destination: updated.destination,
            pathIndex: updated.pathIndex,
            state: updated.state,
          });
        }
        break;
      }

      case "idle":
      default:
        // No action needed; lastDecisionTime is updated in finally block
        break;
    }
  }

  private applyFallbackDecision(
    agent: import("@/types/agent").Agent,
    buildings: Building[],
  ): void {
    if (!this.roadGraph || buildings.length === 0) return;

    const randomBuilding = buildings[Math.floor(Math.random() * buildings.length)];
    const dest3D = { x: randomBuilding.position.x, y: 0, z: randomBuilding.position.y };
    const updated = assignDestination(agent, dest3D, this.roadGraph);

    if (updated.state === "moving") {
      const agentStore = useAgentStore.getState();
      agentStore.updateAgent(agent.id, {
        currentPath: updated.currentPath,
        destination: updated.destination,
        pathIndex: updated.pathIndex,
        state: updated.state,
      });
    }
  }

  // @MX:NOTE: Vehicle lifecycle -- spawn new vehicles on road network, advance along paths, despawn at end.
  // Reads vehicle settings from simulation store; skips entirely when vehiclesEnabled is false.
  private processVehicles(): void {
    const simStore = useSimulationStore.getState();
    const { vehiclesEnabled, speedMultiplier, tickInterval } = simStore.config;

    // If vehicles disabled, clear any remaining vehicles
    if (!vehiclesEnabled) {
      if (simStore.vehicles.length > 0) {
        simStore.clearVehicles();
      }
      return;
    }

    // Road graph is required for spawning
    if (!this.roadGraph) return;

    const now = performance.now();
    const weatherModifier = WEATHER_SPEED_MODIFIER[simStore.weather];

    // Spawn check
    if (
      shouldSpawn(
        this.lastVehicleSpawnTime,
        now,
        simStore.spawnRate,
        simStore.vehicles.length,
        simStore.maxVehicleCount,
      )
    ) {
      const enabledTypes = getEnabledTypes(simStore.vehicleTypes);
      const vehicle = spawnVehicle(this.roadGraph, enabledTypes);
      if (vehicle) {
        simStore.addVehicle(vehicle);
        this.lastVehicleSpawnTime = now;
      }
    }

    // Movement -- re-read store in case a vehicle was just added
    const currentVehicles = useSimulationStore.getState().vehicles;
    if (currentVehicles.length === 0) return;

    const dt = tickInterval / 1000;
    const { updated, despawned } = processVehicleMovement(
      currentVehicles,
      speedMultiplier,
      weatherModifier,
      dt,
    );

    // Batch update: replace entire vehicles array with surviving, moved vehicles
    if (despawned.length > 0 || updated.length !== currentVehicles.length) {
      simStore.updateVehicles(updated);
    } else {
      simStore.updateVehicles(updated);
    }
  }

  // @MX:NOTE: Existing movement logic preserved from original processAgents.
  // Moves agents along their pre-computed paths each tick.
  // Weather modifier is applied to movement speed (rainy=0.7, stormy=0.4).
  private processMovement(): void {
    const agentStore = useAgentStore.getState();
    const simStore = useSimulationStore.getState();
    const { speedMultiplier } = simStore.config;
    const weatherModifier = WEATHER_SPEED_MODIFIER[simStore.weather];

    for (const agent of agentStore.agents.values()) {
      if (agent.state !== "moving" || agent.destination === null) continue;
      if (agent.currentPath.length === 0 || agent.pathIndex >= agent.currentPath.length) continue;

      const target = agent.currentPath[agent.pathIndex];
      if (!target) continue;

      const dx = target.x - agent.position.x;
      const dy = target.y - agent.position.y;
      const dz = target.z - agent.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      const step = agent.speed * speedMultiplier * weatherModifier * (simStore.config.tickInterval / 1000);

      if (dist <= step) {
        // Reached waypoint, advance to next
        const nextIndex = agent.pathIndex + 1;
        if (nextIndex >= agent.currentPath.length) {
          // Reached destination
          agentStore.updateAgent(agent.id, {
            position: target,
            destination: null,
            currentPath: [],
            pathIndex: 0,
            state: "idle",
          });
        } else {
          agentStore.updateAgent(agent.id, {
            position: target,
            pathIndex: nextIndex,
          });
        }
      } else {
        // Move toward waypoint
        const ratio = step / dist;
        agentStore.updateAgent(agent.id, {
          position: {
            x: agent.position.x + dx * ratio,
            y: agent.position.y + dy * ratio,
            z: agent.position.z + dz * ratio,
          },
        });
      }
    }
  }

  // @MX:NOTE: AI-generated conversations triggered by proximity.
  // Uses activeInteractions set to prevent duplicate conversation generation.
  private processInteractions(): void {
    const agentStore = useAgentStore.getState();
    const simStore = useSimulationStore.getState();
    const { agentInteractionRange } = simStore.config;

    const activeAgents = Array.from(agentStore.agents.values()).filter(
      (a) => a.state !== "sleeping",
    );

    const pairs = checkInteractions(activeAgents, agentInteractionRange);

    for (const [idA, idB] of pairs) {
      const interactionKey = `${idA}-${idB}`;
      if (this.activeInteractions.has(interactionKey)) continue;

      const agentA = agentStore.getAgentById(idA);
      const agentB = agentStore.getAgentById(idB);

      if (!agentA || !agentB) continue;
      if (agentA.state === "interacting" || agentB.state === "interacting") continue;

      // Mark both agents as interacting
      agentStore.updateAgent(idA, { state: "interacting" });
      agentStore.updateAgent(idB, { state: "interacting" });
      this.activeInteractions.add(interactionKey);

      // Start conversation tracking for overlay bubbles
      const convStore = useConversationStore.getState();
      convStore.startConversation(interactionKey, [idA, idB]);

      // Fire-and-forget async conversation generation
      geminiClient
        .generateConversation(agentA, agentB)
        .then((response) => {
          const currentStore = useAgentStore.getState();
          const currentA = currentStore.getAgentById(idA);
          const currentB = currentStore.getAgentById(idB);

          if (!currentA || !currentB) return;

          const summary = response.success && response.data
            ? response.data.summary
            : "짧은 인사를 나누었습니다.";

          // Update conversation bubble with dialogue data
          if (response.success && response.data) {
            useConversationStore.getState().updateConversation(
              interactionKey,
              response.data.dialogue,
              response.data.mood,
              response.data.summary
            );
          }

          const result = endInteraction(currentA, currentB, summary);

          currentStore.updateAgent(idA, {
            state: result.agentA.state,
            memory: result.agentA.memory,
            relationships: result.agentA.relationships,
          });
          currentStore.updateAgent(idB, {
            state: result.agentB.state,
            memory: result.agentB.memory,
            relationships: result.agentB.relationships,
          });

          // End conversation bubble (triggers fade-out)
          useConversationStore.getState().endConversation(interactionKey);
        })
        .catch(() => {
          const currentStore = useAgentStore.getState();
          const currentA = currentStore.getAgentById(idA);
          const currentB = currentStore.getAgentById(idB);

          if (!currentA || !currentB) return;

          const result = endInteraction(currentA, currentB, "짧은 인사를 나누었습니다.");

          currentStore.updateAgent(idA, {
            state: result.agentA.state,
            memory: result.agentA.memory,
            relationships: result.agentA.relationships,
          });
          currentStore.updateAgent(idB, {
            state: result.agentB.state,
            memory: result.agentB.memory,
            relationships: result.agentB.relationships,
          });

          // End conversation on error too
          useConversationStore.getState().endConversation(interactionKey);
        })
        .finally(() => {
          this.activeInteractions.delete(interactionKey);
        });
    }
  }

  // @MX:NOTE: Handles nighttime behavior and storm shelter.
  // Storm: idle agents navigate to nearest building for shelter.
  // Night (22-06h): agents navigate home, enter sleeping state when arrived, wake at 6am.
  private processHomeDirection(): void {
    const agentStore = useAgentStore.getState();
    const simStore = useSimulationStore.getState();
    const cityStore = useCityStore.getState();
    const cityData = cityStore.cityData;
    const { hour } = simStore.time;

    if (!cityData) return;

    // Storm shelter: send idle agents to nearest building
    if (shouldSeekShelter(simStore.weather) && this.roadGraph) {
      for (const agent of agentStore.agents.values()) {
        if (agent.state !== "idle") continue;

        // Find the nearest building by 2D distance
        let nearestBuilding: Building | null = null;
        let nearestDist = Infinity;
        for (const building of cityData.buildings) {
          const dx = building.position.x - agent.position.x;
          const dz = building.position.y - agent.position.z;
          const dist = dx * dx + dz * dz;
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestBuilding = building;
          }
        }

        if (nearestBuilding) {
          const dest3D = { x: nearestBuilding.position.x, y: 0, z: nearestBuilding.position.y };
          const updated = assignDestination(agent, dest3D, this.roadGraph);
          if (updated.state === "moving") {
            agentStore.updateAgent(agent.id, {
              currentPath: updated.currentPath,
              destination: updated.destination,
              pathIndex: updated.pathIndex,
              state: updated.state,
            });
          }
        }
      }
    }

    for (const agent of agentStore.agents.values()) {
      // Wake sleeping agents during daytime
      if (agent.state === "sleeping" && hour >= 6 && hour < 22) {
        agentStore.updateAgent(agent.id, { state: "idle" });
        continue;
      }

      // Send idle agents home at night
      if (shouldGoHome(agent, hour) && agent.state === "idle") {
        const homeBuilding = cityData.buildings.find((b) => b.id === agent.homeBuilding);
        if (!homeBuilding) continue;

        // Check if already at home
        if (isAgentAtHome(agent, cityData.buildings)) {
          agentStore.updateAgent(agent.id, { state: "sleeping" });
          continue;
        }

        // Navigate home if road graph is available
        if (this.roadGraph) {
          const homeDest = { x: homeBuilding.position.x, y: 0, z: homeBuilding.position.y };
          const updated = assignDestination(agent, homeDest, this.roadGraph);
          if (updated.state === "moving") {
            agentStore.updateAgent(agent.id, {
              currentPath: updated.currentPath,
              destination: updated.destination,
              pathIndex: updated.pathIndex,
              state: updated.state,
            });
          }
        }
      }
    }
  }
}

// Singleton instance
export const simulationEngine = new SimulationEngine();

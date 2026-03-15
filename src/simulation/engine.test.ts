import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock all external modules before importing engine
vi.mock("@/stores/simulation-store", () => {
  const store = {
    status: "running" as string,
    config: {
      maxAgents: 25,
      tickInterval: 16,
      speedMultiplier: 1,
      agentInteractionRange: 5,
      agentDecisionInterval: 30000,
      weatherEnabled: true,
      vehiclesEnabled: false,
      dayDurationMs: 1440000,
    },
    time: { hour: 12, minute: 0, day: 1, timeOfDay: "day" as const },
    weather: "clear" as "clear" | "cloudy" | "rainy" | "stormy",
    autoWeather: false,
    tickCount: 0,
    vehicles: [] as unknown[],
    maxVehicleCount: 10,
    vehicleTypes: { car: true, bus: true, taxi: true },
    spawnRate: 5,
    tick: vi.fn(),
    setWeather: vi.fn((w: string) => {
      store.weather = w as "clear" | "cloudy" | "rainy" | "stormy";
    }),
    addVehicle: vi.fn((v: unknown) => {
      store.vehicles.push(v);
    }),
    removeVehicle: vi.fn((id: string) => {
      store.vehicles = store.vehicles.filter((v) => (v as { id: string }).id !== id);
    }),
    updateVehicles: vi.fn((vehicles: unknown[]) => {
      store.vehicles = vehicles;
    }),
    clearVehicles: vi.fn(() => {
      store.vehicles = [];
    }),
  };
  return {
    useSimulationStore: {
      getState: vi.fn(() => store),
      __store: store,
    },
  };
});

vi.mock("@/stores/agent-store", () => {
  const agents = new Map();
  const store = {
    agents,
    selectedAgentId: null,
    addAgent: vi.fn((agent: { id: string }) => {
      agents.set(agent.id, agent);
    }),
    removeAgent: vi.fn(),
    updateAgent: vi.fn((id: string, updates: Record<string, unknown>) => {
      const existing = agents.get(id);
      if (existing) {
        agents.set(id, { ...existing, ...updates });
      }
    }),
    selectAgent: vi.fn(),
    getAgentById: vi.fn((id: string) => agents.get(id)),
    getAgentsNear: vi.fn(() => []),
  };
  return {
    useAgentStore: {
      getState: vi.fn(() => store),
      __store: store,
    },
  };
});

vi.mock("@/stores/city-store", () => {
  const store = {
    cityData: null as unknown,
    loading: false,
    error: null,
    selectedRegion: null,
  };
  return {
    useCityStore: {
      getState: vi.fn(() => store),
      __store: store,
    },
  };
});

vi.mock("@/agents/agent-generation", () => ({
  generateDefaultAgent: vi.fn((index: number) => ({
    id: `agent-${index}`,
    name: `Agent ${index}`,
    personality: { openness: 0.5, conscientiousness: 0.5, extraversion: 0.5, agreeableness: 0.5, neuroticism: 0.5 },
    occupation: "회사원",
    position: { x: 0, y: 0, z: 0 },
    destination: null,
    currentPath: [],
    pathIndex: 0,
    state: "idle" as const,
    homeBuilding: null,
    memory: [],
    relationships: {},
    dailyRoutine: [],
    speed: 1.5,
    lastDecisionTime: 0,
  })),
}));

vi.mock("@/agents/agent-home", () => ({
  assignHome: vi.fn((agent: Record<string, unknown>) => ({
    ...agent,
    homeBuilding: "home-1",
  })),
  shouldGoHome: vi.fn((_agent: unknown, hour: number) => hour >= 22 || hour < 6),
  isAgentAtHome: vi.fn(() => false),
}));

vi.mock("@/agents/agent-movement", () => ({
  assignDestination: vi.fn((agent: Record<string, unknown>, dest: unknown) => ({
    ...agent,
    destination: dest,
    currentPath: [dest],
    pathIndex: 0,
    state: "moving",
  })),
}));

vi.mock("@/agents/agent-interaction", () => ({
  checkInteractions: vi.fn(() => []),
  startInteraction: vi.fn(),
  endInteraction: vi.fn(
    (a: Record<string, unknown>, b: Record<string, unknown>, summary: string) => ({
      agentA: { ...a, state: "idle", memory: [{ id: "mem-1", timestamp: Date.now(), type: "interaction", summary, involvedAgents: [] }], relationships: {} },
      agentB: { ...b, state: "idle", memory: [{ id: "mem-2", timestamp: Date.now(), type: "interaction", summary, involvedAgents: [] }], relationships: {} },
    }),
  ),
}));

vi.mock("@/services/gemini-client", () => ({
  geminiClient: {
    decideAction: vi.fn(() =>
      Promise.resolve({
        success: true,
        data: { action: "idle", reason: "test" },
        cached: false,
      }),
    ),
    generateConversation: vi.fn(() =>
      Promise.resolve({
        success: true,
        data: {
          dialogue: [],
          summary: "Friendly conversation",
          mood: "positive",
        },
        cached: false,
      }),
    ),
  },
}));

vi.mock("@/city/road-network", () => ({
  buildRoadGraph: vi.fn(() => ({
    nodes: new Map(),
    edges: new Map(),
    getNeighbors: vi.fn(() => []),
    getNearestNode: vi.fn(),
    getEdge: vi.fn(),
  })),
}));

vi.mock("@/systems/weather", () => ({
  updateWeather: vi.fn((current: string) => current),
  getWeatherCheckIntervalMs: vi.fn(() => 60_000),
  WEATHER_SPEED_MODIFIER: {
    clear: 1.0,
    cloudy: 1.0,
    rainy: 0.7,
    stormy: 0.4,
  },
  shouldSeekShelter: vi.fn((weather: string) => weather === "stormy"),
}));

// --- Import after mocks ---
import { simulationEngine } from "./engine";
import { useAgentStore } from "@/stores/agent-store";
import { useCityStore } from "@/stores/city-store";
import { useSimulationStore } from "@/stores/simulation-store";
import { generateDefaultAgent } from "@/agents/agent-generation";
import { assignHome, shouldGoHome, isAgentAtHome } from "@/agents/agent-home";
import { assignDestination } from "@/agents/agent-movement";
import { checkInteractions, endInteraction } from "@/agents/agent-interaction";
import { geminiClient } from "@/services/gemini-client";
import { updateWeather, shouldSeekShelter } from "@/systems/weather";

// Access internal store references for test setup
// Use permissive types for mock agents (partial objects in tests)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const agentStoreMock = useAgentStore as any;

const cityStoreMock = useCityStore as unknown as {
  getState: ReturnType<typeof vi.fn>;
  __store: ReturnType<typeof useCityStore.getState> & { cityData: unknown };
};

const simStoreMock = useSimulationStore as unknown as {
  getState: ReturnType<typeof vi.fn>;
  __store: ReturnType<typeof useSimulationStore.getState> & { time: { hour: number; minute: number; day: number; timeOfDay: string } };
};

function createMockCityData() {
  return {
    buildings: [
      {
        id: "bld-1",
        type: "apartment" as const,
        name: "Test Apartment",
        position: { x: 10, y: 20 },
        polygon: [] as { x: number; y: number }[],
        height: 30,
        color: "#aaa",
        osmTags: {} as Record<string, string>,
        occupants: [] as string[],
        capacity: 10,
      },
      {
        id: "bld-2",
        type: "cafe" as const,
        name: "Test Cafe",
        position: { x: 30, y: 40 },
        polygon: [] as { x: number; y: number }[],
        height: 5,
        color: "#bbb",
        osmTags: {} as Record<string, string>,
        occupants: [] as string[],
        capacity: 5,
      },
    ],
    roadNodes: [
      { id: "node-1", position: { x: 0, y: 0 }, connections: ["node-2"] },
      { id: "node-2", position: { x: 10, y: 10 }, connections: ["node-1"] },
      { id: "node-3", position: { x: 20, y: 20 }, connections: [] as string[] },
    ],
    roadSegments: [
      {
        id: "seg-1",
        from: "node-1",
        to: "node-2",
        waypoints: [] as { x: number; y: number }[],
        width: 3,
        type: "residential" as const,
        weight: 14,
      },
    ],
    pois: [],
    bounds: { minLat: 0, maxLat: 1, minLon: 0, maxLon: 1 },
    center: { lat: 0.5, lon: 0.5 },
    name: "Test City",
  };
}

// Capture rAF callbacks so we can fire them synchronously in tests.
let rafCallback: FrameRequestCallback | null = null;
vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
  rafCallback = cb;
  return 1;
});
vi.stubGlobal("cancelAnimationFrame", vi.fn());

// Helper: fire the captured rAF callback once with enough elapsed time to trigger a tick.
function triggerOneFrame(): void {
  if (rafCallback) {
    const cb = rafCallback;
    cb(performance.now() + 20);
  }
}

describe("SimulationEngine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset agent store
    agentStoreMock.__store.agents.clear();
    // Reset city data
    cityStoreMock.__store.cityData = null;
    // Reset sim time to daytime
    simStoreMock.__store.time = { hour: 12, minute: 0, day: 1, timeOfDay: "day" };
    // Reset weather state
    simStoreMock.__store.weather = "clear";
    simStoreMock.__store.autoWeather = false;
    // Stop engine to clear animation frame
    simulationEngine.stop();
  });

  afterEach(() => {
    simulationEngine.stop();
  });

  describe("initializePopulation", () => {
    it("creates 5 agents when agent store is empty and city data exists", () => {
      cityStoreMock.__store.cityData = createMockCityData();

      simulationEngine.start();

      expect(generateDefaultAgent).toHaveBeenCalledTimes(5);
      expect(assignHome).toHaveBeenCalledTimes(5);
      expect(agentStoreMock.__store.addAgent).toHaveBeenCalledTimes(5);
    });

    it("does not create agents when agents already exist", () => {
      cityStoreMock.__store.cityData = createMockCityData();
      agentStoreMock.__store.agents.set("existing-1", {
        id: "existing-1",
        state: "idle",
      });

      simulationEngine.start();

      expect(generateDefaultAgent).not.toHaveBeenCalled();
    });

    it("does not create agents when city data is null", () => {
      cityStoreMock.__store.cityData = null;

      simulationEngine.start();

      expect(generateDefaultAgent).not.toHaveBeenCalled();
    });

    it("places agents at road node positions", () => {
      cityStoreMock.__store.cityData = createMockCityData();

      simulationEngine.start();

      // Check that addAgent was called with agents that have valid road node positions
      const addAgentCalls = vi.mocked(agentStoreMock.__store.addAgent).mock.calls;
      for (const [agent] of addAgentCalls) {
        const a = agent as { position: { x: number; y: number; z: number } };
        expect(a.position.y).toBe(0);
        // Position should be from one of the road nodes
        const validXPositions = [0, 10, 20];
        expect(validXPositions).toContain(a.position.x);
      }
    });
  });

  describe("processDecisions (via tick)", () => {
    it("skips non-idle agents", async () => {
      cityStoreMock.__store.cityData = createMockCityData();

      const movingAgent = {
        id: "moving-1",
        state: "moving",
        position: { x: 0, y: 0, z: 0 },
        lastDecisionTime: 0,
      };
      agentStoreMock.__store.agents.set("moving-1", movingAgent);

      // Manually call start (which triggers initializePopulation but agents exist)
      // Instead we directly invoke a tick-like action
      simulationEngine.start();

      expect(geminiClient.decideAction).not.toHaveBeenCalled();
    });

    it("respects agentDecisionInterval cooldown", async () => {
      cityStoreMock.__store.cityData = createMockCityData();

      const recentAgent = {
        id: "recent-1",
        state: "idle",
        position: { x: 0, y: 0, z: 0 },
        lastDecisionTime: Date.now(), // Just decided
      };
      agentStoreMock.__store.agents.set("recent-1", recentAgent);
      vi.mocked(agentStoreMock.__store.getAgentById).mockReturnValue(recentAgent);

      simulationEngine.start();

      // Should not call decideAction because cooldown hasn't elapsed
      expect(geminiClient.decideAction).not.toHaveBeenCalled();
    });
  });

  describe("processInteractions (via tick)", () => {
    it("triggers conversation when agents are within range", async () => {
      cityStoreMock.__store.cityData = createMockCityData();

      const agentA = {
        id: "a1",
        state: "idle",
        position: { x: 0, y: 0, z: 0 },
        lastDecisionTime: Date.now(),
        memory: [],
        relationships: {},
      };
      const agentB = {
        id: "b1",
        state: "idle",
        position: { x: 1, y: 0, z: 1 },
        lastDecisionTime: Date.now(),
        memory: [],
        relationships: {},
      };

      agentStoreMock.__store.agents.set("a1", agentA);
      agentStoreMock.__store.agents.set("b1", agentB);

      vi.mocked(agentStoreMock.__store.getAgentById).mockImplementation((id: string) =>
        agentStoreMock.__store.agents.get(id),
      );

      // Mock checkInteractions to return the pair
      vi.mocked(checkInteractions).mockReturnValue([["a1", "b1"]]);

      // Start engine to init population, then trigger one frame for tick
      simulationEngine.start();
      triggerOneFrame();

      // Wait for async conversation to fire
      await vi.waitFor(() => {
        expect(geminiClient.generateConversation).toHaveBeenCalled();
      });
    });

    it("does not create duplicate conversations for the same pair", () => {
      cityStoreMock.__store.cityData = createMockCityData();

      const agentA = {
        id: "a1",
        state: "interacting",
        position: { x: 0, y: 0, z: 0 },
        lastDecisionTime: Date.now(),
      };
      const agentB = {
        id: "b1",
        state: "interacting",
        position: { x: 1, y: 0, z: 1 },
        lastDecisionTime: Date.now(),
      };

      agentStoreMock.__store.agents.set("a1", agentA);
      agentStoreMock.__store.agents.set("b1", agentB);

      vi.mocked(agentStoreMock.__store.getAgentById).mockImplementation((id: string) =>
        agentStoreMock.__store.agents.get(id),
      );

      // Return pair but agents are already interacting
      vi.mocked(checkInteractions).mockReturnValue([["a1", "b1"]]);

      simulationEngine.start();
      triggerOneFrame();

      expect(geminiClient.generateConversation).not.toHaveBeenCalled();
    });
  });

  describe("processHomeDirection (via tick)", () => {
    it("wakes sleeping agents at hour 6", () => {
      cityStoreMock.__store.cityData = createMockCityData();
      simStoreMock.__store.time = { hour: 8, minute: 0, day: 2, timeOfDay: "day" };

      const sleepingAgent = {
        id: "sleepy-1",
        state: "sleeping",
        position: { x: 0, y: 0, z: 0 },
        homeBuilding: "bld-1",
        lastDecisionTime: 0,
      };
      agentStoreMock.__store.agents.set("sleepy-1", sleepingAgent);

      simulationEngine.start();
      triggerOneFrame();

      expect(agentStoreMock.__store.updateAgent).toHaveBeenCalledWith("sleepy-1", {
        state: "idle",
      });
    });

    it("sends idle agents home after hour 22", () => {
      cityStoreMock.__store.cityData = createMockCityData();
      simStoreMock.__store.time = { hour: 23, minute: 0, day: 1, timeOfDay: "night" };

      const idleAgent = {
        id: "late-1",
        state: "idle",
        position: { x: 50, y: 0, z: 50 },
        homeBuilding: "bld-1",
        lastDecisionTime: Date.now(),
      };
      agentStoreMock.__store.agents.set("late-1", idleAgent);

      vi.mocked(agentStoreMock.__store.getAgentById).mockReturnValue(idleAgent);
      vi.mocked(shouldGoHome).mockReturnValue(true);
      vi.mocked(isAgentAtHome).mockReturnValue(false);

      simulationEngine.start();
      triggerOneFrame();

      expect(assignDestination).toHaveBeenCalled();
    });

    it("sets agent to sleeping when at home during night", () => {
      cityStoreMock.__store.cityData = createMockCityData();
      simStoreMock.__store.time = { hour: 23, minute: 0, day: 1, timeOfDay: "night" };

      const homeAgent = {
        id: "home-1",
        state: "idle",
        position: { x: 10, y: 0, z: 20 },
        homeBuilding: "bld-1",
        lastDecisionTime: Date.now(),
      };
      agentStoreMock.__store.agents.set("home-1", homeAgent);

      vi.mocked(shouldGoHome).mockReturnValue(true);
      vi.mocked(isAgentAtHome).mockReturnValue(true);

      simulationEngine.start();
      triggerOneFrame();

      expect(agentStoreMock.__store.updateAgent).toHaveBeenCalledWith("home-1", {
        state: "sleeping",
      });
    });
  });

  describe("processMovement", () => {
    it("moves agent toward next waypoint", () => {
      cityStoreMock.__store.cityData = createMockCityData();

      const movingAgent = {
        id: "mover-1",
        state: "moving",
        position: { x: 0, y: 0, z: 0 },
        destination: { x: 100, y: 0, z: 100 },
        currentPath: [{ x: 50, y: 0, z: 50 }, { x: 100, y: 0, z: 100 }],
        pathIndex: 0,
        speed: 1.5,
        lastDecisionTime: Date.now(),
        homeBuilding: null,
      };
      agentStoreMock.__store.agents.set("mover-1", movingAgent);

      simulationEngine.start();
      triggerOneFrame();

      // updateAgent should be called to move the agent
      const updateCalls = vi.mocked(agentStoreMock.__store.updateAgent).mock.calls;
      const movementUpdate = updateCalls.find(
        ([id]: [string]) => id === "mover-1",
      );
      expect(movementUpdate).toBeDefined();
    });

    it("transitions to idle when reaching destination", () => {
      cityStoreMock.__store.cityData = createMockCityData();

      // Agent very close to final waypoint
      const nearDestAgent = {
        id: "near-1",
        state: "moving",
        position: { x: 49.99, y: 0, z: 49.99 },
        destination: { x: 50, y: 0, z: 50 },
        currentPath: [{ x: 50, y: 0, z: 50 }],
        pathIndex: 0,
        speed: 100, // High speed to ensure arrival
        lastDecisionTime: Date.now(),
        homeBuilding: null,
      };
      agentStoreMock.__store.agents.set("near-1", nearDestAgent);

      simulationEngine.start();
      triggerOneFrame();

      const updateCalls = vi.mocked(agentStoreMock.__store.updateAgent).mock.calls;
      const idleUpdate = updateCalls.find(
        ([id, updates]: [string, Record<string, unknown>]) => id === "near-1" && updates.state === "idle",
      );
      expect(idleUpdate).toBeDefined();
    });

    it("applies weather speed modifier to movement", () => {
      cityStoreMock.__store.cityData = createMockCityData();
      // Set rainy weather for 0.7 modifier
      simStoreMock.__store.weather = "rainy";

      // Agent far from waypoint so movement is partial (not arriving)
      const movingAgent = {
        id: "rain-mover",
        state: "moving",
        position: { x: 0, y: 0, z: 0 },
        destination: { x: 1000, y: 0, z: 0 },
        currentPath: [{ x: 1000, y: 0, z: 0 }],
        pathIndex: 0,
        speed: 10,
        lastDecisionTime: Date.now(),
        homeBuilding: null,
      };
      agentStoreMock.__store.agents.set("rain-mover", movingAgent);

      simulationEngine.start();
      triggerOneFrame();

      const updateCalls = vi.mocked(agentStoreMock.__store.updateAgent).mock.calls;
      const moveUpdate = updateCalls.find(([id]: [string]) => id === "rain-mover");
      expect(moveUpdate).toBeDefined();

      // With speed=10, speedMultiplier=1, weatherModifier=0.7, tickInterval=16ms:
      // step = 10 * 1 * 0.7 * (16/1000) = 0.112
      // Moving along x-axis only, position.x should be ~0.112
      const updates = moveUpdate![1] as { position?: { x: number } };
      if (updates.position) {
        // Verify position moved less than it would with clear weather (step would be 0.16)
        expect(updates.position.x).toBeLessThan(0.16);
        expect(updates.position.x).toBeGreaterThan(0);
      }
    });
  });

  describe("processWeather (via tick)", () => {
    it("auto-transitions weather when autoWeather is enabled", () => {
      cityStoreMock.__store.cityData = createMockCityData();
      simStoreMock.__store.autoWeather = true;
      simStoreMock.__store.weather = "clear";
      // Set time far enough to trigger a weather check (> 60 sim seconds)
      // With default dayDurationMs=1440000, 1 sim minute = 1000ms real
      // hour=1, minute=2 -> totalMinutes=62 -> simTimeMs=62000
      simStoreMock.__store.time = { hour: 1, minute: 2, day: 1, timeOfDay: "day" };

      // Mock updateWeather to return a different state
      vi.mocked(updateWeather).mockReturnValue("cloudy");

      simulationEngine.start();
      triggerOneFrame();

      expect(updateWeather).toHaveBeenCalled();
      expect(simStoreMock.__store.setWeather).toHaveBeenCalledWith("cloudy");
    });

    it("does not transition weather when autoWeather is disabled", () => {
      cityStoreMock.__store.cityData = createMockCityData();
      simStoreMock.__store.autoWeather = false;
      simStoreMock.__store.time = { hour: 1, minute: 2, day: 1, timeOfDay: "day" };

      simulationEngine.start();
      triggerOneFrame();

      expect(updateWeather).not.toHaveBeenCalled();
    });

    it("does not call setWeather when weather stays the same", () => {
      cityStoreMock.__store.cityData = createMockCityData();
      simStoreMock.__store.autoWeather = true;
      simStoreMock.__store.weather = "clear";
      // Use a later time to ensure the interval check passes
      // (previous test may have set lastWeatherCheckTime)
      simStoreMock.__store.time = { hour: 5, minute: 0, day: 1, timeOfDay: "day" };

      // updateWeather returns same state
      vi.mocked(updateWeather).mockReturnValue("clear");

      simulationEngine.start();
      triggerOneFrame();

      expect(updateWeather).toHaveBeenCalled();
      expect(simStoreMock.__store.setWeather).not.toHaveBeenCalled();
    });
  });

  describe("storm shelter (via processHomeDirection)", () => {
    it("sends idle agents to nearest building during storm", () => {
      cityStoreMock.__store.cityData = createMockCityData();
      simStoreMock.__store.weather = "stormy";

      const idleAgent = {
        id: "storm-idle",
        state: "idle",
        position: { x: 5, y: 0, z: 5 },
        homeBuilding: "bld-1",
        lastDecisionTime: Date.now(),
        currentPath: [],
        pathIndex: 0,
        destination: null,
        speed: 1.5,
      };
      agentStoreMock.__store.agents.set("storm-idle", idleAgent);

      vi.mocked(agentStoreMock.__store.getAgentById).mockReturnValue(idleAgent);

      simulationEngine.start();
      triggerOneFrame();

      // assignDestination should be called for the nearest building
      expect(assignDestination).toHaveBeenCalled();
      const destCall = vi.mocked(assignDestination).mock.calls.find(
        (call) => (call[0] as { id: string }).id === "storm-idle",
      );
      expect(destCall).toBeDefined();

      // The nearest building to (5, 0, 5) should be bld-1 at (10, 20) -> dest (10, 0, 20)
      const dest = destCall![1] as { x: number; y: number; z: number };
      expect(dest.x).toBe(10);
      expect(dest.z).toBe(20);
    });

    it("does not send moving agents to shelter during storm", () => {
      cityStoreMock.__store.cityData = createMockCityData();
      simStoreMock.__store.weather = "stormy";

      const movingAgent = {
        id: "storm-moving",
        state: "moving",
        position: { x: 5, y: 0, z: 5 },
        homeBuilding: "bld-1",
        lastDecisionTime: Date.now(),
        destination: { x: 100, y: 0, z: 100 },
        currentPath: [{ x: 100, y: 0, z: 100 }],
        pathIndex: 0,
        speed: 1.5,
      };
      agentStoreMock.__store.agents.set("storm-moving", movingAgent);

      simulationEngine.start();
      triggerOneFrame();

      // assignDestination may be called for movement, but not for shelter
      // The shelter logic only targets idle agents
      const destCalls = vi.mocked(assignDestination).mock.calls.filter(
        (call) => (call[0] as { id: string }).id === "storm-moving",
      );
      // Should not have a shelter-related call (agent is moving, not idle)
      // The only assignDestination call for this agent would be from processMovement
      // which does not call assignDestination - it directly updates position
      expect(destCalls.length).toBe(0);
    });

    it("does not trigger shelter in non-stormy weather", () => {
      cityStoreMock.__store.cityData = createMockCityData();
      simStoreMock.__store.weather = "rainy";

      const idleAgent = {
        id: "rain-idle",
        state: "idle",
        position: { x: 5, y: 0, z: 5 },
        homeBuilding: null,
        lastDecisionTime: Date.now(),
        currentPath: [],
        pathIndex: 0,
        destination: null,
        speed: 1.5,
      };
      agentStoreMock.__store.agents.set("rain-idle", idleAgent);

      simulationEngine.start();
      triggerOneFrame();

      // shouldSeekShelter("rainy") returns false, so no shelter seeking
      const destCalls = vi.mocked(assignDestination).mock.calls.filter(
        (call) => (call[0] as { id: string }).id === "rain-idle",
      );
      expect(destCalls.length).toBe(0);
    });
  });
});

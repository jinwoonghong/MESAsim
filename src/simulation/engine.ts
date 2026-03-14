import { useSimulationStore } from "@/stores/simulation-store";
import { useAgentStore } from "@/stores/agent-store";

// @MX:NOTE: Simulation engine decoupled from React render cycle.
// Reads/writes Zustand stores directly via getState().
class SimulationEngine {
  private animationFrameId: number | null = null;
  private lastTickTime: number = 0;

  start(): void {
    if (this.animationFrameId !== null) return;

    this.lastTickTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
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
    simStore.tick();

    this.processAgents();
  }

  private processAgents(): void {
    const agentStore = useAgentStore.getState();
    const simStore = useSimulationStore.getState();
    const { speedMultiplier } = simStore.config;

    for (const agent of agentStore.agents.values()) {
      if (agent.state !== "moving" || agent.destination === null) continue;
      if (agent.currentPath.length === 0 || agent.pathIndex >= agent.currentPath.length) continue;

      const target = agent.currentPath[agent.pathIndex];
      if (!target) continue;

      const dx = target.x - agent.position.x;
      const dy = target.y - agent.position.y;
      const dz = target.z - agent.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      const step = agent.speed * speedMultiplier * (simStore.config.tickInterval / 1000);

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
}

// Singleton instance
export const simulationEngine = new SimulationEngine();

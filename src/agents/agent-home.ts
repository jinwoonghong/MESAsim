import type { Agent } from "@/types/agent";
import type { Building } from "@/types/city";
import { distance2D } from "@/lib/math";

const HOME_PROXIMITY_THRESHOLD = 5;

export function assignHome(agent: Agent, buildings: Building[]): Agent {
  const residential = buildings.find(
    (b) =>
      b.type === "apartment" &&
      b.occupants.length < b.capacity,
  );

  if (!residential) {
    return agent;
  }

  // Add agent to building occupants (caller must persist this side effect)
  residential.occupants.push(agent.id);

  return {
    ...agent,
    homeBuilding: residential.id,
  };
}

export function shouldGoHome(agent: Agent, hour: number): boolean {
  if (agent.homeBuilding === null) return false;
  if (agent.state === "sleeping") return false;

  return hour >= 22 || hour < 6;
}

export function isAgentAtHome(agent: Agent, buildings: Building[]): boolean {
  if (agent.homeBuilding === null) return false;

  const home = buildings.find((b) => b.id === agent.homeBuilding);
  if (!home) return false;

  const agentPos2D = { x: agent.position.x, y: agent.position.z };
  const homePos2D = { x: home.position.x, y: home.position.y };

  return distance2D(agentPos2D, homePos2D) < HOME_PROXIMITY_THRESHOLD;
}

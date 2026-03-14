import type { Agent } from "@/types/agent";
import type { RoadGraph } from "@/city/road-network";
import { findPath } from "@/systems/pathfinding";
import { distance2D } from "@/lib/math";

const WAYPOINT_REACH_THRESHOLD = 0.5;

export function moveAgentAlongPath(agent: Agent, deltaTime: number): Agent {
  if (agent.currentPath.length === 0 || agent.pathIndex >= agent.currentPath.length) {
    return agent;
  }

  const target = agent.currentPath[agent.pathIndex];
  const dx = target.x - agent.position.x;
  const dz = target.z - agent.position.z;
  const dist = Math.sqrt(dx * dx + dz * dz);

  const moveDistance = agent.speed * deltaTime;

  if (dist <= moveDistance || dist < WAYPOINT_REACH_THRESHOLD) {
    // Reached waypoint
    const newPathIndex = agent.pathIndex + 1;

    if (newPathIndex >= agent.currentPath.length) {
      // Path complete
      return {
        ...agent,
        position: { x: target.x, y: agent.position.y, z: target.z },
        pathIndex: newPathIndex,
        state: "idle",
        destination: null,
        currentPath: [],
      };
    }

    return {
      ...agent,
      position: { x: target.x, y: agent.position.y, z: target.z },
      pathIndex: newPathIndex,
    };
  }

  // Move toward waypoint
  const ratio = moveDistance / dist;
  const newX = agent.position.x + dx * ratio;
  const newZ = agent.position.z + dz * ratio;

  return {
    ...agent,
    position: { x: newX, y: agent.position.y, z: newZ },
  };
}

export function assignDestination(
  agent: Agent,
  destination: { x: number; y: number; z: number },
  graph: RoadGraph,
): Agent {
  const startPos2D = { x: agent.position.x, y: agent.position.z };
  const endPos2D = { x: destination.x, y: destination.z };

  const result = findPath(graph, startPos2D, endPos2D);

  if (!result.found || result.path.length === 0) {
    return agent;
  }

  // Convert 2D path to 3D waypoints
  const currentPath = result.path.map((point) => ({
    x: point.x,
    y: 0,
    z: point.y,
  }));

  return {
    ...agent,
    currentPath,
    destination,
    pathIndex: 0,
    state: "moving",
  };
}

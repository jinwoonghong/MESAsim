import type { RoadNode, RoadSegment } from "@/types/city";
import type { RoadGraph } from "@/city/road-network";
import { distance2D } from "@/lib/math";

export interface PathResult {
  found: boolean;
  path: { x: number; y: number }[];
  distance: number;
  nodeIds: string[];
}

// Binary min-heap priority queue keyed by f-score
interface HeapEntry {
  nodeId: string;
  fScore: number;
}

class MinHeap {
  private entries: HeapEntry[] = [];

  get size(): number {
    return this.entries.length;
  }

  push(entry: HeapEntry): void {
    this.entries.push(entry);
    this.bubbleUp(this.entries.length - 1);
  }

  pop(): HeapEntry | undefined {
    if (this.entries.length === 0) return undefined;

    const top = this.entries[0];
    const last = this.entries.pop();

    if (this.entries.length > 0 && last !== undefined) {
      this.entries[0] = last;
      this.sinkDown(0);
    }

    return top;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = (index - 1) >> 1;
      if (this.entries[index].fScore >= this.entries[parentIndex].fScore) break;
      this.swap(index, parentIndex);
      index = parentIndex;
    }
  }

  private sinkDown(index: number): void {
    const length = this.entries.length;

    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let smallest = index;

      if (
        left < length &&
        this.entries[left].fScore < this.entries[smallest].fScore
      ) {
        smallest = left;
      }

      if (
        right < length &&
        this.entries[right].fScore < this.entries[smallest].fScore
      ) {
        smallest = right;
      }

      if (smallest === index) break;
      this.swap(index, smallest);
      index = smallest;
    }
  }

  private swap(i: number, j: number): void {
    const temp = this.entries[i];
    this.entries[i] = this.entries[j];
    this.entries[j] = temp;
  }
}

// Collect detailed waypoints from road segments along the reconstructed path
function reconstructPath(
  cameFrom: Map<string, string>,
  currentId: string,
  graph: RoadGraph
): { waypoints: { x: number; y: number }[]; distance: number; nodeIds: string[] } {
  const nodeIds: string[] = [currentId];
  let id = currentId;

  while (cameFrom.has(id)) {
    const prevId = cameFrom.get(id) as string;
    nodeIds.unshift(prevId);
    id = prevId;
  }

  const waypoints: { x: number; y: number }[] = [];
  let totalDistance = 0;

  // Add the start node position
  const startNode = graph.nodes.get(nodeIds[0]);
  if (startNode) {
    waypoints.push({ x: startNode.position.x, y: startNode.position.y });
  }

  // Walk through consecutive node pairs and collect segment waypoints
  for (let i = 0; i < nodeIds.length - 1; i++) {
    const fromId = nodeIds[i];
    const toId = nodeIds[i + 1];
    const edge = graph.getEdge(fromId, toId);

    if (edge) {
      totalDistance += edge.weight;

      // Determine waypoint direction: segment may be stored from->to or to->from
      const isForward = edge.from === fromId;
      const segmentWaypoints = isForward
        ? edge.waypoints
        : [...edge.waypoints].reverse();

      // Add intermediate waypoints (skip first if it duplicates previous position)
      for (const wp of segmentWaypoints) {
        const last = waypoints[waypoints.length - 1];
        if (last && last.x === wp.x && last.y === wp.y) continue;
        waypoints.push({ x: wp.x, y: wp.y });
      }
    }

    // Add the destination node position
    const toNode = graph.nodes.get(toId);
    if (toNode) {
      const last = waypoints[waypoints.length - 1];
      if (
        !last ||
        last.x !== toNode.position.x ||
        last.y !== toNode.position.y
      ) {
        waypoints.push({ x: toNode.position.x, y: toNode.position.y });
      }
    }
  }

  return { waypoints, distance: totalDistance, nodeIds };
}

// @MX:ANCHOR: A* pathfinding on road graph -- core navigation for all agents.
// @MX:REASON: High fan_in expected from agent movement, vehicle routing, and pedestrian systems.
export function findPath(
  graph: RoadGraph,
  startPos: { x: number; y: number },
  endPos: { x: number; y: number }
): PathResult {
  const notFound: PathResult = {
    found: false,
    path: [],
    distance: 0,
    nodeIds: [],
  };

  // Snap positions to nearest road nodes
  const startNode = graph.getNearestNode(startPos);
  const endNode = graph.getNearestNode(endPos);

  if (!startNode || !endNode) {
    return notFound;
  }

  // Trivial case: start and end snap to the same node
  if (startNode.id === endNode.id) {
    return {
      found: true,
      path: [{ x: startNode.position.x, y: startNode.position.y }],
      distance: 0,
      nodeIds: [startNode.id],
    };
  }

  const goalPos = endNode.position;

  // g(n): actual cost from start to n
  const gScore = new Map<string, number>();
  gScore.set(startNode.id, 0);

  // f(n) = g(n) + h(n)
  const fScore = new Map<string, number>();
  const startH = distance2D(startNode.position, goalPos);
  fScore.set(startNode.id, startH);

  // Track visited (closed set)
  const closedSet = new Set<string>();

  // Parent map for path reconstruction
  const cameFrom = new Map<string, string>();

  // Open set as a min-heap
  const openHeap = new MinHeap();
  openHeap.push({ nodeId: startNode.id, fScore: startH });

  while (openHeap.size > 0) {
    const current = openHeap.pop();
    if (!current) break;

    const currentId = current.nodeId;

    // Goal reached
    if (currentId === endNode.id) {
      const result = reconstructPath(cameFrom, currentId, graph);
      return {
        found: true,
        path: result.waypoints,
        distance: result.distance,
        nodeIds: result.nodeIds,
      };
    }

    // Skip if already processed (heap may contain stale entries)
    if (closedSet.has(currentId)) continue;
    closedSet.add(currentId);

    const currentG = gScore.get(currentId) ?? Infinity;
    const neighbors = graph.getNeighbors(currentId);

    for (const neighbor of neighbors) {
      if (closedSet.has(neighbor.id)) continue;

      const edge = graph.getEdge(currentId, neighbor.id);
      if (!edge) continue;

      const tentativeG = currentG + edge.weight;
      const previousG = gScore.get(neighbor.id) ?? Infinity;

      if (tentativeG < previousG) {
        cameFrom.set(neighbor.id, currentId);
        gScore.set(neighbor.id, tentativeG);

        const h = distance2D(neighbor.position, goalPos);
        const f = tentativeG + h;
        fScore.set(neighbor.id, f);

        openHeap.push({ nodeId: neighbor.id, fScore: f });
      }
    }
  }

  // No path found
  return notFound;
}

import type { RoadNode, RoadSegment } from "@/types/city";

export interface RoadGraph {
  nodes: Map<string, RoadNode>;
  edges: Map<string, RoadSegment[]>;
  getNeighbors(nodeId: string): RoadNode[];
  getNearestNode(position: { x: number; y: number }): RoadNode | undefined;
  getEdge(fromId: string, toId: string): RoadSegment | undefined;
}

function distanceSquared(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function buildRoadGraph(
  roadNodes: RoadNode[],
  roadSegments: RoadSegment[]
): RoadGraph {
  const nodes = new Map<string, RoadNode>();
  const edges = new Map<string, RoadSegment[]>();

  for (const node of roadNodes) {
    nodes.set(node.id, node);
    edges.set(node.id, []);
  }

  for (const segment of roadSegments) {
    const fromEdges = edges.get(segment.from);
    if (fromEdges) {
      fromEdges.push(segment);
    }
    // Bidirectional: also add reverse lookup
    const toEdges = edges.get(segment.to);
    if (toEdges) {
      toEdges.push(segment);
    }
  }

  function getNeighbors(nodeId: string): RoadNode[] {
    const node = nodes.get(nodeId);
    if (!node) return [];

    const neighbors: RoadNode[] = [];
    for (const connId of node.connections) {
      const neighbor = nodes.get(connId);
      if (neighbor) {
        neighbors.push(neighbor);
      }
    }
    return neighbors;
  }

  function getNearestNode(
    position: { x: number; y: number }
  ): RoadNode | undefined {
    let nearest: RoadNode | undefined;
    let minDist = Infinity;

    for (const node of nodes.values()) {
      const dist = distanceSquared(position, node.position);
      if (dist < minDist) {
        minDist = dist;
        nearest = node;
      }
    }

    return nearest;
  }

  function getEdge(fromId: string, toId: string): RoadSegment | undefined {
    const fromEdges = edges.get(fromId);
    if (!fromEdges) return undefined;

    return fromEdges.find(
      (seg) =>
        (seg.from === fromId && seg.to === toId) ||
        (seg.from === toId && seg.to === fromId)
    );
  }

  return {
    nodes,
    edges,
    getNeighbors,
    getNearestNode,
    getEdge,
  };
}

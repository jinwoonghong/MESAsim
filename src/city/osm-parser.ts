import type {
  Building,
  RoadNode,
  RoadSegment,
  CityData,
} from "@/types/city";
import type { OSMElement, OSMNode, OSMResponse, OSMWay } from "./osm-fetcher";
import { wgs84ToLocal } from "@/lib/math";
import { classifyBuilding, getBuildingColor, getDefaultHeight } from "./building-types";
import { MAX_BUILDINGS, MAX_ROAD_NODES, HEIGHT_PER_LEVEL } from "./city-config";

// Road type mapping from OSM highway values to our RoadSegment types
type RoadType = RoadSegment["type"];

const HIGHWAY_TYPE_MAP: Record<string, RoadType> = {
  motorway: "motorway",
  motorway_link: "motorway",
  trunk: "primary",
  trunk_link: "primary",
  primary: "primary",
  primary_link: "primary",
  secondary: "secondary",
  secondary_link: "secondary",
  tertiary: "secondary",
  tertiary_link: "secondary",
  residential: "residential",
  living_street: "residential",
  unclassified: "residential",
  footway: "footway",
  pedestrian: "footway",
  path: "footway",
  cycleway: "footway",
  service: "service",
};

const ROAD_WIDTH_MAP: Record<RoadType, number> = {
  motorway: 12,
  primary: 8,
  secondary: 6,
  residential: 4,
  footway: 2,
  service: 3,
};

interface LatLon {
  lat: number;
  lon: number;
}

// Build a lookup table of node id -> lat/lon from all OSM node elements
function buildNodeLookup(elements: OSMElement[]): Map<number, LatLon> {
  const lookup = new Map<number, LatLon>();
  for (const el of elements) {
    if (el.type === "node") {
      const node = el as OSMNode;
      lookup.set(node.id, { lat: node.lat, lon: node.lon });
    }
  }
  return lookup;
}

function computePolygonCenter(
  points: Array<{ x: number; y: number }>
): { x: number; y: number } {
  if (points.length === 0) return { x: 0, y: 0 };
  let sumX = 0;
  let sumY = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
  }
  return { x: sumX / points.length, y: sumY / points.length };
}

function distanceBetween(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function parseBuildings(
  elements: OSMElement[],
  center: { lat: number; lon: number }
): Building[] {
  const nodeLookup = buildNodeLookup(elements);
  const buildings: Building[] = [];

  for (const el of elements) {
    if (buildings.length >= MAX_BUILDINGS) break;

    const tags = el.tags ?? {};
    const isBuilding = tags.building !== undefined;
    if (!isBuilding) continue;

    let coords: LatLon[] = [];

    if (el.type === "way") {
      const way = el as OSMWay;
      if (way.geometry) {
        coords = way.geometry;
      } else {
        // Resolve node references
        for (const nodeId of way.nodes) {
          const pos = nodeLookup.get(nodeId);
          if (pos) coords.push(pos);
        }
      }
    } else if (el.type === "relation") {
      // Use outer members' geometry
      for (const member of el.members) {
        if (member.role === "outer" && member.geometry) {
          coords = member.geometry;
          break;
        }
      }
    }

    if (coords.length < 3) continue;

    const polygon = coords.map((c) => {
      const local = wgs84ToLocal(c.lat, c.lon, center.lat, center.lon);
      return { x: local.x, y: local.z };
    });

    const buildingType = classifyBuilding(tags);

    // Estimate height from OSM tags or use defaults
    let height: number;
    if (tags["building:height"]) {
      height = parseFloat(tags["building:height"]) || getDefaultHeight(buildingType);
    } else if (tags["building:levels"]) {
      const levels = parseInt(tags["building:levels"], 10);
      height = levels > 0 ? levels * HEIGHT_PER_LEVEL : getDefaultHeight(buildingType);
    } else if (tags.height) {
      height = parseFloat(tags.height) || getDefaultHeight(buildingType);
    } else {
      height = getDefaultHeight(buildingType);
    }

    const position = computePolygonCenter(polygon);

    buildings.push({
      id: `building-${el.id}`,
      type: buildingType,
      name: tags.name,
      position,
      polygon,
      height,
      color: getBuildingColor(buildingType),
      osmTags: tags,
      occupants: [],
      capacity: Math.max(1, Math.floor(height / HEIGHT_PER_LEVEL) * 4),
    });
  }

  return buildings;
}

export function parseRoads(
  elements: OSMElement[],
  center: { lat: number; lon: number }
): { roadNodes: RoadNode[]; roadSegments: RoadSegment[] } {
  const nodeLookup = buildNodeLookup(elements);

  // Collect all highway ways
  const highways: OSMWay[] = [];
  for (const el of elements) {
    if (el.type === "way" && el.tags?.highway) {
      highways.push(el as OSMWay);
    }
  }

  // Count how many ways reference each node to find intersections
  const nodeRefCount = new Map<number, number>();
  for (const way of highways) {
    for (const nodeId of way.nodes) {
      nodeRefCount.set(nodeId, (nodeRefCount.get(nodeId) ?? 0) + 1);
    }
    // Endpoints are always intersection candidates
    if (way.nodes.length >= 2) {
      const first = way.nodes[0];
      const last = way.nodes[way.nodes.length - 1];
      nodeRefCount.set(first, (nodeRefCount.get(first) ?? 0) + 1);
      nodeRefCount.set(last, (nodeRefCount.get(last) ?? 0) + 1);
    }
  }

  // Intersection nodes: referenced by 2+ ways or are endpoints
  const intersectionIds = new Set<number>();
  for (const [nodeId, count] of nodeRefCount) {
    if (count >= 2) {
      intersectionIds.add(nodeId);
    }
  }

  // Also add all way endpoints as road nodes
  for (const way of highways) {
    if (way.nodes.length >= 2) {
      intersectionIds.add(way.nodes[0]);
      intersectionIds.add(way.nodes[way.nodes.length - 1]);
    }
  }

  // Build road nodes
  const roadNodesMap = new Map<string, RoadNode>();
  let nodeCount = 0;

  for (const nodeId of intersectionIds) {
    if (nodeCount >= MAX_ROAD_NODES) break;
    const pos = nodeLookup.get(nodeId);
    if (!pos) continue;

    const local = wgs84ToLocal(pos.lat, pos.lon, center.lat, center.lon);
    const id = `node-${nodeId}`;
    roadNodesMap.set(id, {
      id,
      position: { x: local.x, y: local.z },
      connections: [],
    });
    nodeCount++;
  }

  // Build road segments by splitting ways at intersections
  const roadSegments: RoadSegment[] = [];

  for (const way of highways) {
    const highwayTag = way.tags?.highway ?? "";
    const roadType: RoadType = HIGHWAY_TYPE_MAP[highwayTag] ?? "residential";
    const width = ROAD_WIDTH_MAP[roadType];

    // Split way into segments between intersection nodes
    let segmentStart = 0;

    for (let i = 0; i < way.nodes.length; i++) {
      const nodeId = way.nodes[i];
      const isIntersection = intersectionIds.has(nodeId);

      if (isIntersection && i > segmentStart) {
        const fromId = `node-${way.nodes[segmentStart]}`;
        const toId = `node-${nodeId}`;

        if (roadNodesMap.has(fromId) && roadNodesMap.has(toId)) {
          // Build waypoints for this segment
          const waypoints: Array<{ x: number; y: number }> = [];
          for (let j = segmentStart; j <= i; j++) {
            const wPos = nodeLookup.get(way.nodes[j]);
            if (wPos) {
              const local = wgs84ToLocal(
                wPos.lat,
                wPos.lon,
                center.lat,
                center.lon
              );
              waypoints.push({ x: local.x, y: local.z });
            }
          }

          // Calculate weight as total distance in meters
          let weight = 0;
          for (let j = 1; j < waypoints.length; j++) {
            weight += distanceBetween(waypoints[j - 1], waypoints[j]);
          }

          const segmentId = `seg-${way.id}-${segmentStart}-${i}`;
          roadSegments.push({
            id: segmentId,
            from: fromId,
            to: toId,
            waypoints,
            width,
            type: roadType,
            weight,
          });

          // Update connections in road nodes
          const fromNode = roadNodesMap.get(fromId);
          const toNode = roadNodesMap.get(toId);
          if (fromNode && !fromNode.connections.includes(toId)) {
            fromNode.connections.push(toId);
          }
          if (toNode && !toNode.connections.includes(fromId)) {
            toNode.connections.push(fromId);
          }
        }

        segmentStart = i;
      }
    }
  }

  return {
    roadNodes: Array.from(roadNodesMap.values()),
    roadSegments,
  };
}

export function parseOSMResponse(
  osmData: OSMResponse,
  center: { lat: number; lon: number },
  name: string,
  bounds: { south: number; west: number; north: number; east: number }
): CityData {
  const buildings = parseBuildings(osmData.elements, center);
  const { roadNodes, roadSegments } = parseRoads(osmData.elements, center);

  return {
    buildings,
    roadNodes,
    roadSegments,
    bounds: {
      minLat: bounds.south,
      maxLat: bounds.north,
      minLon: bounds.west,
      maxLon: bounds.east,
    },
    center,
    name,
  };
}

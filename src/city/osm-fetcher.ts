import {
  OVERPASS_API_URL,
  OVERPASS_TIMEOUT_SECONDS,
  FETCH_MAX_RETRIES,
  FETCH_BASE_DELAY_MS,
} from "./city-config";

// Raw Overpass JSON response types
export interface OSMNode {
  type: "node";
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

export interface OSMWay {
  type: "way";
  id: number;
  nodes: number[];
  tags?: Record<string, string>;
  geometry?: Array<{ lat: number; lon: number }>;
}

export interface OSMRelation {
  type: "relation";
  id: number;
  members: Array<{
    type: string;
    ref: number;
    role: string;
    geometry?: Array<{ lat: number; lon: number }>;
  }>;
  tags?: Record<string, string>;
}

export type OSMElement = OSMNode | OSMWay | OSMRelation;

export interface OSMResponse {
  elements: OSMElement[];
}

interface BoundsRect {
  south: number;
  west: number;
  north: number;
  east: number;
}

// In-memory cache keyed by bounds hash
const cache = new Map<string, OSMResponse>();

function boundsKey(bounds: BoundsRect): string {
  return `${bounds.south.toFixed(6)},${bounds.west.toFixed(6)},${bounds.north.toFixed(6)},${bounds.east.toFixed(6)}`;
}

function buildOverpassQuery(bounds: BoundsRect): string {
  const bbox = `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`;
  return `
[out:json][timeout:${OVERPASS_TIMEOUT_SECONDS}];
(
  way["building"](${bbox});
  relation["building"](${bbox});
  way["highway"](${bbox});
  node["amenity"](${bbox});
  node["shop"](${bbox});
  node["railway"="station"](${bbox});
  node["railway"="subway_entrance"](${bbox});
);
out body geom;
>;
out skel qt;
`.trim();
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// @MX:NOTE: Fetches OSM data with retry logic (exponential backoff) and in-memory caching.
export async function fetchOSMData(bounds: BoundsRect): Promise<OSMResponse> {
  const key = boundsKey(bounds);
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  const query = buildOverpassQuery(bounds);
  let lastError: unknown = null;

  for (let attempt = 0; attempt < FETCH_MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(OVERPASS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (!response.ok) {
        throw new Error(
          `Overpass API returned ${response.status}: ${response.statusText}`
        );
      }

      const data = (await response.json()) as OSMResponse;
      cache.set(key, data);
      return data;
    } catch (error: unknown) {
      lastError = error;
      if (attempt < FETCH_MAX_RETRIES - 1) {
        const delay = FETCH_BASE_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to fetch OSM data after retries");
}

export function clearOSMCache(): void {
  cache.clear();
}

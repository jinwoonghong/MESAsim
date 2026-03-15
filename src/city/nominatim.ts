import type { NominatimResult } from "@/types/poi";

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "MESAsim/1.0";
const MIN_REQUEST_INTERVAL_MS = 1000;

// Module-level throttle state
let lastRequestTime = 0;

/**
 * Reset the rate limiter state. Intended for testing only.
 */
export function resetNominatimThrottle(): void {
  lastRequestTime = 0;
}

/**
 * Search for locations in South Korea using the Nominatim geocoding API.
 * Rate-limited to at most 1 request per second.
 */
export async function searchNominatim(
  query: string
): Promise<NominatimResult[]> {
  // Rate limiting: wait if less than 1s since last call
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (lastRequestTime > 0 && elapsed < MIN_REQUEST_INTERVAL_MS) {
    const waitTime = MIN_REQUEST_INTERVAL_MS - elapsed;
    await new Promise<void>((resolve) => setTimeout(resolve, waitTime));
  }

  const url = `${NOMINATIM_BASE_URL}?q=${encodeURIComponent(query)}&format=json&countrycodes=kr&limit=5`;

  try {
    lastRequestTime = Date.now();
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as NominatimResult[];
    return data;
  } catch {
    return [];
  }
}

/**
 * Convert a NominatimResult's boundingbox strings to numeric bounds.
 * Nominatim returns boundingbox as [south, north, west, east] strings.
 */
export function nominatimResultToBounds(
  result: NominatimResult
): { south: number; north: number; west: number; east: number } {
  return {
    south: parseFloat(result.boundingbox[0]),
    north: parseFloat(result.boundingbox[1]),
    west: parseFloat(result.boundingbox[2]),
    east: parseFloat(result.boundingbox[3]),
  };
}

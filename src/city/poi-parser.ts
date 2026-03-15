import type { POI, POICategory } from "@/types/poi";
import type { OSMElement } from "./osm-fetcher";

const DEFAULT_MAX_COUNT = 200;

// Category display names used as fallback for POI name
const CATEGORY_DISPLAY_NAMES: Record<POICategory, string> = {
  convenience_store: "Convenience Store",
  cafe: "Cafe",
  restaurant: "Restaurant",
  pharmacy: "Pharmacy",
  bank: "Bank",
  subway_entrance: "Subway Entrance",
  other: "POI",
};

/**
 * Maps OSM amenity/shop/railway tags to a POICategory.
 */
export function classifyPOI(tags: Record<string, string>): POICategory {
  // Check railway first (subway_entrance is very specific)
  if (tags.railway === "subway_entrance") {
    return "subway_entrance";
  }

  // Check amenity tags
  const amenity = tags.amenity;
  if (amenity) {
    switch (amenity) {
      case "convenience_store":
        return "convenience_store";
      case "cafe":
        return "cafe";
      case "restaurant":
      case "fast_food":
        return "restaurant";
      case "pharmacy":
        return "pharmacy";
      case "bank":
      case "atm":
        return "bank";
      default:
        return "other";
    }
  }

  // Check shop tags
  const shop = tags.shop;
  if (shop) {
    if (shop === "convenience") {
      return "convenience_store";
    }
    return "other";
  }

  return "other";
}

/**
 * Extract POI nodes from raw OSM elements, classify them,
 * and transform coordinates to local space.
 */
export function parsePOIs(
  elements: OSMElement[],
  transformCoord: (lat: number, lon: number) => { x: number; y: number },
  maxCount: number = DEFAULT_MAX_COUNT
): POI[] {
  const pois: POI[] = [];

  for (const el of elements) {
    if (pois.length >= maxCount) break;

    // Only process node elements with lat/lon
    if (el.type !== "node") continue;

    const tags = el.tags ?? {};

    // Must have at least one relevant tag
    const hasRelevantTag =
      tags.amenity !== undefined ||
      tags.shop !== undefined ||
      tags.railway === "subway_entrance";

    if (!hasRelevantTag) continue;

    const category = classifyPOI(tags);
    const position = transformCoord(el.lat, el.lon);

    // Determine name: Korean name -> English name -> category display name
    const name =
      tags.name || tags["name:en"] || CATEGORY_DISPLAY_NAMES[category];
    const nameEn = tags["name:en"];

    pois.push({
      id: `poi-${el.id}`,
      name,
      ...(nameEn !== undefined ? { nameEn } : {}),
      category,
      position,
      osmTags: tags,
    });
  }

  return pois;
}

import type { BuildingType } from "@/types/city";

// @MX:NOTE: Classification logic maps OSM tags to the project's BuildingType enum.
// Priority order matters: more specific tags (amenity, shop) are checked before generic building tags.
export function classifyBuilding(tags: Record<string, string>): BuildingType {
  // Amenity-based classification (most specific)
  if (tags.amenity === "cafe") return "cafe";
  if (tags.amenity === "restaurant" || tags.amenity === "fast_food")
    return "restaurant";
  if (tags.amenity === "school" || tags.amenity === "university")
    return "school";
  if (tags.amenity === "hospital" || tags.amenity === "clinic")
    return "hospital";
  if (tags.amenity === "community_centre") return "public";

  // Shop-based classification
  if (tags.shop === "convenience" || tags.amenity === "convenience")
    return "convenience";

  // Leisure-based classification
  if (tags.leisure === "park" || tags.leisure === "garden") return "park";

  // Building tag classification
  if (tags.building === "apartments" || tags.building === "residential")
    return "apartment";
  if (tags.building === "office" || tags.building === "commercial")
    return "commercial";
  if (tags.building === "public") return "public";

  return "unknown";
}

const BUILDING_COLORS: Record<BuildingType, string> = {
  apartment: "#7C9EB5",
  officetel: "#8FA4B8",
  commercial: "#C4956A",
  convenience: "#7BC67E",
  cafe: "#D4A574",
  restaurant: "#E8845C",
  school: "#B8A9D4",
  hospital: "#FFFFFF",
  park: "#5DAE5A",
  public: "#A0A0A0",
  unknown: "#CCCCCC",
};

export function getBuildingColor(type: BuildingType): string {
  return BUILDING_COLORS[type];
}

const DEFAULT_HEIGHTS: Record<BuildingType, number> = {
  apartment: 45,
  officetel: 30,
  commercial: 12,
  convenience: 4,
  cafe: 4,
  restaurant: 4,
  school: 12,
  hospital: 18,
  park: 0,
  public: 10,
  unknown: 8,
};

export function getDefaultHeight(type: BuildingType): number {
  return DEFAULT_HEIGHTS[type];
}

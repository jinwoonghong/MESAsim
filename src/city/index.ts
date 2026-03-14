export {
  type KoreanRegion,
  getRegionById,
  getAllRegions,
  searchRegions,
} from "./korean-regions";

export { fetchOSMData, clearOSMCache } from "./osm-fetcher";
export type { OSMNode, OSMWay, OSMRelation, OSMElement, OSMResponse } from "./osm-fetcher";

export { parseOSMResponse, parseBuildings, parseRoads } from "./osm-parser";

export {
  classifyBuilding,
  getBuildingColor,
  getDefaultHeight,
} from "./building-types";

export { buildRoadGraph } from "./road-network";
export type { RoadGraph } from "./road-network";

export {
  CITY_SCALE,
  DEFAULT_BOUNDS_SIZE,
  MAX_BUILDINGS,
  MAX_ROAD_NODES,
  HEIGHT_PER_LEVEL,
  OVERPASS_API_URL,
  FETCH_MAX_RETRIES,
  FETCH_BASE_DELAY_MS,
  OVERPASS_TIMEOUT_SECONDS,
} from "./city-config";

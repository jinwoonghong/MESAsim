// How many 3D units per real-world meter (1:1 scale by default)
export const CITY_SCALE = 1.0;

// Default bounding box size in meters for region queries
export const DEFAULT_BOUNDS_SIZE = 500;

// Maximum number of buildings to process from OSM data
export const MAX_BUILDINGS = 2000;

// Maximum number of road nodes to process from OSM data
export const MAX_ROAD_NODES = 5000;

// Height per building level (meters) when estimating from building:levels tag
export const HEIGHT_PER_LEVEL = 3;

// Overpass API endpoint
export const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";

// Retry configuration for API requests
export const FETCH_MAX_RETRIES = 3;
export const FETCH_BASE_DELAY_MS = 1000;

// Overpass query timeout in seconds
export const OVERPASS_TIMEOUT_SECONDS = 25;

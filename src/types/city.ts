export type BuildingType =
  | "apartment"
  | "officetel"
  | "commercial"
  | "convenience"
  | "cafe"
  | "restaurant"
  | "school"
  | "hospital"
  | "park"
  | "public"
  | "unknown";

export interface Building {
  id: string;
  type: BuildingType;
  name?: string;
  position: { x: number; y: number };
  polygon: { x: number; y: number }[];
  height: number;
  color: string;
  osmTags: Record<string, string>;
  occupants: string[];
  capacity: number;
}

export interface RoadNode {
  id: string;
  position: { x: number; y: number };
  connections: string[];
}

export interface RoadSegment {
  id: string;
  from: string;
  to: string;
  waypoints: { x: number; y: number }[];
  width: number;
  type:
    | "motorway"
    | "primary"
    | "secondary"
    | "residential"
    | "footway"
    | "service";
  weight: number;
}

export interface CityData {
  buildings: Building[];
  roadNodes: RoadNode[];
  roadSegments: RoadSegment[];
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
  center: { lat: number; lon: number };
  name: string;
}

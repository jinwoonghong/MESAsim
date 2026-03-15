export type POICategory =
  | "convenience_store"
  | "cafe"
  | "restaurant"
  | "pharmacy"
  | "bank"
  | "subway_entrance"
  | "other";

export interface POI {
  id: string;
  name: string;
  nameEn?: string;
  category: POICategory;
  position: { x: number; y: number };
  osmTags: Record<string, string>;
}

export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox: [string, string, string, string];
  type: string;
  importance: number;
}

interface Point2D {
  x: number;
  y: number;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

export function distance2D(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function distance3D(a: Point3D, b: Point3D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// @MX:NOTE: Mercator projection for converting WGS84 lat/lon to local XZ coordinates.
// Returns meters relative to centerLat/centerLon.
export function wgs84ToLocal(
  lat: number,
  lon: number,
  centerLat: number,
  centerLon: number
): { x: number; z: number } {
  const EARTH_RADIUS = 6378137; // meters
  const DEG_TO_RAD = Math.PI / 180;

  const x =
    (lon - centerLon) *
    DEG_TO_RAD *
    EARTH_RADIUS *
    Math.cos(centerLat * DEG_TO_RAD);
  const z = (lat - centerLat) * DEG_TO_RAD * EARTH_RADIUS;

  return { x, z };
}

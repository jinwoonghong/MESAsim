export interface KoreanRegion {
  id: string;
  name: string;
  nameEn: string;
  center: { lat: number; lon: number };
  bounds: { south: number; west: number; north: number; east: number };
  description: string;
}

// Roughly 500m x 500m bounding boxes around each center.
// At ~37N latitude: 1 degree lat ~ 111km, 1 degree lon ~ 88km.
// 500m ~ 0.0045 lat, ~0.0057 lon.
const HALF_LAT = 0.00225;
const HALF_LON = 0.00285;

function makeBounds(
  lat: number,
  lon: number
): { south: number; west: number; north: number; east: number } {
  return {
    south: lat - HALF_LAT,
    west: lon - HALF_LON,
    north: lat + HALF_LAT,
    east: lon + HALF_LON,
  };
}

const KOREAN_REGIONS: KoreanRegion[] = [
  {
    id: "gangnam",
    name: "강남역",
    nameEn: "Gangnam Station",
    center: { lat: 37.498, lon: 127.028 },
    bounds: makeBounds(37.498, 127.028),
    description:
      "Major commercial and business district in southern Seoul, known for its vibrant nightlife and shopping.",
  },
  {
    id: "hongdae",
    name: "홍대",
    nameEn: "Hongdae",
    center: { lat: 37.557, lon: 126.924 },
    bounds: makeBounds(37.557, 126.924),
    description:
      "Youthful arts and entertainment district near Hongik University, famous for indie culture and street performances.",
  },
  {
    id: "haeundae",
    name: "해운대",
    nameEn: "Haeundae",
    center: { lat: 35.159, lon: 129.16 },
    bounds: makeBounds(35.159, 129.16),
    description:
      "Busan's premier beach district with high-rise hotels, seafood restaurants, and ocean views.",
  },
  {
    id: "myeongdong",
    name: "명동",
    nameEn: "Myeongdong",
    center: { lat: 37.563, lon: 126.986 },
    bounds: makeBounds(37.563, 126.986),
    description:
      "Seoul's most popular shopping and tourism district, packed with cosmetics stores and street food vendors.",
  },
  {
    id: "itaewon",
    name: "이태원",
    nameEn: "Itaewon",
    center: { lat: 37.534, lon: 126.994 },
    bounds: makeBounds(37.534, 126.994),
    description:
      "Multicultural neighborhood known for international cuisine, diverse nightlife, and expatriate community.",
  },
  {
    id: "jamsil",
    name: "잠실",
    nameEn: "Jamsil",
    center: { lat: 37.513, lon: 127.1 },
    bounds: makeBounds(37.513, 127.1),
    description:
      "Home to Lotte World, Olympic Park, and major sports facilities along the Han River.",
  },
  {
    id: "sinchon",
    name: "신촌",
    nameEn: "Sinchon",
    center: { lat: 37.556, lon: 126.937 },
    bounds: makeBounds(37.556, 126.937),
    description:
      "University district near Yonsei and Ewha, bustling with affordable restaurants and student culture.",
  },
  {
    id: "daehakro",
    name: "대학로",
    nameEn: "Daehakro",
    center: { lat: 37.58, lon: 127.003 },
    bounds: makeBounds(37.58, 127.003),
    description:
      "Seoul's theater district with over 100 small stages, centered around Marronnier Park.",
  },
];

export function getRegionById(id: string): KoreanRegion | undefined {
  return KOREAN_REGIONS.find((r) => r.id === id);
}

export function getAllRegions(): KoreanRegion[] {
  return [...KOREAN_REGIONS];
}

export function searchRegions(query: string): KoreanRegion[] {
  const lower = query.toLowerCase();
  return KOREAN_REGIONS.filter(
    (r) =>
      r.id.includes(lower) ||
      r.name.includes(query) ||
      r.nameEn.toLowerCase().includes(lower) ||
      r.description.toLowerCase().includes(lower)
  );
}

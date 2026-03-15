import { describe, it, expect } from "vitest";
import { classifyPOI, parsePOIs } from "./poi-parser";
import type { OSMElement } from "./osm-fetcher";

describe("classifyPOI", () => {
  it("classifies amenity=convenience_store as convenience_store", () => {
    expect(classifyPOI({ amenity: "convenience_store" })).toBe(
      "convenience_store"
    );
  });

  it("classifies shop=convenience as convenience_store", () => {
    expect(classifyPOI({ shop: "convenience" })).toBe("convenience_store");
  });

  it("classifies amenity=cafe as cafe", () => {
    expect(classifyPOI({ amenity: "cafe" })).toBe("cafe");
  });

  it("classifies amenity=restaurant as restaurant", () => {
    expect(classifyPOI({ amenity: "restaurant" })).toBe("restaurant");
  });

  it("classifies amenity=fast_food as restaurant", () => {
    expect(classifyPOI({ amenity: "fast_food" })).toBe("restaurant");
  });

  it("classifies amenity=pharmacy as pharmacy", () => {
    expect(classifyPOI({ amenity: "pharmacy" })).toBe("pharmacy");
  });

  it("classifies amenity=bank as bank", () => {
    expect(classifyPOI({ amenity: "bank" })).toBe("bank");
  });

  it("classifies amenity=atm as bank", () => {
    expect(classifyPOI({ amenity: "atm" })).toBe("bank");
  });

  it("classifies railway=subway_entrance as subway_entrance", () => {
    expect(classifyPOI({ railway: "subway_entrance" })).toBe(
      "subway_entrance"
    );
  });

  it("classifies unknown amenity as other", () => {
    expect(classifyPOI({ amenity: "library" })).toBe("other");
  });

  it("classifies unknown shop as other", () => {
    expect(classifyPOI({ shop: "clothes" })).toBe("other");
  });

  it("classifies tags with no relevant keys as other", () => {
    expect(classifyPOI({ name: "Something" })).toBe("other");
  });

  it("prioritizes railway=subway_entrance over amenity", () => {
    expect(
      classifyPOI({ railway: "subway_entrance", amenity: "cafe" })
    ).toBe("subway_entrance");
  });
});

describe("parsePOIs", () => {
  const identity = (lat: number, lon: number): { x: number; y: number } => ({
    x: lon,
    y: lat,
  });

  function makeNode(
    id: number,
    lat: number,
    lon: number,
    tags: Record<string, string>
  ): OSMElement {
    return { type: "node", id, lat, lon, tags } as OSMElement;
  }

  it("extracts POI nodes with correct fields", () => {
    const elements: OSMElement[] = [
      makeNode(1, 37.5, 127.0, {
        amenity: "cafe",
        name: "Coffee Shop",
        "name:en": "Coffee Shop EN",
      }),
    ];

    const pois = parsePOIs(elements, identity);
    expect(pois).toHaveLength(1);
    expect(pois[0]).toEqual({
      id: "poi-1",
      name: "Coffee Shop",
      nameEn: "Coffee Shop EN",
      category: "cafe",
      position: { x: 127.0, y: 37.5 },
      osmTags: {
        amenity: "cafe",
        name: "Coffee Shop",
        "name:en": "Coffee Shop EN",
      },
    });
  });

  it("uses name:en as fallback when name is missing", () => {
    const elements: OSMElement[] = [
      makeNode(2, 37.5, 127.0, {
        amenity: "restaurant",
        "name:en": "Korean BBQ",
      }),
    ];

    const pois = parsePOIs(elements, identity);
    expect(pois[0].name).toBe("Korean BBQ");
    expect(pois[0].nameEn).toBe("Korean BBQ");
  });

  it("uses category display name as fallback when no name tags exist", () => {
    const elements: OSMElement[] = [
      makeNode(3, 37.5, 127.0, { amenity: "pharmacy" }),
    ];

    const pois = parsePOIs(elements, identity);
    expect(pois[0].name).toBe("Pharmacy");
    expect(pois[0].nameEn).toBeUndefined();
  });

  it("applies transformCoord to positions", () => {
    const doubleTransform = (
      lat: number,
      lon: number
    ): { x: number; y: number } => ({
      x: lon * 2,
      y: lat * 2,
    });

    const elements: OSMElement[] = [
      makeNode(4, 10.0, 20.0, { amenity: "bank" }),
    ];

    const pois = parsePOIs(elements, doubleTransform);
    expect(pois[0].position).toEqual({ x: 40.0, y: 20.0 });
  });

  it("respects maxCount cap", () => {
    const elements: OSMElement[] = Array.from({ length: 10 }, (_, i) =>
      makeNode(i + 100, 37.5, 127.0, { amenity: "cafe" })
    );

    const pois = parsePOIs(elements, identity, 3);
    expect(pois).toHaveLength(3);
  });

  it("skips non-node elements", () => {
    const elements: OSMElement[] = [
      {
        type: "way",
        id: 10,
        nodes: [1, 2, 3],
        tags: { amenity: "cafe" },
      } as OSMElement,
    ];

    const pois = parsePOIs(elements, identity);
    expect(pois).toHaveLength(0);
  });

  it("skips nodes without relevant tags", () => {
    const elements: OSMElement[] = [
      makeNode(20, 37.5, 127.0, { building: "yes" }),
    ];

    const pois = parsePOIs(elements, identity);
    expect(pois).toHaveLength(0);
  });

  it("handles elements with no tags", () => {
    const elements: OSMElement[] = [
      { type: "node", id: 30, lat: 37.5, lon: 127.0 } as OSMElement,
    ];

    const pois = parsePOIs(elements, identity);
    expect(pois).toHaveLength(0);
  });

  it("does not include nameEn when name:en is absent", () => {
    const elements: OSMElement[] = [
      makeNode(5, 37.5, 127.0, { amenity: "cafe", name: "Korean Name" }),
    ];

    const pois = parsePOIs(elements, identity);
    expect(pois[0].nameEn).toBeUndefined();
    expect("nameEn" in pois[0]).toBe(false);
  });
});

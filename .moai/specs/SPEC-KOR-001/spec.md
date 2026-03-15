---
id: SPEC-KOR-001
title: "Korean Urban Features - POI, Subway, Hangul Labels, Geocoding"
version: 0.1.0
status: draft
created: 2026-03-15
updated: 2026-03-15
author: MoAI
priority: medium
issue_number: 0
parent: SPEC-SIM-001
lifecycle: spec-first
tags: [korean, poi, subway, hangul, nominatim, geocoding, osm]
---

# SPEC-KOR-001: Korean Urban Features - POI, Subway, Hangul Labels, Geocoding

## Overview

Extends MESAsim's Korean cityscape rendering with Points of Interest (POI) markers, subway entrance landmarks, Korean hangul labels on buildings and landmarks, and Nominatim geocoding for custom address search. These features bring the 3D city environment closer to a recognizable Korean urban experience.

Parent: SPEC-SIM-001 (R2.5 Korean Urban Features + R2.2.3 Nominatim Geocoding)

---

## Environment

| Aspect           | Specification                                              |
| ---------------- | ---------------------------------------------------------- |
| Runtime          | Browser (modern Chrome, Firefox, Edge with WebGL 2)        |
| Framework        | Next.js 15+ with App Router, TypeScript 5.7+               |
| 3D Rendering     | Three.js via @react-three/fiber 8, @react-three/drei 9     |
| State Management | Zustand 5                                                   |
| Styling          | Tailwind CSS 4.x                                            |
| Data Source       | OpenStreetMap Overpass API, Nominatim API                   |
| Package Manager  | pnpm (npm on exFAT filesystems)                            |
| Build            | Next.js 15 with Turbopack                                   |

---

## Assumptions

1. The existing Overpass API query already fetches `node["amenity"]` and `node["railway"="station"]` elements (confirmed in `osm-fetcher.ts`).
2. OSM data for Korean regions contains `amenity`, `shop`, and `railway=subway_entrance` tags with reasonable coverage.
3. Korean hangul text is available in OSM `name` tags for most buildings and POIs in the selected regions.
4. The Nominatim API (nominatim.openstreetmap.org) is publicly available with a usage policy of max 1 request per second and a custom User-Agent header.
5. @react-three/drei `Text` or `Html` components can render Korean hangul text in the 3D scene at acceptable performance.
6. POI and subway markers are rendered as simple 3D icons or billboards, not detailed models.

---

## Requirements

### R2.5.1: POI Markers

#### R2.5.1.1 POI Extraction (Event-Driven)

**When** OSM data is fetched for a region, the system **shall** extract POI nodes with `amenity` or `shop` tags and classify them into categories: convenience_store, cafe, restaurant, pharmacy, bank, and other.

#### R2.5.1.2 POI Data Model (Ubiquitous)

The system **shall** represent each POI with: id, name (Korean and English if available), category, position (local 3D coordinates), and original OSM tags.

#### R2.5.1.3 POI 3D Rendering (State-Driven)

**While** POI display is enabled in the UI, the system **shall** render POI markers as colored billboard icons above the ground plane at each POI position, with distinct colors per category.

#### R2.5.1.4 POI Toggle (Event-Driven)

**When** the user toggles the POI visibility control, the system **shall** show or hide all POI markers without re-fetching data.

### R2.5.2: Subway Entrance Landmarks

#### R2.5.2.1 Subway Extraction (Event-Driven)

**When** OSM data is fetched, the system **shall** extract nodes tagged `railway=subway_entrance` and parse the `name` tag for station identification.

#### R2.5.2.2 Subway Marker Rendering (State-Driven)

**While** POI display is enabled, the system **shall** render subway entrance markers as distinct landmark icons (differentiated from general POI) with the station name label.

#### R2.5.2.3 Subway Data Enrichment (Where)

**Where** a subway entrance node contains `operator` or `network` tags, the system **shall** include the transit line information in the marker tooltip.

### R2.5.3: Korean Hangul Labels

#### R2.5.3.1 Building Name Labels (State-Driven)

**While** labels are enabled in the UI, the system **shall** render Korean hangul name labels above buildings that have a `name` tag in the OSM data.

#### R2.5.3.2 Label Visibility (State-Driven)

**While** the camera distance to a building exceeds a configurable threshold (default 200 units), the system **shall** hide that building's label to reduce visual clutter and improve performance.

#### R2.5.3.3 Label Rendering (Ubiquitous)

The system **shall** render labels using @react-three/drei `Text` component with a Korean-compatible font (e.g., Noto Sans KR) at a readable size that scales with camera distance.

#### R2.5.3.4 Fallback Label (Where)

**Where** a building has no Korean `name` tag but has a `name:en` tag, the system **shall** display the English name as fallback.

### R2.2.3: Nominatim Geocoding

#### R2.2.3.1 Search Input (Event-Driven)

**When** the user enters an address or place name in the search input and submits, the system **shall** call the Nominatim API to geocode the query, limited to South Korea (`countrycodes=kr`).

#### R2.2.3.2 Search Results (Event-Driven)

**When** geocoding results are returned, the system **shall** display up to 5 results in a dropdown list showing the display name and bounding box availability.

#### R2.2.3.3 Region Load from Search (Event-Driven)

**When** the user selects a geocoding result, the system **shall** compute a bounding box around the result coordinates (using the same 500m x 500m approach as preset regions), fetch OSM data for that area, and render the new city.

#### R2.2.3.4 Rate Limiting (Unwanted)

The system **shall not** send more than 1 Nominatim API request per second to comply with the usage policy.

#### R2.2.3.5 Error Handling (Event-Driven)

**When** the Nominatim API returns an error or no results, the system **shall** display an appropriate message to the user without disrupting the current simulation.

---

## Specifications

### Data Models

#### POI

```typescript
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
  name: string;          // Korean name (from OSM name tag)
  nameEn?: string;       // English name (from name:en tag)
  category: POICategory;
  position: { x: number; y: number };
  osmTags: Record<string, string>;
}
```

#### Nominatim Response

```typescript
export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox: [string, string, string, string]; // [south, north, west, east]
  type: string;
  importance: number;
}
```

#### CityData Extension

```typescript
// Extend existing CityData interface
export interface CityData {
  // ... existing fields (buildings, roadNodes, roadSegments, bounds, center, name)
  pois: POI[];
}
```

### File Structure

#### New Files

| File | Purpose |
| ---- | ------- |
| `src/city/poi-parser.ts` | Extract and classify POI nodes from OSM data |
| `src/city/nominatim.ts` | Nominatim geocoding API client with rate limiting |
| `src/components/scene/POIMarkers.tsx` | 3D POI marker rendering component |
| `src/components/scene/CityLabels.tsx` | Hangul label rendering for buildings and POIs |
| `src/components/ui/SearchInput.tsx` | Geocoding search input with results dropdown |
| `src/types/poi.ts` | POI and Nominatim type definitions |

#### Modified Files

| File | Changes |
| ---- | ------- |
| `src/types/city.ts` | Add `pois: POI[]` field to `CityData` interface |
| `src/city/osm-parser.ts` | Call `parsePOIs()` in `parseOSMResponse()` and include in return |
| `src/city/osm-fetcher.ts` | Add `node["railway"="subway_entrance"]` to Overpass query (verify existing) |
| `src/stores/cityStore.ts` | Add POI data to city state |
| `src/stores/uiStore.ts` | Add `showPOIs` and `showLabels` toggle state |
| `src/components/scene/SimulationScene.tsx` | Include `POIMarkers` and `CityLabels` in scene graph |
| `src/components/ui/ControlPanel.tsx` | Add POI/label toggle controls and search input |

### OSM Tag Mapping for POI Classification

| OSM Tag | Category |
| ------- | -------- |
| `amenity=convenience_store` or `shop=convenience` | convenience_store |
| `amenity=cafe` | cafe |
| `amenity=restaurant` or `amenity=fast_food` | restaurant |
| `amenity=pharmacy` | pharmacy |
| `amenity=bank` or `amenity=atm` | bank |
| `railway=subway_entrance` | subway_entrance |
| All other `amenity` or `shop` values | other |

### Nominatim API Integration

- Endpoint: `https://nominatim.openstreetmap.org/search`
- Parameters: `q={query}&format=json&countrycodes=kr&limit=5&addressdetails=1`
- Headers: `User-Agent: MESAsim/1.0`
- Rate limit: Client-side throttle, minimum 1000ms between requests

### POI Marker Visual Design

| Category | Color | Icon Shape |
| -------- | ----- | ---------- |
| convenience_store | `#FF6B35` (orange) | Circle |
| cafe | `#8B4513` (brown) | Circle |
| restaurant | `#DC143C` (crimson) | Circle |
| pharmacy | `#228B22` (green) | Cross |
| bank | `#4169E1` (blue) | Square |
| subway_entrance | `#FFD700` (gold) | Diamond |
| other | `#808080` (gray) | Circle |

---

## Constraints

1. POI marker count should be capped (configurable, default 200) to maintain rendering performance.
2. Label rendering must use LOD (Level of Detail) based on camera distance to avoid GPU text overhead.
3. Nominatim requests must include a valid User-Agent header per usage policy.
4. No server-side proxy needed for Nominatim (public API, no API key required).
5. Font file for Korean text (Noto Sans KR) must be loaded efficiently (subset or CDN).

---

## Acceptance Criteria

See `acceptance.md` for detailed Given-When-Then scenarios.

### Summary

- AC1: POIs extracted from OSM data and displayed as colored markers in the 3D scene
- AC2: Subway entrances rendered with distinct gold diamond markers and station name
- AC3: Korean hangul labels visible on named buildings with LOD-based visibility
- AC4: Nominatim search finds Korean addresses and loads the corresponding area
- AC5: POI and label toggles in the control panel show/hide markers without data refetch
- AC6: Nominatim rate limiting enforced (max 1 req/sec)
- AC7: Graceful error handling for geocoding failures

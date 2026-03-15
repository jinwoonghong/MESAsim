---
spec_id: SPEC-KOR-001
title: "Korean Urban Features - Implementation Plan"
created: 2026-03-15
updated: 2026-03-15
---

# SPEC-KOR-001: Implementation Plan

## Technical Approach

### Architecture

This SPEC extends the existing city data pipeline with a new POI parsing stage and adds two new 3D scene components plus a geocoding search UI. The changes follow the established layered architecture:

- **Infrastructure**: `poi-parser.ts`, `nominatim.ts` (data extraction and external API)
- **Store**: Extend `cityStore` and `uiStore` with POI state and visibility toggles
- **Presentation**: `POIMarkers.tsx`, `CityLabels.tsx`, `SearchInput.tsx`
- **Types**: `poi.ts` for POI and Nominatim interfaces

### Key Design Decisions

1. **POI as part of CityData**: POIs are parsed alongside buildings and roads in `parseOSMResponse()`, keeping the data pipeline unified.
2. **Billboard markers**: POI markers use drei `Billboard` + simple mesh shapes rather than loaded 3D models, keeping bundle size minimal.
3. **LOD labels**: Korean text labels use distance-based visibility culling to avoid rendering hundreds of text elements.
4. **Client-side rate limiting**: Nominatim throttling is handled with a simple timestamp-based gate, no server proxy needed.
5. **Font loading**: Noto Sans KR loaded from Google Fonts CDN as a static font file for drei `Text` component.

---

## Milestones

### Primary Goal: POI Data Pipeline (R2.5.1.1, R2.5.1.2)

- Create `src/types/poi.ts` with POI and Nominatim type definitions
- Create `src/city/poi-parser.ts` to extract and classify POI nodes from OSM elements
- Extend `CityData` interface in `src/types/city.ts` with `pois` field
- Integrate `parsePOIs()` into `parseOSMResponse()` in `src/city/osm-parser.ts`
- Update `src/stores/cityStore.ts` to include POI data
- Verify Overpass query includes `node["railway"="subway_entrance"]` in `osm-fetcher.ts`

### Secondary Goal: 3D Rendering (R2.5.1.3, R2.5.2.2, R2.5.3)

- Create `src/components/scene/POIMarkers.tsx` with category-colored billboard markers
- Create `src/components/scene/CityLabels.tsx` with distance-based Korean text labels
- Add POI marker rendering for subway entrances with distinct visual style
- Integrate both components into `SimulationScene.tsx`
- Add `showPOIs` and `showLabels` toggles to `src/stores/uiStore.ts`
- Add toggle controls to `ControlPanel.tsx`

### Tertiary Goal: Nominatim Geocoding (R2.2.3)

- Create `src/city/nominatim.ts` with search function and rate limiting
- Create `src/components/ui/SearchInput.tsx` with results dropdown
- Integrate search into `ControlPanel.tsx`
- Implement region loading from search result coordinates
- Add error handling and loading states

### Optional Goal: Polish

- POI count cap configuration
- Font subset optimization for Noto Sans KR
- POI category filtering (show/hide specific categories)
- Keyboard navigation for search results

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
| ---- | ------ | ---------- |
| Korean font rendering performance in WebGL | Label rendering slows frame rate with many buildings | LOD-based visibility culling; cap visible labels |
| OSM data coverage gaps for POIs in some regions | Some regions may have few POI markers | Graceful empty state; user expectation messaging |
| Nominatim rate limit violation | API blocks MESAsim requests | Client-side 1s throttle with queue; debounced input |
| Large POI count in dense areas (Myeongdong, Gangnam) | Rendering bottleneck | Configurable POI cap (default 200); spatial culling |
| drei Text component Korean character support | Missing glyphs or rendering artifacts | Use Noto Sans KR which covers all Korean characters |

---

## Dependencies

- Existing: `src/city/osm-parser.ts`, `src/city/osm-fetcher.ts`, `src/types/city.ts`
- Existing: `src/stores/cityStore.ts`, `src/stores/uiStore.ts`
- Existing: `src/components/scene/SimulationScene.tsx`, `src/components/ui/ControlPanel.tsx`
- External: Nominatim API (no API key, public, rate-limited)
- External: Google Fonts CDN for Noto Sans KR font file
- Package: No new npm dependencies required (drei Text already available)

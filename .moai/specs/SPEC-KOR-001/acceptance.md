---
spec_id: SPEC-KOR-001
title: "Korean Urban Features - Acceptance Criteria"
created: 2026-03-15
updated: 2026-03-15
---

# SPEC-KOR-001: Acceptance Criteria

## AC1: POI Extraction and Display

### AC1.1: POI parsing from OSM data

**Given** the user selects the Gangnam region preset
**When** OSM data is fetched and parsed
**Then** the `CityData.pois` array contains POI entries with valid id, name, category, and position fields

### AC1.2: POI category classification

**Given** OSM data contains a node with `amenity=cafe` tag
**When** the POI parser processes this node
**Then** the resulting POI has `category` set to `"cafe"`

### AC1.3: POI marker rendering

**Given** the city is loaded with POIs and `showPOIs` is enabled
**When** the 3D scene renders
**Then** colored billboard markers appear at POI positions with category-appropriate colors

### AC1.4: POI marker cap

**Given** the OSM data contains more than 200 POI nodes
**When** POIs are parsed
**Then** the result contains at most 200 POIs (configurable limit)

---

## AC2: Subway Entrance Landmarks

### AC2.1: Subway entrance extraction

**Given** OSM data contains nodes with `railway=subway_entrance` tag
**When** the POI parser processes the data
**Then** POIs with category `"subway_entrance"` are created with the station name from the `name` tag

### AC2.2: Subway marker visual distinction

**Given** the scene contains both regular POIs and subway entrances
**When** POI markers are rendered
**Then** subway entrance markers use gold diamond shapes distinct from other POI circle markers

### AC2.3: Transit line information

**Given** a subway entrance node has an `operator` tag (e.g., "Seoul Metro")
**When** the subway POI is created
**Then** the operator information is preserved in `osmTags` for tooltip display

---

## AC3: Korean Hangul Labels

### AC3.1: Building name label display

**Given** a building has a `name` tag containing Korean text (e.g., "롯데타워")
**And** `showLabels` is enabled
**When** the 3D scene renders
**Then** the Korean name appears as a text label above the building

### AC3.2: Label LOD visibility

**Given** the camera is more than 200 units from a labeled building
**When** the scene renders
**Then** that building's label is hidden

**Given** the camera moves within 200 units of the building
**When** the scene updates
**Then** the building's label becomes visible

### AC3.3: English fallback label

**Given** a building has no `name` tag but has `name:en` set to "Lotte Tower"
**And** `showLabels` is enabled
**When** the 3D scene renders
**Then** "Lotte Tower" is displayed as the label

### AC3.4: Korean font rendering

**Given** labels are enabled
**When** hangul text labels render
**Then** all Korean characters display correctly without missing glyphs (using Noto Sans KR)

---

## AC4: Nominatim Geocoding Search

### AC4.1: Search submission

**Given** the user types "부산 해운대" in the search input
**When** the user submits the search
**Then** the system calls the Nominatim API with `q=부산 해운대&countrycodes=kr`

### AC4.2: Search results display

**Given** the Nominatim API returns results
**When** the response is processed
**Then** up to 5 results are shown in a dropdown with display names

### AC4.3: Region loading from search

**Given** search results are displayed
**When** the user clicks a result with coordinates (lat: 35.16, lon: 129.16)
**Then** the system computes a 500m x 500m bounding box around those coordinates
**And** fetches OSM data for the new area
**And** renders the new city replacing the previous one

### AC4.4: Empty results

**Given** the user searches for "xyz12345nonexistent"
**When** the Nominatim API returns zero results
**Then** a "No results found" message is displayed
**And** the current simulation continues unaffected

---

## AC5: UI Toggle Controls

### AC5.1: POI toggle

**Given** POI markers are currently visible
**When** the user toggles the POI visibility control to off
**Then** all POI markers disappear from the 3D scene
**And** no data is re-fetched

### AC5.2: Label toggle

**Given** building labels are currently visible
**When** the user toggles the label visibility control to off
**Then** all text labels disappear from the 3D scene

---

## AC6: Nominatim Rate Limiting

### AC6.1: Throttled requests

**Given** the user submits two search queries in rapid succession (within 500ms)
**When** the second request is made
**Then** the system waits until at least 1000ms has passed since the last request before sending

---

## AC7: Error Handling

### AC7.1: Nominatim API error

**Given** the Nominatim API is unreachable or returns a 500 error
**When** the search request fails
**Then** an error message is displayed to the user
**And** the current city and simulation remain unaffected

### AC7.2: Malformed OSM POI data

**Given** an OSM node has an `amenity` tag but no `lat`/`lon` coordinates
**When** the POI parser processes this node
**Then** the node is skipped without causing a runtime error

---

## Quality Gate Criteria

- All acceptance criteria above pass in automated or manual testing
- No TypeScript compiler errors (`npx tsc --noEmit`)
- No ESLint errors (`npx next lint`)
- POI rendering maintains 30+ FPS with 200 markers on a mid-range GPU
- Korean text renders correctly across Chrome, Firefox, and Edge

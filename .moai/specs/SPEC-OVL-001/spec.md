---
id: SPEC-OVL-001
title: "Information Overlay - Minimap and Conversation Bubbles"
version: 0.1.0
status: draft
created: 2026-03-15
updated: 2026-03-15
author: MoAI
priority: medium
issue_number: 0
parent: SPEC-SIM-001
lifecycle: spec-first
tags: [overlay, minimap, conversation-bubbles, hud, ui]
---

# SPEC-OVL-001: Information Overlay - Minimap and Conversation Bubbles

## 1. Environment

### 1.1 Project Context

MESAsim is a 3D autonomous agent simulation for Korean cities built with Next.js 15 + TypeScript + React Three Fiber 8 + Zustand 5 + Google Gemini API. The simulation renders 3D cityscapes from OpenStreetMap data and populates them with AI-driven agents that navigate, interact, and form memories.

### 1.2 Technical Environment

- **Runtime**: Next.js 15 App Router with Turbopack, React 19, TypeScript 5.7+ strict mode
- **3D Engine**: React Three Fiber 8, Three.js 0.171, @react-three/drei 9
- **State Management**: Zustand 5 with 5 domain stores (simulation, agent, city, ui, settings)
- **Styling**: Tailwind CSS 4 with clsx + tailwind-merge
- **Testing**: Vitest 2 + Testing Library

### 1.3 Current State

- `SimulationScene.tsx` renders the 3D Canvas with CityRenderer, AgentRenderer, Lighting, CameraController, and WeatherEffects
- `ui-store.ts` defines `showMinimap: boolean` and `showBubbles: boolean` flags (default: `true`) with toggle actions and persistence, but no corresponding UI components exist
- `agent-store.ts` manages `agents: Map<string, Agent>` with position data (`{ x, y, z }`)
- Agent interactions generate `GeminiConversation` objects containing `dialogue: { speaker, text }[]`, `summary: string`, and `mood: "positive" | "neutral" | "negative"`
- `CityData` includes `bounds: { minLat, maxLat, minLon, maxLon }`, `buildings: Building[]`, and `roadNodes: RoadNode[]`
- `page.tsx` composes `SimulationScene` (flex-1) and `ControlPanel` (fixed width right) in a flex row layout
- No `src/components/overlay/` directory exists

### 1.4 Parent Requirement

SPEC-SIM-001, Requirement R7.5: Information Overlay system for real-time simulation data visualization.

## 2. Assumptions

- A1: The minimap is rendered as a 2D HTML overlay on top of the 3D Canvas, not inside the R3F scene graph, to avoid GPU overhead from a secondary render target.
- A2: Agent conversation bubbles are rendered using `@react-three/drei`'s `Html` component, positioning them in 3D space above interacting agents while rendering as DOM elements.
- A3: The existing `showMinimap` and `showBubbles` toggles in `ui-store.ts` are the sole control mechanism for overlay visibility.
- A4: City bounds from `cityStore` provide sufficient data to calculate minimap scale and agent dot positions without additional coordinate transformation beyond the existing `math.ts` lat/lng-to-local conversion.
- A5: Active conversations are accessible from the simulation engine or agent store at render time. An event-based approach or a new store slice may be needed to surface active conversation data to the bubble component.

## 3. Requirements

### R7.5.1 - Minimap

#### Ubiquitous Requirements

- REQ-OVL-001: The minimap component shall render as a fixed-position HTML overlay in the bottom-left corner of the viewport.

- REQ-OVL-002: The minimap shall display a simplified 2D representation of the city layout showing building footprints and road segments.

- REQ-OVL-003: The minimap shall display each agent as a colored dot at a position corresponding to the agent's 3D world position.

#### Event-Driven Requirements

- REQ-OVL-004: **When** the user toggles `showMinimap` via the UI control, **then** the minimap component shall show or hide with no impact on 3D rendering performance.

- REQ-OVL-005: **When** a new city region is loaded, **then** the minimap shall recalculate its scale and layout to reflect the new city bounds and building data.

- REQ-OVL-006: **When** an agent's position updates on each simulation tick, **then** the corresponding dot on the minimap shall update its position accordingly.

- REQ-OVL-007: **When** the user clicks an agent dot on the minimap, **then** the system shall select that agent in the agent store (setting `selectedAgentId`).

#### State-Driven Requirements

- REQ-OVL-008: **While** the simulation is paused, the minimap shall continue to display the last known positions of all agents without animation.

- REQ-OVL-009: **While** an agent is in the `interacting` state, its minimap dot shall use a distinct color to differentiate it from idle or moving agents.

#### Unwanted Behavior Requirements

- REQ-OVL-010: The minimap shall not cause a measurable drop (>2 FPS) in the main 3D scene frame rate.

- REQ-OVL-011: The minimap shall not re-render on every animation frame; it shall update at a throttled interval (maximum 4 updates per second).

### R7.5.2 - Agent Conversation Bubbles

#### Ubiquitous Requirements

- REQ-OVL-020: The conversation bubble component shall render conversation text above interacting agents in 3D space using `@react-three/drei` `Html` component.

- REQ-OVL-021: Each conversation bubble shall display the most recent dialogue line with the speaker name.

#### Event-Driven Requirements

- REQ-OVL-022: **When** two agents begin an interaction (state transitions to `interacting`), **then** a conversation bubble shall appear above the midpoint between the two agents.

- REQ-OVL-023: **When** a new dialogue line is generated by the Gemini API, **then** the bubble shall update to show the latest line.

- REQ-OVL-024: **When** agents finish their interaction (state transitions away from `interacting`), **then** the conversation bubble shall fade out and be removed after a brief delay (1-2 seconds).

- REQ-OVL-025: **When** the user toggles `showBubbles` via the UI control, **then** all conversation bubbles shall show or hide.

#### State-Driven Requirements

- REQ-OVL-026: **While** the camera is far from interacting agents (distance > 150 units), conversation bubbles shall hide to reduce visual clutter.

- REQ-OVL-027: **While** multiple conversations are active simultaneously, each conversation shall have its own independent bubble instance.

#### Optional Requirements

- REQ-OVL-030: **Where** possible, the conversation bubble shall display a mood indicator (color or icon) based on the conversation's `mood` field (positive, neutral, negative).

- REQ-OVL-031: **Where** possible, the minimap shall show a camera frustum indicator representing the current viewport direction.

## 4. Specifications

### 4.1 Component Architecture

```
src/components/overlay/
  Minimap.tsx           - 2D HTML canvas minimap overlay component
  AgentBubble.tsx       - 3D-positioned conversation bubble using drei Html
  ConversationOverlay.tsx - Manager component rendering active AgentBubble instances
```

### 4.2 Data Flow

#### Minimap Data Flow

```
cityStore (bounds, buildings, roadNodes)
  --> Minimap.tsx (draws simplified 2D layout on HTML Canvas)

agentStore (agents Map with positions)
  --> Minimap.tsx (draws colored dots, throttled at 250ms interval)

uiStore (showMinimap)
  --> Minimap.tsx (conditional rendering)
```

#### Conversation Bubble Data Flow

```
simulationEngine (active interactions)
  --> new conversationStore or agentStore slice (active conversations)
  --> ConversationOverlay.tsx (iterates active conversations)
  --> AgentBubble.tsx (renders Html at midpoint of two agents)

uiStore (showBubbles)
  --> ConversationOverlay.tsx (conditional rendering)
```

### 4.3 Files to Create

| File | Purpose |
|------|---------|
| `src/components/overlay/Minimap.tsx` | 2D HTML canvas minimap with building outlines and agent dots |
| `src/components/overlay/AgentBubble.tsx` | Single conversation bubble using `@react-three/drei` `Html` |
| `src/components/overlay/ConversationOverlay.tsx` | Manager that tracks active conversations and renders AgentBubble instances |

### 4.4 Files to Modify

| File | Change |
|------|--------|
| `src/app/page.tsx` | Add `<Minimap />` as sibling to `<SimulationScene />` inside the flex-1 container, positioned absolute |
| `src/components/scene/SimulationScene.tsx` | Add `<ConversationOverlay />` inside the R3F Canvas scene graph |
| `src/stores/agent-store.ts` or new `src/stores/conversation-store.ts` | Add active conversation tracking (conversation data, participating agent IDs, timestamps) |

### 4.5 Minimap Technical Design

- **Rendering**: Use an HTML `<canvas>` element (2D context) overlaid on the 3D viewport. The canvas size is fixed (e.g., 200x200 pixels) with a semi-transparent background.
- **Coordinate Mapping**: Map agent 3D world coordinates to minimap 2D coordinates using the city bounds as the reference frame. The `math.ts` lat/lng-to-local conversion defines the world coordinate system; the minimap inverts this to produce a normalized [0,1] range for each axis.
- **Throttling**: Use `requestAnimationFrame` with a timestamp check or `setInterval` at 250ms to limit minimap redraws.
- **Agent Dots**: Differentiate agent states by color (e.g., blue for moving, green for idle, orange for interacting, gray for sleeping).
- **Interactivity**: Attach click handlers to the canvas, performing hit-testing against agent dot positions to enable agent selection.

### 4.6 Conversation Bubble Technical Design

- **3D Positioning**: Use `@react-three/drei` `Html` component with `position` set to the midpoint between two interacting agents at `y + offset` (above agent heads).
- **Occlusion**: Set `Html` `occlude` prop to allow bubbles to be hidden behind buildings when not in line of sight.
- **Distance Culling**: Calculate distance from camera to bubble position each frame; hide when distance exceeds threshold (150 units).
- **Lifecycle**: Track active conversations via a store slice. Add conversation on interaction start; remove after interaction ends + fade delay.
- **Styling**: Tailwind CSS for bubble styling with rounded corners, semi-transparent background, and a small tail/arrow pointing down.

### 4.7 Performance Considerations

- The minimap uses a 2D canvas outside the R3F render pipeline, ensuring zero impact on WebGL draw calls.
- Agent dot updates are throttled to 4 Hz (250ms intervals) to avoid unnecessary DOM/canvas repaints.
- Conversation bubbles use `Html` from drei which renders as DOM elements overlaid on WebGL; they do not add to the Three.js scene graph complexity.
- Distance culling for bubbles prevents rendering of off-screen or distant conversations.
- The minimap canvas should be drawn once for the static city layout (buildings/roads) and only redraw the agent layer on each throttled update.

## 5. Traceability

| Requirement | Parent | Component | Test |
|-------------|--------|-----------|------|
| REQ-OVL-001 | R7.5.1 | Minimap.tsx | TC-OVL-001 |
| REQ-OVL-002 | R7.5.1 | Minimap.tsx | TC-OVL-002 |
| REQ-OVL-003 | R7.5.1 | Minimap.tsx | TC-OVL-003 |
| REQ-OVL-004 | R7.5.1 | Minimap.tsx, ui-store.ts | TC-OVL-004 |
| REQ-OVL-005 | R7.5.1 | Minimap.tsx, cityStore | TC-OVL-005 |
| REQ-OVL-006 | R7.5.1 | Minimap.tsx, agentStore | TC-OVL-006 |
| REQ-OVL-007 | R7.5.1 | Minimap.tsx, agentStore | TC-OVL-007 |
| REQ-OVL-008 | R7.5.1 | Minimap.tsx | TC-OVL-008 |
| REQ-OVL-009 | R7.5.1 | Minimap.tsx | TC-OVL-009 |
| REQ-OVL-010 | R7.5.1 | Minimap.tsx | TC-OVL-010 |
| REQ-OVL-011 | R7.5.1 | Minimap.tsx | TC-OVL-011 |
| REQ-OVL-020 | R7.5.2 | AgentBubble.tsx | TC-OVL-020 |
| REQ-OVL-021 | R7.5.2 | AgentBubble.tsx | TC-OVL-021 |
| REQ-OVL-022 | R7.5.2 | ConversationOverlay.tsx | TC-OVL-022 |
| REQ-OVL-023 | R7.5.2 | AgentBubble.tsx | TC-OVL-023 |
| REQ-OVL-024 | R7.5.2 | ConversationOverlay.tsx | TC-OVL-024 |
| REQ-OVL-025 | R7.5.2 | ConversationOverlay.tsx, ui-store.ts | TC-OVL-025 |
| REQ-OVL-026 | R7.5.2 | AgentBubble.tsx | TC-OVL-026 |
| REQ-OVL-027 | R7.5.2 | ConversationOverlay.tsx | TC-OVL-027 |
| REQ-OVL-030 | R7.5.2 | AgentBubble.tsx | TC-OVL-030 |
| REQ-OVL-031 | R7.5.1 | Minimap.tsx | TC-OVL-031 |

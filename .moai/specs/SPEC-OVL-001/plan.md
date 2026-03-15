---
id: SPEC-OVL-001
title: "Information Overlay - Implementation Plan"
version: 0.1.0
status: draft
created: 2026-03-15
updated: 2026-03-15
tags: [overlay, minimap, conversation-bubbles, hud, ui]
---

# SPEC-OVL-001: Implementation Plan

## 1. Overview

Implement the Information Overlay system consisting of two sub-features: a 2D minimap overlay and 3D-positioned conversation bubbles. Both features leverage existing Zustand store toggles (`showMinimap`, `showBubbles`) that are already defined but have no backing components.

## 2. Milestones

### Milestone 1: Conversation Data Infrastructure (Priority: High)

**Goal**: Surface active conversation data so overlay components can consume it.

**Tasks**:
- Create `src/stores/conversation-store.ts` (or extend `agent-store.ts`) with:
  - `activeConversations: Map<string, ActiveConversation>` tracking conversation ID, participating agent IDs, dialogue lines, mood, and timestamps
  - Actions: `startConversation`, `addDialogueLine`, `endConversation`
- Integrate with `simulation/engine.ts` to dispatch conversation events when agents begin/end interactions
- Wire up Gemini conversation responses to push dialogue lines into the store

**Files to create**:
- `src/stores/conversation-store.ts`

**Files to modify**:
- `src/simulation/engine.ts` (dispatch conversation start/end events)

**Dependencies**: None (foundational)

---

### Milestone 2: Minimap Component (Priority: High)

**Goal**: Render a 2D minimap showing city layout and agent positions.

**Tasks**:
- Create `src/components/overlay/Minimap.tsx`:
  - HTML `<canvas>` element with fixed size (200x200px), positioned absolute bottom-left
  - Draw building footprints as simplified rectangles from `cityStore`
  - Draw road segments as thin lines
  - Draw agent dots with state-based colors, throttled at 250ms
  - Implement click-to-select hit testing
- Integrate into `src/app/page.tsx` as an overlay inside the viewport container
- Connect to `uiStore.showMinimap` for visibility toggle

**Files to create**:
- `src/components/overlay/Minimap.tsx`

**Files to modify**:
- `src/app/page.tsx` (add Minimap overlay)

**Dependencies**: cityStore, agentStore, uiStore (all existing)

---

### Milestone 3: Conversation Bubbles (Priority: High)

**Goal**: Display conversation text above interacting agents in 3D space.

**Tasks**:
- Create `src/components/overlay/AgentBubble.tsx`:
  - Use `@react-three/drei` `Html` component for 3D-positioned DOM rendering
  - Display latest dialogue line with speaker name
  - Implement distance-based culling (hide when camera > 150 units away)
  - Style with Tailwind CSS (rounded, semi-transparent, mood-colored border)
  - Fade-out animation on conversation end
- Create `src/components/overlay/ConversationOverlay.tsx`:
  - Subscribe to conversation store for active conversations
  - Render one `AgentBubble` per active conversation
  - Position each bubble at the midpoint between the two agents
  - Respect `uiStore.showBubbles` toggle
- Add `ConversationOverlay` to `SimulationScene.tsx` inside the Canvas

**Files to create**:
- `src/components/overlay/AgentBubble.tsx`
- `src/components/overlay/ConversationOverlay.tsx`

**Files to modify**:
- `src/components/scene/SimulationScene.tsx` (add ConversationOverlay to scene graph)

**Dependencies**: Milestone 1 (conversation store)

---

### Milestone 4: Polish and Performance (Priority: Medium)

**Goal**: Optimize performance and add optional enhancements.

**Tasks**:
- Implement static city layer caching in minimap (draw buildings/roads once, only redraw agent dots)
- Add camera frustum indicator to minimap (REQ-OVL-031, optional)
- Add mood indicator to conversation bubbles (REQ-OVL-030, optional)
- Performance testing: verify minimap does not drop FPS by more than 2
- Add `Html occlude` prop configuration for conversation bubbles

**Files to modify**:
- `src/components/overlay/Minimap.tsx` (caching, frustum)
- `src/components/overlay/AgentBubble.tsx` (mood indicator, occlusion)

**Dependencies**: Milestones 2, 3

## 3. Technical Approach

### Minimap Strategy

The minimap is a pure HTML/Canvas overlay outside the R3F render pipeline. This architectural choice avoids:
- Secondary WebGL render targets (expensive)
- Additional Three.js scene objects
- Frame-rate coupling with the 3D render loop

The canvas draws two layers:
1. **Static layer**: Building outlines and roads, redrawn only on city change
2. **Dynamic layer**: Agent dots, redrawn at 4 Hz via throttled `requestAnimationFrame`

Coordinate mapping uses the city bounds to normalize agent world positions to canvas pixel coordinates.

### Conversation Bubble Strategy

Bubbles use `@react-three/drei`'s `Html` component which renders React DOM elements positioned in 3D space. This provides:
- Crisp text rendering (not 3D text meshes)
- Full CSS styling via Tailwind
- Automatic projection from world to screen coordinates
- Occlusion support via the `occlude` prop

Conversation lifecycle is managed by a dedicated store that tracks active conversations from start to end, with a brief fade-out delay after interaction completion.

## 4. Architecture Design Direction

### Component Hierarchy

```
page.tsx
  |-- SimulationScene (flex-1, relative)
  |     |-- Canvas (R3F)
  |     |     |-- SceneContent
  |     |     |     |-- Lighting, CameraController, CityRenderer, AgentRenderer, WeatherEffects
  |     |     |     |-- ConversationOverlay  <-- NEW (inside Canvas)
  |-- Minimap  <-- NEW (absolute overlay, outside Canvas)
  |-- ControlPanel (fixed width)
```

### Store Architecture

```
conversation-store.ts (NEW)
  |-- activeConversations: Map<string, ActiveConversation>
  |-- startConversation(id, agentIds, topic)
  |-- addDialogueLine(id, speaker, text)
  |-- endConversation(id)
  |-- cleanupExpired()
```

### Type Additions

```typescript
interface ActiveConversation {
  id: string;
  agentIds: [string, string];
  dialogue: { speaker: string; text: string }[];
  summary: string;
  mood: "positive" | "neutral" | "negative";
  startedAt: number;
  endedAt: number | null;
}
```

## 5. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Minimap canvas redraws cause jank | Low | Medium | Throttle to 4 Hz; separate static/dynamic layers |
| Too many simultaneous conversation bubbles | Low | Low | Distance culling; limit visible bubbles to nearest N |
| Html component occlusion not working with custom shaders | Medium | Low | Fall back to distance-based visibility if occlusion fails |
| Conversation data not surfaced from engine | Medium | High | Create dedicated conversation store with clear API contract |
| Click-to-select on minimap misaligns with agent positions | Medium | Medium | Unit test coordinate mapping; use tolerance radius for hit testing |

## 6. Expert Consultation Recommendations

This SPEC involves frontend UI components and 3D rendering integration. Consider consulting:

- **expert-frontend**: For React Three Fiber `Html` component patterns, performance optimization of DOM overlays in 3D scenes, and Tailwind CSS styling for overlay components
- **expert-performance**: For verifying minimap canvas rendering does not impact WebGL frame rate

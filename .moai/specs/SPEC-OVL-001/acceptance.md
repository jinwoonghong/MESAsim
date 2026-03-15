---
id: SPEC-OVL-001
title: "Information Overlay - Acceptance Criteria"
version: 0.1.0
status: draft
created: 2026-03-15
updated: 2026-03-15
tags: [overlay, minimap, conversation-bubbles, hud, ui]
---

# SPEC-OVL-001: Acceptance Criteria

## 1. Minimap Acceptance Criteria

### TC-OVL-001: Minimap renders as fixed overlay

**Given** the simulation is running with a city loaded
**When** the page renders
**Then** a minimap canvas element is visible in the bottom-left corner of the viewport with fixed positioning and a semi-transparent background

---

### TC-OVL-002: Minimap displays city layout

**Given** a city region is loaded with buildings and road segments
**When** the minimap renders
**Then** building footprints are drawn as filled rectangles and road segments are drawn as lines on the minimap canvas

---

### TC-OVL-003: Minimap displays agent dots

**Given** 5 agents exist in the simulation with known positions
**When** the minimap renders
**Then** 5 colored dots appear on the minimap at positions corresponding to each agent's world position relative to the city bounds

---

### TC-OVL-004: Minimap toggle visibility

**Given** the minimap is currently visible
**When** the user calls `toggleMinimap()` via the UI store
**Then** the minimap component unmounts or hides
**And** the 3D scene frame rate does not change measurably

**Given** the minimap is currently hidden
**When** the user calls `toggleMinimap()` again
**Then** the minimap component reappears with correct city layout and agent positions

---

### TC-OVL-005: Minimap recalculates on city change

**Given** the user is viewing city region A on the minimap
**When** a new city region B is loaded (different bounds and buildings)
**Then** the minimap clears and redraws with region B's building footprints, road segments, and updated agent positions

---

### TC-OVL-006: Agent dot position updates

**Given** an agent is at position (10, 0, 20) in world space
**When** the agent moves to position (50, 0, 80) on the next simulation tick
**Then** within 250ms, the agent's dot on the minimap moves to the corresponding new position

---

### TC-OVL-007: Click to select agent on minimap

**Given** the minimap is visible with agent dots displayed
**When** the user clicks on an agent dot on the minimap
**Then** `agentStore.selectedAgentId` is set to the clicked agent's ID

---

### TC-OVL-008: Minimap during paused simulation

**Given** the simulation is paused with agents at known positions
**When** the minimap renders
**Then** all agent dots are displayed at their last known positions without animation or movement

---

### TC-OVL-009: Interacting agent dot color

**Given** agent A is in the `interacting` state
**And** agent B is in the `moving` state
**When** the minimap renders
**Then** agent A's dot is displayed in the interacting color (orange)
**And** agent B's dot is displayed in the moving color (blue)

---

### TC-OVL-010: Minimap FPS impact

**Given** the 3D scene is rendering at a baseline FPS
**When** the minimap is enabled and rendering with 20+ agents
**Then** the FPS drop compared to the baseline is no more than 2 FPS

---

### TC-OVL-011: Minimap update throttling

**Given** the simulation is running with agents moving every frame
**When** observing minimap canvas redraws over a 1-second period
**Then** the agent dot layer redraws at most 4 times (250ms throttle interval)

---

## 2. Conversation Bubble Acceptance Criteria

### TC-OVL-020: Bubble renders in 3D space

**Given** two agents are interacting with an active conversation
**When** the conversation bubble renders
**Then** a styled DOM element appears positioned above the agents in 3D space using drei Html component

---

### TC-OVL-021: Bubble displays dialogue

**Given** an active conversation has the latest dialogue line: speaker "Kim" text "Hello there"
**When** the bubble renders
**Then** the bubble displays "Kim: Hello there" (or equivalent formatted output)

---

### TC-OVL-022: Bubble appears on interaction start

**Given** agent A and agent B are not interacting
**When** both agents transition to `interacting` state and a conversation starts
**Then** a conversation bubble appears at the midpoint between the two agents' positions

---

### TC-OVL-023: Bubble updates with new dialogue

**Given** a conversation bubble is showing "Kim: Hello"
**When** a new dialogue line "Lee: Hi Kim!" is added via the Gemini API response
**Then** the bubble updates to display the new line "Lee: Hi Kim!"

---

### TC-OVL-024: Bubble fades out after interaction ends

**Given** a conversation bubble is active between two agents
**When** the agents finish their interaction (state transitions away from `interacting`)
**Then** the bubble fades out over 1-2 seconds and is then removed from the scene

---

### TC-OVL-025: Bubble toggle visibility

**Given** conversation bubbles are currently visible
**When** the user calls `toggleBubbles()` via the UI store
**Then** all conversation bubbles hide

**Given** conversation bubbles are currently hidden
**When** the user calls `toggleBubbles()` again
**Then** all active conversation bubbles reappear

---

### TC-OVL-026: Distance-based bubble culling

**Given** two agents are interacting with a visible conversation bubble
**When** the camera moves to a distance greater than 150 units from the interacting agents
**Then** the conversation bubble is hidden

**When** the camera moves back within 150 units
**Then** the conversation bubble reappears

---

### TC-OVL-027: Multiple simultaneous conversations

**Given** agents A-B are having conversation 1 and agents C-D are having conversation 2
**When** the scene renders
**Then** two independent conversation bubbles are displayed, each at the correct midpoint for their respective agent pair

---

### TC-OVL-030: Mood indicator (optional)

**Given** a conversation has mood "positive"
**When** the bubble renders
**Then** the bubble displays a visual mood indicator (colored border or icon) reflecting the positive mood

---

### TC-OVL-031: Camera frustum indicator (optional)

**Given** the minimap is visible
**When** the camera is pointing in a specific direction
**Then** the minimap shows a frustum or cone indicator representing the current camera viewing direction and field of view

---

## 3. Quality Gate Criteria

### Definition of Done

- [ ] All TC-OVL-001 through TC-OVL-011 (minimap) pass
- [ ] All TC-OVL-020 through TC-OVL-027 (bubbles) pass
- [ ] TypeScript strict mode: zero type errors
- [ ] ESLint: zero errors
- [ ] Vitest unit tests for coordinate mapping logic
- [ ] Vitest unit tests for conversation store actions
- [ ] Component tests for Minimap rendering with mock store data
- [ ] Component tests for AgentBubble rendering with mock conversation data
- [ ] Manual verification: minimap does not cause visible FPS drop
- [ ] Optional items (TC-OVL-030, TC-OVL-031) are documented as deferred if not implemented

### Verification Methods

| Method | Scope |
|--------|-------|
| Unit test (Vitest) | Coordinate mapping, store actions, throttle logic |
| Component test (Testing Library) | Minimap rendering, bubble rendering, toggle behavior |
| Manual testing | FPS impact, visual appearance, click-to-select accuracy |
| Performance profiling | Chrome DevTools Performance tab for FPS measurement |

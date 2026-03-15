---
id: SPEC-UI-001
title: "Control Panel UI Extension - Camera, Weather, Vehicle, System Tabs"
version: 0.1.0
status: draft
created: 2026-03-15
updated: 2026-03-15
author: MoAI
priority: high
issue_number: 0
parent: SPEC-SIM-001
lifecycle: spec-first
tags: [ui, control-panel, tabs, react, zustand]
---

# SPEC-UI-001: Control Panel UI Extension

## HISTORY

| Version | Date       | Author | Description                          |
|---------|------------|--------|--------------------------------------|
| 0.1.0   | 2026-03-15 | MoAI   | Initial draft - 4 new tabs for Control Panel |

---

## 1. Environment

### 1.1 Technology Stack

- **Framework**: Next.js 15 + React 19 + TypeScript 5.x (strict mode)
- **3D Engine**: React Three Fiber
- **State Management**: Zustand 5
- **Styling**: Tailwind CSS 4
- **Camera Controls**: @react-three/drei OrbitControls

### 1.2 Existing Components

| File | Description |
|------|-------------|
| `src/components/ui/ControlPanel.tsx` | Tab container, `TabId` type: `"agents" \| "city" \| "settings"` |
| `src/components/ui/SimulationTab.tsx` | Region selection, play/pause/speed, status display |
| `src/components/ui/AgentTab.tsx` | Agent list with selection and detail view |
| `src/components/ui/ApiSettingsTab.tsx` | Gemini API key configuration |
| `src/stores/ui-store.ts` | `ActiveTab` type: `"agents" \| "city" \| "settings" \| "logs"` |
| `src/stores/simulation-store.ts` | Weather state, setWeather, time, config (weatherEnabled, vehiclesEnabled, dayDurationMs) |
| `src/types/simulation.ts` | `WeatherState`, `Vehicle` interface, `SimulationConfig` |
| `src/components/scene/CameraController.tsx` | OrbitControls with agent follow mode |
| `src/components/scene/Lighting.tsx` | Day/night cycle with dawn/day/dusk/night configs |

### 1.3 Parent SPEC Reference

SPEC-SIM-001 R7 defines 7 tabs for the Control Panel. Currently 3 tabs are implemented (API Settings, Simulation, Agents). This SPEC covers the remaining 4 tabs: Camera, Weather, Vehicles, System.

---

## 2. Assumptions

- **A1**: `simulation-store.ts`의 weather state 및 config 필드가 이미 존재하며, tab UI에서 직접 연동 가능하다.
- **A2**: `CameraController.tsx`의 OrbitControls 설정값(minDistance, maxDistance, dampingFactor)이 외부에서 변경 가능하도록 store를 통해 노출될 수 있다.
- **A3**: Vehicle 시스템(SPEC-SIM-001 R5)은 아직 구현되지 않았으므로, Vehicle Tab은 UI만 구성하고 실제 기능은 pending 상태로 둔다.
- **A4**: 모든 panel 설정은 `localStorage`를 통해 영속화되어야 한다 (SPEC-SIM-001 R7.1.2).
- **A5**: System Tab의 FPS, memory 등 성능 지표는 browser API (`performance.memory`, `requestAnimationFrame` 기반 FPS 계산)로 수집한다.
- **A6**: 기존 `TabId` / `ActiveTab` type을 확장해야 하며, 이는 `ControlPanel.tsx`와 `ui-store.ts` 양쪽 모두 수정이 필요하다.

---

## 3. Requirements

### R1: Camera Tab

#### R1.1 Camera View Presets (Event-Driven)

**WHEN** 사용자가 Camera Tab에서 view preset 버튼(top-down, isometric, street-level)을 클릭 **THEN** 시스템은 해당 preset에 맞는 camera position과 rotation을 OrbitControls에 적용해야 한다.

| Preset | Description |
|--------|-------------|
| top-down | 수직 하향 시점, pitch 90도 |
| isometric | 45도 각도의 등축 시점 |
| street-level | 지면 근접 시점, 낮은 elevation |

#### R1.2 Follow Agent Toggle (Event-Driven)

**WHEN** 사용자가 "Follow Agent" toggle을 활성화하고 agent가 선택된 상태 **THEN** camera는 선택된 agent를 자동으로 추적해야 한다.

**WHEN** 사용자가 "Follow Agent" toggle을 비활성화 **THEN** camera는 현재 위치에서 고정되어야 한다.

#### R1.3 Orbit Controls Adjustment (Event-Driven)

**WHEN** 사용자가 orbit speed slider를 조정 **THEN** OrbitControls의 rotateSpeed가 해당 값으로 업데이트되어야 한다.

**WHEN** 사용자가 damping slider를 조정 **THEN** OrbitControls의 dampingFactor가 해당 값으로 업데이트되어야 한다.

#### R1.4 FOV Adjustment (Event-Driven)

**WHEN** 사용자가 FOV slider를 조정 **THEN** PerspectiveCamera의 fov 값이 업데이트되고 projection matrix가 재계산되어야 한다.

허용 범위: 30도 ~ 120도, 기본값: 75도

#### R1.5 Zoom Range (Event-Driven)

**WHEN** 사용자가 min/max zoom slider를 조정 **THEN** OrbitControls의 minDistance/maxDistance가 업데이트되어야 한다.

#### R1.6 Camera Settings Persistence (Ubiquitous)

시스템은 **항상** Camera Tab의 모든 설정값을 `localStorage`에 저장하고, 페이지 로드 시 복원해야 한다.

---

### R2: Weather Tab

#### R2.1 Manual Weather Selection (Event-Driven)

**WHEN** 사용자가 weather type 버튼(clear, cloudy, rainy, stormy)을 선택 **THEN** `simulation-store`의 `weather` state가 해당 값으로 변경되어야 한다.

#### R2.2 Auto-Weather Toggle (Event-Driven)

**WHEN** 사용자가 "Auto Weather" toggle을 활성화 **THEN** 시스템은 설정된 transition probability에 따라 자동으로 날씨를 전환해야 한다.

**WHEN** "Auto Weather"가 활성화된 상태에서 manual weather 버튼을 클릭 **THEN** auto weather가 자동으로 비활성화되어야 한다.

#### R2.3 Day Duration Control (Event-Driven)

**WHEN** 사용자가 day duration slider를 조정 **THEN** `SimulationConfig.dayDurationMs` 값이 업데이트되어 day/night cycle 속도가 변경되어야 한다.

허용 범위: 30초 ~ 600초, 기본값: 120초

#### R2.4 Weather Effects Toggle (Event-Driven)

**WHEN** 사용자가 "Weather Effects" toggle을 비활성화 **THEN** 날씨 상태는 유지되지만 시각적 효과(비, 구름, 번개 등)는 렌더링하지 않아야 한다.

#### R2.5 Weather Settings Persistence (Ubiquitous)

시스템은 **항상** Weather Tab의 모든 설정값을 `localStorage`에 저장하고, 페이지 로드 시 복원해야 한다.

#### R2.6 Simulation Not Running Guard (State-Driven)

**IF** simulation이 실행 중이지 않은 상태 **THEN** weather 변경 컨트롤은 비활성화 상태(disabled)로 표시되어야 하며, "Simulation을 시작해주세요" 안내 메시지를 표시해야 한다.

---

### R3: Vehicle Tab

#### R3.1 Vehicle Enable/Disable (Event-Driven)

**WHEN** 사용자가 "Enable Vehicles" toggle을 변경 **THEN** `SimulationConfig.vehiclesEnabled` 값이 업데이트되어야 한다.

#### R3.2 Max Vehicle Count (Event-Driven)

**WHEN** 사용자가 max vehicle count slider를 조정 **THEN** simulation에서 허용되는 최대 vehicle 수가 변경되어야 한다.

허용 범위: 0 ~ 50, 기본값: 10

#### R3.3 Vehicle Type Toggles (Event-Driven)

**WHEN** 사용자가 vehicle type toggle(car, bus, taxi)을 변경 **THEN** 해당 vehicle type의 spawn 활성화/비활성화가 적용되어야 한다.

#### R3.4 Spawn Rate Control (Event-Driven)

**WHEN** 사용자가 spawn rate slider를 조정 **THEN** 새로운 vehicle이 생성되는 빈도(초 단위)가 변경되어야 한다.

허용 범위: 1초 ~ 30초, 기본값: 5초

#### R3.5 Vehicle System Pending Notice (State-Driven)

**IF** vehicle 시스템이 아직 구현되지 않은 상태 **THEN** Vehicle Tab 상단에 "Vehicle 시스템은 현재 개발 중입니다. 설정값은 저장되며 구현 완료 후 적용됩니다." 안내 메시지를 표시해야 한다.

#### R3.6 Vehicle Settings Persistence (Ubiquitous)

시스템은 **항상** Vehicle Tab의 모든 설정값을 `localStorage`에 저장하고, 페이지 로드 시 복원해야 한다.

#### R3.7 Empty State Display (State-Driven)

**IF** vehiclesEnabled가 true이지만 현재 활성 vehicle이 0개인 상태 **THEN** "현재 활성 vehicle이 없습니다" 메시지를 표시해야 한다.

---

### R4: System Tab

#### R4.1 FPS Counter (Ubiquitous)

시스템은 **항상** 현재 FPS(frames per second)를 실시간으로 System Tab에 표시해야 한다. 업데이트 주기: 500ms

#### R4.2 Agent Count Display (Ubiquitous)

시스템은 **항상** 현재 활성 agent 수를 System Tab에 표시해야 한다.

#### R4.3 Memory Usage Estimate (Ubiquitous)

시스템은 **항상** 추정 memory 사용량을 System Tab에 표시해야 한다.

> Note: `performance.memory`는 Chrome 전용 API이므로, 지원하지 않는 브라우저에서는 "N/A"를 표시한다.

#### R4.4 Debug Overlay Toggle (Event-Driven)

**WHEN** 사용자가 "Debug Overlay" toggle을 활성화 **THEN** 3D scene 위에 debug 정보(wireframe, bounding box, axis helper 등)를 오버레이해야 한다.

#### R4.5 Simulation Tick Info (Ubiquitous)

시스템은 **항상** 현재 simulation tick 번호와 경과 시간을 System Tab에 표시해야 한다.

#### R4.6 Reset All Settings (Event-Driven)

**WHEN** 사용자가 "Reset All Settings" 버튼을 클릭 **THEN** 모든 tab의 설정값을 기본값으로 초기화하고, `localStorage`를 clear해야 한다.

시스템은 reset 실행 전에 확인 dialog를 표시**해야 한다**.

#### R4.7 System Settings Persistence (Ubiquitous)

시스템은 **항상** System Tab의 설정값(debug overlay 상태 등)을 `localStorage`에 저장하고, 페이지 로드 시 복원해야 한다.

#### R4.8 Memory API Unavailable Guard (Unwanted)

시스템은 `performance.memory` API를 지원하지 않는 브라우저에서 에러를 발생시키**지 않아야 한다**. 대신 "N/A" 또는 "Unsupported" 메시지를 표시해야 한다.

---

## 4. Specifications

### 4.1 ControlPanel.tsx Modifications

현재 `TabId` type을 다음과 같이 확장해야 한다:

```
// Before
type TabId = "agents" | "city" | "settings"

// After
type TabId = "settings" | "city" | "agents" | "camera" | "weather" | "vehicles" | "system"
```

Tab 렌더링 순서: API Settings > Simulation > Agents > Camera > Weather > Vehicles > System

각 새 tab에 대한 conditional rendering을 추가해야 한다.

### 4.2 ui-store.ts Modifications

`ActiveTab` type을 `TabId`와 일치하도록 확장해야 한다:

```
// Before
type ActiveTab = "agents" | "city" | "settings" | "logs"

// After
type ActiveTab = "settings" | "city" | "agents" | "camera" | "weather" | "vehicles" | "system" | "logs"
```

### 4.3 New Store Fields

Camera 관련 상태를 위해 `ui-store.ts` 또는 별도 `camera-store.ts`에 다음 필드를 추가:

- `cameraPreset`: `"top-down" | "isometric" | "street-level" | "custom"`
- `followAgent`: `boolean`
- `orbitSpeed`: `number` (0.1 ~ 2.0)
- `dampingFactor`: `number` (0.01 ~ 0.5)
- `fov`: `number` (30 ~ 120)
- `minZoom`: `number`
- `maxZoom`: `number`

Vehicle 설정을 위해 `simulation-store.ts`에 다음 필드를 추가:

- `maxVehicleCount`: `number`
- `vehicleTypes`: `{ car: boolean; bus: boolean; taxi: boolean }`
- `spawnRate`: `number` (seconds)

System 설정:

- `debugOverlay`: `boolean`

### 4.4 localStorage Persistence Strategy

Zustand의 `persist` middleware를 활용하여 각 store의 설정값을 자동 영속화한다.

```
// Pattern
persist(stateCreator, {
  name: "mesasim-{store-name}",
  partialize: (state) => ({ /* 영속화할 필드만 선택 */ })
})
```

### 4.5 New Files

| File | Purpose |
|------|---------|
| `src/components/ui/CameraTab.tsx` | Camera controls UI |
| `src/components/ui/WeatherTab.tsx` | Weather controls UI |
| `src/components/ui/VehicleTab.tsx` | Vehicle controls UI |
| `src/components/ui/SystemTab.tsx` | System info and debug controls |

### 4.6 Traceability

| Requirement | SPEC-SIM-001 Ref | Tab | Priority |
|-------------|-------------------|-----|----------|
| R1.* | R7.1.1 (Camera) | Camera | High |
| R2.* | R7.1.1 (Weather) | Weather | High |
| R3.* | R7.1.1 (Vehicles) | Vehicles | Medium |
| R4.* | R7.1.1 (System) | System | High |
| R*.6 (Persistence) | R7.1.2 | All | High |

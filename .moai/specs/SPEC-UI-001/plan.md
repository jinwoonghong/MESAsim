---
id: SPEC-UI-001
type: plan
parent_spec: SPEC-UI-001/spec.md
---

# SPEC-UI-001: Implementation Plan

## Overview

Control Panel UI를 3-tab 구성에서 7-tab 구성으로 확장한다. 4개의 신규 tab 컴포넌트를 생성하고, 기존 `ControlPanel.tsx` 및 `ui-store.ts`를 수정한다.

---

## Milestone: Control Panel Tab Extension

**Priority**: High
**Goal**: SPEC-SIM-001 R7.1.1 요구사항 완료 (7 tabs)

### Task Decomposition

#### Phase 1: Store & Type Updates

| # | Task | File | Action |
|---|------|------|--------|
| 1.1 | `TabId` type 확장 | `src/components/ui/ControlPanel.tsx` | Modify |
| 1.2 | `ActiveTab` type 확장 | `src/stores/ui-store.ts` | Modify |
| 1.3 | Camera state 필드 추가 | `src/stores/ui-store.ts` or new `camera-store.ts` | Modify/Create |
| 1.4 | Vehicle config 필드 추가 | `src/stores/simulation-store.ts` | Modify |
| 1.5 | System debug 필드 추가 | `src/stores/ui-store.ts` | Modify |
| 1.6 | Zustand persist middleware 적용 | 해당 stores | Modify |

#### Phase 2: New Tab Components

| # | Task | File | Action |
|---|------|------|--------|
| 2.1 | CameraTab 컴포넌트 생성 | `src/components/ui/CameraTab.tsx` | Create |
| 2.2 | WeatherTab 컴포넌트 생성 | `src/components/ui/WeatherTab.tsx` | Create |
| 2.3 | VehicleTab 컴포넌트 생성 | `src/components/ui/VehicleTab.tsx` | Create |
| 2.4 | SystemTab 컴포넌트 생성 | `src/components/ui/SystemTab.tsx` | Create |

#### Phase 3: Integration

| # | Task | File | Action |
|---|------|------|--------|
| 3.1 | ControlPanel에 새 tab 렌더링 추가 | `src/components/ui/ControlPanel.tsx` | Modify |
| 3.2 | Tab 순서 정리 (7 tabs) | `src/components/ui/ControlPanel.tsx` | Modify |
| 3.3 | CameraController와 camera store 연동 | `src/components/scene/CameraController.tsx` | Modify |

---

## File Creation List

| File | Description | Dependencies |
|------|-------------|--------------|
| `src/components/ui/CameraTab.tsx` | Camera view presets, follow toggle, orbit/FOV/zoom controls | ui-store or camera-store |
| `src/components/ui/WeatherTab.tsx` | Weather selection, auto-weather, day duration, effects toggle | simulation-store |
| `src/components/ui/VehicleTab.tsx` | Vehicle enable, count, types, spawn rate controls | simulation-store |
| `src/components/ui/SystemTab.tsx` | FPS, agent count, memory, debug overlay, tick info, reset | ui-store, simulation-store |

## File Modification List

| File | Changes |
|------|---------|
| `src/components/ui/ControlPanel.tsx` | `TabId` type 확장, 4개 tab import 및 conditional rendering 추가 |
| `src/stores/ui-store.ts` | `ActiveTab` type 확장, camera/debug 상태 추가, persist 설정 |
| `src/stores/simulation-store.ts` | Vehicle config 필드(maxVehicleCount, vehicleTypes, spawnRate) 추가, persist 설정 |
| `src/components/scene/CameraController.tsx` | Camera store 값 읽어 OrbitControls props에 반영 |

---

## Technical Approach

### State Architecture

```
ui-store.ts
  - activeTab: ActiveTab (확장)
  - cameraPreset: string
  - followAgent: boolean
  - orbitSpeed: number
  - dampingFactor: number
  - fov: number
  - minZoom / maxZoom: number
  - debugOverlay: boolean

simulation-store.ts
  - weather: WeatherState (기존)
  - weatherEnabled: boolean (기존)
  - vehiclesEnabled: boolean (기존)
  - dayDurationMs: number (기존)
  - maxVehicleCount: number (신규)
  - vehicleTypes: { car: boolean; bus: boolean; taxi: boolean } (신규)
  - spawnRate: number (신규)
  - autoWeather: boolean (신규)
  - weatherEffectsEnabled: boolean (신규)
```

### Persistence Strategy

Zustand `persist` middleware를 사용하여 `localStorage`에 자동 저장:

- Store name: `mesasim-ui-settings`, `mesasim-simulation-settings`
- `partialize`를 사용하여 UI 관련 설정만 선택적 영속화
- 페이지 로드 시 자동 hydration

### Component Pattern

각 Tab 컴포넌트는 동일한 패턴을 따른다:

1. Zustand store에서 상태 구독
2. Tailwind CSS로 스타일링
3. `onChange` handler에서 store action 호출
4. Disabled state 처리 (simulation not running 등)
5. 공통 UI 요소: Slider, Toggle, Button, Badge

### FPS Measurement (SystemTab)

`requestAnimationFrame` 기반 FPS 계산:
- `useEffect`에서 rAF loop 시작
- 500ms 간격으로 frame count 기반 FPS 계산
- cleanup 시 rAF cancel

### Memory Usage (SystemTab)

- Chrome: `(performance as any).memory.usedJSHeapSize` 사용
- Non-Chrome: "N/A" 표시, 에러 없이 graceful fallback

---

## Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| `src/stores/simulation-store.ts` | Existing | Weather state, config 필드 활용 |
| `src/stores/ui-store.ts` | Existing | ActiveTab, UI 상태 관리 |
| `src/types/simulation.ts` | Existing | WeatherState, Vehicle, SimulationConfig types |
| `src/components/scene/CameraController.tsx` | Existing | OrbitControls 연동 대상 |
| Zustand persist middleware | Library | 이미 프로젝트에 포함 확인 필요 |

---

## Risks & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Vehicle Tab이 아직 구현되지 않은 R5 시스템에 의존 | Medium | High | UI만 구성하고 pending notice 표시. 설정값은 store에 저장되어 R5 구현 시 즉시 연동 가능 |
| Camera store 변경이 3D scene 렌더링 성능에 영향 | Medium | Medium | Camera 설정 변경 시 throttle/debounce 적용. OrbitControls props 변경은 R3F가 최적화 |
| localStorage quota 초과 | Low | Low | 설정값만 저장 (수 KB), 대용량 데이터 없음 |
| `performance.memory` API 미지원 브라우저 | Low | Medium | Optional chaining으로 안전하게 접근, fallback UI 제공 |
| TabId/ActiveTab type 변경으로 인한 기존 코드 영향 | Medium | Medium | TypeScript strict mode가 모든 미처리 case를 compile-time에 검출 |

---

## Expert Consultation Recommendations

이 SPEC에는 frontend UI 컴포넌트 구현이 포함되어 있으므로, 구현 단계(/moai run)에서 다음 전문가 상담을 권장합니다:

- **expert-frontend**: React component 설계, Zustand store 패턴, Tailwind CSS 스타일링
- **expert-performance**: FPS measurement 정확도, 3D scene camera 연동 성능 최적화

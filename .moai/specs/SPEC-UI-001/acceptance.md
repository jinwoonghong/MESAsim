---
id: SPEC-UI-001
type: acceptance
parent_spec: SPEC-UI-001/spec.md
---

# SPEC-UI-001: Acceptance Criteria

## Quality Gates

- **TypeScript**: strict mode, `noImplicitAny: true`, 모든 파일에 `any` type 사용 금지
- **Styling**: Tailwind CSS 전용 (inline style, CSS modules 사용 금지)
- **State**: Zustand store를 통한 상태 관리 (component local state는 UI-only 상태에 한정)
- **Persistence**: 모든 설정값 `localStorage` 영속화 확인
- **No Runtime Errors**: 모든 브라우저에서 에러 없이 동작

---

## R1: Camera Tab

### Scenario 1.1: Camera View Preset 적용

```gherkin
Given Control Panel이 열려있고 Camera Tab이 활성화된 상태
When 사용자가 "Top-down" preset 버튼을 클릭
Then camera가 수직 하향 시점으로 전환된다
And OrbitControls의 polar angle이 약 0도(수직)로 설정된다

Given Control Panel이 열려있고 Camera Tab이 활성화된 상태
When 사용자가 "Isometric" preset 버튼을 클릭
Then camera가 45도 등축 시점으로 전환된다

Given Control Panel이 열려있고 Camera Tab이 활성화된 상태
When 사용자가 "Street-level" preset 버튼을 클릭
Then camera가 지면 근접 시점으로 전환된다
```

### Scenario 1.2: Follow Agent Toggle

```gherkin
Given agent가 선택된 상태
When 사용자가 "Follow Agent" toggle을 활성화
Then camera가 선택된 agent를 자동으로 추적한다
And agent가 이동하면 camera도 따라 이동한다

Given "Follow Agent"가 활성화된 상태
When 사용자가 toggle을 비활성화
Then camera가 현재 위치에서 고정된다
And agent가 이동해도 camera는 움직이지 않는다

Given "Follow Agent"가 활성화된 상태
When 선택된 agent가 없는 경우
Then toggle이 disabled 상태로 표시된다
```

### Scenario 1.3: Orbit Speed / Damping 조정

```gherkin
Given Camera Tab이 활성화된 상태
When 사용자가 orbit speed slider를 0.5에서 1.5로 변경
Then OrbitControls의 rotateSpeed가 1.5로 업데이트된다
And 마우스 드래그 시 회전 속도가 증가한다

Given Camera Tab이 활성화된 상태
When 사용자가 damping slider를 조정
Then OrbitControls의 dampingFactor가 해당 값으로 업데이트된다
```

### Scenario 1.4: FOV Adjustment

```gherkin
Given Camera Tab이 활성화된 상태
When 사용자가 FOV slider를 75에서 90으로 변경
Then camera의 field of view가 90도로 변경된다
And 시야가 넓어지는 시각적 변화가 즉시 반영된다

Given Camera Tab이 활성화된 상태
When 사용자가 FOV를 30 미만으로 설정하려고 시도
Then FOV 값이 30으로 고정된다 (minimum clamp)

Given Camera Tab이 활성화된 상태
When 사용자가 FOV를 120 초과로 설정하려고 시도
Then FOV 값이 120으로 고정된다 (maximum clamp)
```

### Scenario 1.5: Camera Settings Persistence

```gherkin
Given 사용자가 Camera Tab에서 preset을 "isometric", FOV를 90, orbit speed를 1.5로 설정
When 페이지를 새로고침
Then Camera Tab의 설정값이 이전 상태로 복원된다
And camera가 isometric preset, FOV 90, orbit speed 1.5로 적용된다
```

---

## R2: Weather Tab

### Scenario 2.1: Manual Weather Selection

```gherkin
Given simulation이 실행 중이고 Weather Tab이 활성화된 상태
When 사용자가 "Rainy" 버튼을 클릭
Then simulation-store의 weather가 "rainy"로 변경된다
And 3D scene에 비 효과가 적용된다

Given simulation이 실행 중이고 Weather Tab이 활성화된 상태
When 사용자가 현재 활성화된 weather 버튼을 다시 클릭
Then 변경 없이 현재 상태가 유지된다
```

### Scenario 2.2: Auto-Weather Toggle

```gherkin
Given Weather Tab이 활성화된 상태
When 사용자가 "Auto Weather" toggle을 활성화
Then 시스템이 자동으로 날씨를 전환하기 시작한다
And manual weather 버튼은 현재 날씨를 표시하지만 클릭 시 auto가 해제된다

Given "Auto Weather"가 활성화된 상태
When 사용자가 manual weather 버튼을 클릭
Then "Auto Weather" toggle이 자동으로 비활성화된다
And 선택한 날씨가 manual로 적용된다
```

### Scenario 2.3: Day Duration Slider

```gherkin
Given Weather Tab이 활성화된 상태
When 사용자가 day duration slider를 120초에서 60초로 변경
Then dayDurationMs가 60000으로 업데이트된다
And day/night cycle이 2배 빨라진다

Given Weather Tab이 활성화된 상태
When 사용자가 slider를 30초 미만으로 설정하려고 시도
Then 값이 30초로 고정된다

Given Weather Tab이 활성화된 상태
When 사용자가 slider를 600초 초과로 설정하려고 시도
Then 값이 600초로 고정된다
```

### Scenario 2.4: Weather Effects Toggle

```gherkin
Given weather가 "rainy"이고 effects가 활성화된 상태
When 사용자가 "Weather Effects" toggle을 비활성화
Then 비 시각 효과가 사라진다
And simulation-store의 weather 값은 여전히 "rainy"이다
```

### Scenario 2.5: Simulation Not Running

```gherkin
Given simulation이 정지된 상태
When 사용자가 Weather Tab을 열면
Then 모든 weather 컨트롤이 disabled 상태로 표시된다
And "Simulation을 시작해주세요" 안내 메시지가 표시된다

Given simulation이 정지된 상태에서 Weather Tab이 열려있을 때
When simulation이 시작되면
Then weather 컨트롤이 자동으로 활성화된다
And 안내 메시지가 사라진다
```

---

## R3: Vehicle Tab

### Scenario 3.1: Vehicle Enable/Disable

```gherkin
Given Vehicle Tab이 활성화된 상태
When 사용자가 "Enable Vehicles" toggle을 활성화
Then SimulationConfig.vehiclesEnabled가 true로 설정된다
And vehicle 관련 컨트롤(count, types, spawn rate)이 활성화된다

Given Vehicle Tab이 활성화된 상태
When 사용자가 "Enable Vehicles" toggle을 비활성화
Then SimulationConfig.vehiclesEnabled가 false로 설정된다
And vehicle 관련 컨트롤이 disabled 상태로 변경된다
```

### Scenario 3.2: Max Vehicle Count

```gherkin
Given vehicles가 활성화된 상태
When 사용자가 max vehicle count slider를 10에서 30으로 변경
Then maxVehicleCount가 30으로 업데이트된다

Given vehicles가 활성화된 상태
When 사용자가 slider를 0으로 설정
Then maxVehicleCount가 0으로 설정된다
And vehicle spawn이 중지된다
```

### Scenario 3.3: Vehicle Type Toggles

```gherkin
Given vehicles가 활성화된 상태
When 사용자가 "Bus" type toggle을 비활성화
Then vehicleTypes.bus가 false로 설정된다
And bus type vehicle은 더 이상 spawn되지 않는다

Given vehicles가 활성화된 상태
When 모든 vehicle type toggle이 비활성화된 경우
Then vehicle spawn이 중지된다
And "최소 하나의 vehicle type을 선택해주세요" 경고가 표시된다
```

### Scenario 3.4: Vehicle System Pending Notice

```gherkin
Given vehicle 시스템이 아직 구현되지 않은 상태
When 사용자가 Vehicle Tab을 열면
Then 상단에 "Vehicle 시스템은 현재 개발 중입니다" 안내 배너가 표시된다
And 설정 컨트롤은 정상 작동하여 값을 저장할 수 있다
```

### Scenario 3.5: Empty State

```gherkin
Given vehiclesEnabled가 true이지만 활성 vehicle이 0개인 상태
When Vehicle Tab을 열면
Then "현재 활성 vehicle이 없습니다" 메시지가 표시된다
And vehicle count는 "0 / {maxVehicleCount}" 형식으로 표시된다
```

### Scenario 3.6: Vehicle Settings Persistence

```gherkin
Given 사용자가 maxVehicleCount를 25, car와 taxi만 활성화, spawnRate를 3초로 설정
When 페이지를 새로고침
Then 모든 vehicle 설정이 이전 상태로 복원된다
```

---

## R4: System Tab

### Scenario 4.1: FPS Counter

```gherkin
Given System Tab이 활성화된 상태
When simulation이 실행 중
Then FPS 값이 실시간으로 표시된다
And 값이 500ms 간격으로 업데이트된다

Given System Tab이 활성화된 상태
When FPS가 30 미만으로 떨어지면
Then FPS 표시가 경고 색상(빨간색)으로 변경된다
```

### Scenario 4.2: Agent Count Display

```gherkin
Given System Tab이 활성화된 상태
When 현재 5개의 agent가 활성화된 상태
Then "Active Agents: 5" 로 표시된다

Given System Tab이 활성화된 상태
When agent가 추가되거나 제거되면
Then agent count가 실시간으로 업데이트된다
```

### Scenario 4.3: Memory Usage

```gherkin
Given Chrome 브라우저에서 System Tab이 활성화된 상태
When memory 정보를 요청하면
Then 현재 JS heap 사용량이 MB 단위로 표시된다

Given Chrome이 아닌 브라우저에서 System Tab이 활성화된 상태
When memory 정보를 요청하면
Then "N/A" 또는 "Unsupported" 메시지가 표시된다
And console에 에러가 발생하지 않는다
```

### Scenario 4.4: Debug Overlay Toggle

```gherkin
Given System Tab이 활성화된 상태
When 사용자가 "Debug Overlay" toggle을 활성화
Then 3D scene에 debug 정보가 오버레이된다
And wireframe, bounding box, 또는 axis helper가 표시된다

Given "Debug Overlay"가 활성화된 상태
When toggle을 비활성화
Then debug 오버레이가 제거된다
And 3D scene이 정상 렌더링으로 복원된다
```

### Scenario 4.5: Simulation Tick Info

```gherkin
Given System Tab이 활성화된 상태
When simulation이 실행 중
Then 현재 tick 번호가 표시된다
And 경과 시간이 표시된다
And 값이 매 tick마다 업데이트된다
```

### Scenario 4.6: Reset All Settings

```gherkin
Given 여러 tab에서 다양한 설정을 변경한 상태
When 사용자가 "Reset All Settings" 버튼을 클릭
Then 확인 dialog가 표시된다

Given 확인 dialog가 표시된 상태
When 사용자가 "확인"을 클릭
Then 모든 tab의 설정값이 기본값으로 초기화된다
And localStorage가 clear된다
And 모든 UI 컨트롤이 기본값을 반영한다

Given 확인 dialog가 표시된 상태
When 사용자가 "취소"를 클릭
Then 설정값이 변경되지 않는다
And dialog가 닫힌다
```

---

## Edge Cases

### E1: Tab Switching Performance

```gherkin
Given 7개 tab이 모두 존재하는 상태
When 사용자가 tab 사이를 빠르게 전환
Then 각 tab 전환이 100ms 이내에 완료된다
And 이전 tab의 state가 보존된다
```

### E2: localStorage Corruption

```gherkin
Given localStorage에 잘못된 형식의 데이터가 저장된 경우
When 페이지가 로드되면
Then 시스템은 기본값으로 fallback한다
And console에 warning을 출력하되 에러는 발생하지 않는다
```

### E3: Concurrent Store Updates

```gherkin
Given Camera Tab에서 여러 slider를 동시에 조정하는 경우
When 각 slider 값이 변경되면
Then 모든 값이 정확하게 store에 반영된다
And 마지막 상태가 localStorage에 저장된다
```

### E4: Browser Compatibility

```gherkin
Given performance.memory API를 지원하지 않는 브라우저(Firefox, Safari)
When System Tab을 열면
Then memory section에 "N/A" 가 표시된다
And 나머지 기능(FPS, agent count, tick info)은 정상 작동한다
```

---

## Definition of Done

- [ ] 4개 새 tab 컴포넌트 생성 완료 (CameraTab, WeatherTab, VehicleTab, SystemTab)
- [ ] ControlPanel.tsx에 7개 tab 전체 렌더링 확인
- [ ] ui-store.ts TabId/ActiveTab type 확장 완료
- [ ] 모든 설정값 localStorage 영속화 확인
- [ ] TypeScript strict mode 에러 없음
- [ ] `any` type 사용 없음
- [ ] Tailwind CSS 전용 스타일링 (inline style 없음)
- [ ] Vehicle Tab pending notice 표시 확인
- [ ] Weather Tab simulation-not-running guard 동작 확인
- [ ] System Tab FPS counter 실시간 업데이트 확인
- [ ] System Tab memory usage Chrome/non-Chrome 대응 확인
- [ ] Reset All Settings 기능 동작 확인
- [ ] Tab 전환 성능 정상 (100ms 이내)

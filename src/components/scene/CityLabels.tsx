"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useCityStore } from "@/stores/city-store";
import { useUIStore } from "@/stores/ui-store";
import type { Building } from "@/types/city";
import * as THREE from "three";

const MAX_LABELS = 50;
const LABEL_OFFSET_Y = 2;
const LOD_DISTANCE_THRESHOLD = 200;

/** Extract a display name from a building, preferring name field then OSM tags. */
function getBuildingLabel(building: Building): string | null {
  if (building.name) return building.name;
  const osmName = building.osmTags["name"] ?? building.osmTags["name:ko"];
  if (osmName) return osmName;
  const englishName = building.osmTags["name:en"];
  if (englishName) return englishName;
  return null;
}

/** Wrapper that hides a label when the camera is farther than LOD_DISTANCE_THRESHOLD. */
function LabelWithLOD({
  building,
  label,
}: {
  building: Building;
  label: string;
}): React.JSX.Element | null {
  const groupRef = useRef<THREE.Group>(null);
  const visibleRef = useRef(true);
  const labelPosition = useMemo(
    () =>
      new THREE.Vector3(
        building.position.x,
        building.height + LABEL_OFFSET_Y,
        building.position.y,
      ),
    [building.position.x, building.position.y, building.height],
  );

  useFrame(({ camera }) => {
    const distance = camera.position.distanceTo(labelPosition);
    const shouldBeVisible = distance <= LOD_DISTANCE_THRESHOLD;
    if (shouldBeVisible !== visibleRef.current) {
      visibleRef.current = shouldBeVisible;
      if (groupRef.current) {
        groupRef.current.visible = shouldBeVisible;
      }
    }
  });

  return (
    <group ref={groupRef}>
      <Html
        position={[labelPosition.x, labelPosition.y, labelPosition.z]}
        center
        distanceFactor={15}
        occlude
        style={{
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <span
          style={{
            color: "#ffffff",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            padding: "2px 6px",
            borderRadius: "3px",
            fontSize: "11px",
            fontFamily:
              "'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
            whiteSpace: "nowrap",
            textShadow: "0 1px 2px rgba(0, 0, 0, 0.8)",
          }}
        >
          {label}
        </span>
      </Html>
    </group>
  );
}

export default function CityLabels(): React.JSX.Element | null {
  const buildings = useCityStore((s) => s.cityData?.buildings ?? []);
  const showLabels = useUIStore((s) => s.showLabels);

  const labeledBuildings = useMemo(() => {
    const named: { building: Building; label: string }[] = [];
    for (const building of buildings) {
      const label = getBuildingLabel(building);
      if (label) {
        named.push({ building, label });
        if (named.length >= MAX_LABELS) break;
      }
    }
    return named;
  }, [buildings]);

  if (!showLabels || labeledBuildings.length === 0) {
    return null;
  }

  return (
    <group>
      {labeledBuildings.map(({ building, label }) => (
        <LabelWithLOD key={building.id} building={building} label={label} />
      ))}
    </group>
  );
}

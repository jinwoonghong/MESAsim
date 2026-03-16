"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useCityStore } from "@/stores/city-store";
import { useUIStore } from "@/stores/ui-store";
import type { POICategory } from "@/types/poi";

const CATEGORY_COLORS: Record<POICategory, string> = {
  convenience_store: "#FF6B35",
  cafe: "#8B4513",
  restaurant: "#DC143C",
  pharmacy: "#228B22",
  bank: "#4169E1",
  subway_entrance: "#FFD700",
  other: "#808080",
};

const MAX_MARKERS = 200;
const MARKER_RADIUS = 0.6;
const SUBWAY_SCALE = 1.5;
const ELEVATION = 2;
const EMPTY_POIS: never[] = [];

export default function POIMarkers(): React.JSX.Element | null {
  const pois = useCityStore((s) => s.cityData?.pois ?? EMPTY_POIS);
  const showPOIs = useUIStore((s) => s.showPOIs);

  const visiblePOIs = useMemo(() => pois.slice(0, MAX_MARKERS), [pois]);

  if (!showPOIs || visiblePOIs.length === 0) {
    return null;
  }

  return (
    <group>
      {visiblePOIs.map((poi) => {
        const color = CATEGORY_COLORS[poi.category] ?? CATEGORY_COLORS.other;
        const isSubway = poi.category === "subway_entrance";

        if (isSubway) {
          // Diamond-shaped marker for subway entrances (rotated box)
          return (
            <mesh
              key={poi.id}
              position={[poi.position.x, ELEVATION, poi.position.y]}
              rotation={[0, Math.PI / 4, Math.PI / 4]}
              scale={SUBWAY_SCALE}
            >
              <boxGeometry args={[MARKER_RADIUS, MARKER_RADIUS, MARKER_RADIUS]} />
              <meshStandardMaterial
                color={color}
                emissive={new THREE.Color(color)}
                emissiveIntensity={0.4}
              />
            </mesh>
          );
        }

        // Sphere marker for other POIs
        return (
          <mesh
            key={poi.id}
            position={[poi.position.x, ELEVATION, poi.position.y]}
          >
            <sphereGeometry args={[MARKER_RADIUS, 8, 8]} />
            <meshStandardMaterial
              color={color}
              emissive={new THREE.Color(color)}
              emissiveIntensity={0.3}
            />
          </mesh>
        );
      })}
    </group>
  );
}

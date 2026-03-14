"use client";

import { useMemo } from "react";
import { useCityStore } from "@/stores";
import type { Building, RoadSegment } from "@/types";

function BuildingMesh({ building }: { building: Building }): React.JSX.Element {
  // Calculate width and depth from polygon bounds
  const { width, depth } = useMemo(() => {
    if (building.polygon.length === 0) {
      return { width: 4, depth: 4 };
    }
    const xs = building.polygon.map((p) => p.x);
    const ys = building.polygon.map((p) => p.y);
    return {
      width: Math.max(Math.max(...xs) - Math.min(...xs), 2),
      depth: Math.max(Math.max(...ys) - Math.min(...ys), 2),
    };
  }, [building.polygon]);

  if (building.height <= 0) return <></>;

  return (
    <mesh
      position={[building.position.x, building.height / 2, building.position.y]}
    >
      <boxGeometry args={[width, building.height, depth]} />
      <meshStandardMaterial color={building.color} />
    </mesh>
  );
}

function RoadMesh({ segment }: { segment: RoadSegment }): React.JSX.Element | null {
  const geometry = useMemo(() => {
    if (segment.waypoints.length < 2) return null;

    const points: [number, number, number][] = segment.waypoints.map((wp) => [
      wp.x,
      0.01,
      wp.y,
    ]);

    return points;
  }, [segment.waypoints]);

  if (!geometry || geometry.length < 2) return null;

  // Render each road segment pair as a thin flat box
  return (
    <>
      {geometry.map((point, i) => {
        if (i >= geometry.length - 1) return null;
        const next = geometry[i + 1];
        const dx = next[0] - point[0];
        const dz = next[2] - point[2];
        const length = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dx, dz);
        const midX = (point[0] + next[0]) / 2;
        const midZ = (point[2] + next[2]) / 2;

        return (
          <mesh
            key={`${segment.id}-${i}`}
            position={[midX, 0.01, midZ]}
            rotation={[0, angle, 0]}
          >
            <boxGeometry args={[segment.width, 0.02, length]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
        );
      })}
    </>
  );
}

export default function CityRenderer(): React.JSX.Element {
  const cityData = useCityStore((s) => s.cityData);

  if (!cityData) return <></>;

  return (
    <group>
      {cityData.buildings.map((building: Building) => (
        <BuildingMesh key={building.id} building={building} />
      ))}
      {cityData.roadSegments.map((segment: RoadSegment) => (
        <RoadMesh key={segment.id} segment={segment} />
      ))}
    </group>
  );
}

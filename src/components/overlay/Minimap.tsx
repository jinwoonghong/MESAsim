"use client";

import { useCallback, useEffect, useRef } from "react";
import { useUIStore } from "@/stores/ui-store";
import { useCityStore } from "@/stores/city-store";
import { useAgentStore } from "@/stores/agent-store";
import type { Agent, AgentState } from "@/types/agent";

// Canvas dimensions in CSS pixels
const CANVAS_SIZE = 200;
const PADDING = 10;
const DRAW_SIZE = CANVAS_SIZE - PADDING * 2;

// Agent dot configuration
const AGENT_DOT_RADIUS = 3;
const AGENT_HIT_RADIUS = 8; // Larger radius for click hit-testing

// Throttle interval in ms (max 4 updates/second)
const THROTTLE_INTERVAL = 250;

// Agent state color mapping
const STATE_COLORS: Record<AgentState, string> = {
  moving: "#3b82f6", // blue
  idle: "#22c55e", // green
  interacting: "#f97316", // orange
  sleeping: "#9ca3af", // gray
};

/**
 * Compute the bounding box of all building positions to determine
 * the world-coordinate range for minimap scaling.
 */
function computeWorldBounds(
  buildings: { position: { x: number; y: number } }[]
): { minX: number; maxX: number; minY: number; maxY: number } | null {
  if (buildings.length === 0) return null;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const b of buildings) {
    if (b.position.x < minX) minX = b.position.x;
    if (b.position.x > maxX) maxX = b.position.x;
    if (b.position.y < minY) minY = b.position.y;
    if (b.position.y > maxY) maxY = b.position.y;
  }

  // Add a small margin so edge buildings are not clipped
  const marginX = (maxX - minX) * 0.05 || 1;
  const marginY = (maxY - minY) * 0.05 || 1;

  return {
    minX: minX - marginX,
    maxX: maxX + marginX,
    minY: minY - marginY,
    maxY: maxY + marginY,
  };
}

/**
 * Convert a world coordinate (x, y) to canvas pixel coordinates.
 * Buildings use {x, y} in local coords; agents use {x, z} from 3D.
 */
function worldToCanvas(
  worldX: number,
  worldY: number,
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
): { cx: number; cy: number } {
  const rangeX = bounds.maxX - bounds.minX || 1;
  const rangeY = bounds.maxY - bounds.minY || 1;
  const cx = PADDING + ((worldX - bounds.minX) / rangeX) * DRAW_SIZE;
  const cy = PADDING + ((worldY - bounds.minY) / rangeY) * DRAW_SIZE;
  return { cx, cy };
}

/**
 * Draw the static city background (buildings and roads) onto a canvas.
 * Returns an ImageData snapshot that can be reused to avoid redrawing.
 */
function drawStaticBackground(
  ctx: CanvasRenderingContext2D,
  cityData: {
    buildings: { position: { x: number; y: number }; polygon: { x: number; y: number }[]; color: string }[];
    roadSegments: { waypoints: { x: number; y: number }[]; width: number }[];
  },
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
): ImageData {
  // Clear with semi-transparent dark background
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Draw road segments
  ctx.strokeStyle = "rgba(100, 116, 139, 0.6)";
  ctx.lineWidth = 1;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const segment of cityData.roadSegments) {
    if (segment.waypoints.length < 2) continue;
    ctx.beginPath();
    const start = worldToCanvas(segment.waypoints[0].x, segment.waypoints[0].y, bounds);
    ctx.moveTo(start.cx, start.cy);
    for (let i = 1; i < segment.waypoints.length; i++) {
      const pt = worldToCanvas(segment.waypoints[i].x, segment.waypoints[i].y, bounds);
      ctx.lineTo(pt.cx, pt.cy);
    }
    ctx.stroke();
  }

  // Draw building footprints
  for (const building of cityData.buildings) {
    if (building.polygon.length < 3) {
      // Fallback: draw as a small rectangle at position
      const { cx, cy } = worldToCanvas(building.position.x, building.position.y, bounds);
      ctx.fillStyle = "rgba(148, 163, 184, 0.4)";
      ctx.fillRect(cx - 1.5, cy - 1.5, 3, 3);
      continue;
    }
    ctx.beginPath();
    const first = worldToCanvas(building.polygon[0].x, building.polygon[0].y, bounds);
    ctx.moveTo(first.cx, first.cy);
    for (let i = 1; i < building.polygon.length; i++) {
      const pt = worldToCanvas(building.polygon[i].x, building.polygon[i].y, bounds);
      ctx.lineTo(pt.cx, pt.cy);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(148, 163, 184, 0.35)";
    ctx.fill();
  }

  return ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
}

/**
 * Draw agent dots on top of the cached background.
 */
function drawAgents(
  ctx: CanvasRenderingContext2D,
  backgroundImage: ImageData,
  agents: Map<string, Agent>,
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
): void {
  // Restore the cached static background
  ctx.putImageData(backgroundImage, 0, 0);

  // Draw each agent as a colored dot
  for (const agent of agents.values()) {
    // Agent 3D position: use x and z for the 2D minimap
    const { cx, cy } = worldToCanvas(agent.position.x, agent.position.z, bounds);
    ctx.beginPath();
    ctx.arc(cx, cy, AGENT_DOT_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = STATE_COLORS[agent.state];
    ctx.fill();
  }
}

export default function Minimap(): React.JSX.Element | null {
  const showMinimap = useUIStore((s) => s.showMinimap);
  const cityData = useCityStore((s) => s.cityData);
  const agents = useAgentStore((s) => s.agents);
  const selectAgent = useAgentStore((s) => s.selectAgent);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundRef = useRef<ImageData | null>(null);
  const boundsRef = useRef<ReturnType<typeof computeWorldBounds>>(null);
  const lastDrawTimeRef = useRef<number>(0);
  const rafIdRef = useRef<number>(0);

  // Recompute static background when city data changes
  useEffect(() => {
    if (!cityData || !canvasRef.current) {
      backgroundRef.current = null;
      boundsRef.current = null;
      return;
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const bounds = computeWorldBounds(cityData.buildings);
    if (!bounds) return;

    boundsRef.current = bounds;
    backgroundRef.current = drawStaticBackground(ctx, cityData, bounds);
  }, [cityData]);

  // Throttled agent rendering via interval
  useEffect(() => {
    if (!showMinimap || !canvasRef.current) return;

    const intervalId = setInterval(() => {
      const canvas = canvasRef.current;
      if (!canvas || !backgroundRef.current || !boundsRef.current) return;

      const now = performance.now();
      if (now - lastDrawTimeRef.current < THROTTLE_INTERVAL) return;
      lastDrawTimeRef.current = now;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const currentAgents = useAgentStore.getState().agents;
      drawAgents(ctx, backgroundRef.current, currentAgents, boundsRef.current);
    }, THROTTLE_INTERVAL);

    return (): void => {
      clearInterval(intervalId);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [showMinimap]);

  // Force an initial draw when background is ready and agents exist
  useEffect(() => {
    if (!showMinimap || !backgroundRef.current || !boundsRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawAgents(ctx, backgroundRef.current, agents, boundsRef.current);
    lastDrawTimeRef.current = performance.now();
  }, [showMinimap, agents, cityData]);

  // Click handler: hit-test agent dots and select
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): void => {
      const canvas = canvasRef.current;
      if (!canvas || !boundsRef.current) return;

      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const currentAgents = useAgentStore.getState().agents;
      let closestId: string | null = null;
      let closestDistSq = AGENT_HIT_RADIUS * AGENT_HIT_RADIUS;

      for (const agent of currentAgents.values()) {
        const { cx, cy } = worldToCanvas(agent.position.x, agent.position.z, boundsRef.current);
        const dx = clickX - cx;
        const dy = clickY - cy;
        const distSq = dx * dx + dy * dy;
        if (distSq < closestDistSq) {
          closestDistSq = distSq;
          closestId = agent.id;
        }
      }

      if (closestId) {
        selectAgent(closestId);
      }
    },
    [selectAgent]
  );

  // Conditional rendering based on store toggle
  if (!showMinimap) return null;

  return (
    <div
      className="fixed bottom-4 left-4 z-50 rounded-lg border border-slate-600/50 shadow-lg overflow-hidden"
      style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        onClick={handleClick}
        className="cursor-crosshair"
        aria-label="Minimap showing agent positions on city layout"
      />
    </div>
  );
}

import type { SimulationConfig, TimeOfDay } from "@/types/simulation";

export const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
  maxAgents: 25,
  tickInterval: 16, // ~60fps
  speedMultiplier: 1,
  agentInteractionRange: 5,
  agentDecisionInterval: 30000, // 30s between LLM calls
  weatherEnabled: true,
  vehiclesEnabled: false,
  dayDurationMs: 1440000, // 24 real minutes = 1 sim day
};

export function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 18) return "day";
  if (hour >= 18 && hour < 20) return "dusk";
  return "night";
}

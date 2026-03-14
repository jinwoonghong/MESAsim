export type SimulationStatus = "idle" | "running" | "paused";
export type SpeedMultiplier = 0.5 | 1 | 2 | 5 | 10;
export type WeatherState = "clear" | "cloudy" | "rainy" | "stormy";
export type TimeOfDay = "dawn" | "day" | "dusk" | "night";

export interface SimulationConfig {
  maxAgents: number;
  tickInterval: number; // ms between simulation ticks
  speedMultiplier: SpeedMultiplier;
  agentInteractionRange: number;
  agentDecisionInterval: number; // ms between LLM decisions
  weatherEnabled: boolean;
  vehiclesEnabled: boolean;
  dayDurationMs: number; // real-time ms for one sim day
}

export interface SimulationTime {
  hour: number; // 0-23
  minute: number; // 0-59
  day: number;
  timeOfDay: TimeOfDay;
}

export interface Vehicle {
  id: string;
  position: { x: number; y: number; z: number };
  path: { x: number; y: number }[];
  pathIndex: number;
  speed: number;
  type: "car" | "bus" | "taxi";
}

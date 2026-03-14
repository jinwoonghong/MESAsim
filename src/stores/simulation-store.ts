import { create } from "zustand";
import type {
  SimulationStatus,
  SimulationConfig,
  SimulationTime,
  SpeedMultiplier,
  WeatherState,
  TimeOfDay,
} from "@/types/simulation";

function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 18) return "day";
  if (hour >= 18 && hour < 20) return "dusk";
  return "night";
}

interface SimulationState {
  status: SimulationStatus;
  config: SimulationConfig;
  time: SimulationTime;
  weather: WeatherState;
  tickCount: number;

  start: () => void;
  pause: () => void;
  reset: () => void;
  setSpeed: (speed: SpeedMultiplier) => void;
  tick: () => void;
  setWeather: (weather: WeatherState) => void;
  advanceTime: (deltaMs: number) => void;
}

const DEFAULT_CONFIG: SimulationConfig = {
  maxAgents: 25,
  tickInterval: 16, // ~60fps
  speedMultiplier: 1,
  agentInteractionRange: 5,
  agentDecisionInterval: 30000,
  weatherEnabled: true,
  vehiclesEnabled: false,
  dayDurationMs: 1440000, // 24 real minutes = 1 sim day
};

const DEFAULT_TIME: SimulationTime = {
  hour: 8,
  minute: 0,
  day: 1,
  timeOfDay: "day",
};

export const useSimulationStore = create<SimulationState>()((set, get) => ({
  status: "idle",
  config: DEFAULT_CONFIG,
  time: DEFAULT_TIME,
  weather: "clear",
  tickCount: 0,

  start: (): void => {
    set({ status: "running" });
  },

  pause: (): void => {
    set({ status: "paused" });
  },

  reset: (): void => {
    set({
      status: "idle",
      time: DEFAULT_TIME,
      weather: "clear",
      tickCount: 0,
    });
  },

  setSpeed: (speed: SpeedMultiplier): void => {
    set((state) => ({
      config: { ...state.config, speedMultiplier: speed },
    }));
  },

  tick: (): void => {
    const state = get();
    if (state.status !== "running") return;

    const deltaMs = state.config.tickInterval * state.config.speedMultiplier;
    set((prev) => ({ tickCount: prev.tickCount + 1 }));
    state.advanceTime(deltaMs);
  },

  setWeather: (weather: WeatherState): void => {
    set({ weather });
  },

  advanceTime: (deltaMs: number): void => {
    set((state) => {
      const { dayDurationMs } = state.config;
      const msPerSimMinute = dayDurationMs / 1440;
      const simMinutesElapsed = deltaMs / msPerSimMinute;

      let totalMinutes = state.time.hour * 60 + state.time.minute + simMinutesElapsed;
      let day = state.time.day;

      while (totalMinutes >= 1440) {
        totalMinutes -= 1440;
        day += 1;
      }

      const hour = Math.floor(totalMinutes / 60) % 24;
      const minute = Math.floor(totalMinutes % 60);

      return {
        time: {
          hour,
          minute,
          day,
          timeOfDay: getTimeOfDay(hour),
        },
      };
    });
  },
}));

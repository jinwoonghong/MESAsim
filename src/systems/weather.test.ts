import { describe, it, expect, vi, afterEach } from "vitest";
import type { WeatherState } from "@/types/simulation";
import {
  updateWeather,
  WEATHER_SPEED_MODIFIER,
  shouldSeekShelter,
  getWeatherCheckIntervalMs,
} from "./weather";

describe("Weather System", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("updateWeather", () => {
    const ALL_STATES: WeatherState[] = ["clear", "cloudy", "rainy", "stormy"];

    it("returns a valid WeatherState", () => {
      for (const state of ALL_STATES) {
        const result = updateWeather(state, 1000);
        expect(ALL_STATES).toContain(result);
      }
    });

    it("can stay in the same state (no transition)", () => {
      // With a high random value, no transition should occur
      vi.spyOn(Math, "random").mockReturnValue(0.99);

      for (const state of ALL_STATES) {
        const result = updateWeather(state, 1000);
        expect(result).toBe(state);
      }
    });

    it("transitions clear -> cloudy (never to rainy or stormy)", () => {
      // Force a transition by returning a low random value
      vi.spyOn(Math, "random").mockReturnValue(0.1);

      const result = updateWeather("clear", 1000);
      expect(result).toBe("cloudy");
    });

    it("transitions cloudy -> clear with low roll", () => {
      // cloudy: clear=0.25, rainy=0.25
      // roll < 0.25 -> transition to clear
      vi.spyOn(Math, "random").mockReturnValue(0.1);

      const result = updateWeather("cloudy", 1000);
      expect(result).toBe("clear");
    });

    it("transitions cloudy -> rainy with mid roll", () => {
      // cloudy: clear=0.25, rainy=0.25
      // 0.25 <= roll < 0.50 -> transition to rainy
      vi.spyOn(Math, "random").mockReturnValue(0.35);

      const result = updateWeather("cloudy", 1000);
      expect(result).toBe("rainy");
    });

    it("transitions rainy -> cloudy with low roll", () => {
      // rainy: cloudy=0.2, stormy=0.15
      vi.spyOn(Math, "random").mockReturnValue(0.1);

      const result = updateWeather("rainy", 1000);
      expect(result).toBe("cloudy");
    });

    it("transitions rainy -> stormy with mid roll", () => {
      // rainy: cloudy=0.2, stormy=0.15
      // 0.20 <= roll < 0.35 -> transition to stormy
      vi.spyOn(Math, "random").mockReturnValue(0.25);

      const result = updateWeather("rainy", 1000);
      expect(result).toBe("stormy");
    });

    it("transitions stormy -> rainy with low roll", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.1);

      const result = updateWeather("stormy", 1000);
      expect(result).toBe("rainy");
    });

    it("never transitions clear directly to stormy", () => {
      // Run multiple iterations to verify no direct clear->stormy jump
      const results = new Set<WeatherState>();
      for (let i = 0; i < 1000; i++) {
        results.add(updateWeather("clear", 1000));
      }
      expect(results.has("stormy")).toBe(false);
      expect(results.has("rainy")).toBe(false);
    });

    it("never transitions stormy directly to clear", () => {
      const results = new Set<WeatherState>();
      for (let i = 0; i < 1000; i++) {
        results.add(updateWeather("stormy", 1000));
      }
      expect(results.has("clear")).toBe(false);
      expect(results.has("cloudy")).toBe(false);
    });
  });

  describe("WEATHER_SPEED_MODIFIER", () => {
    it("has modifier 1.0 for clear", () => {
      expect(WEATHER_SPEED_MODIFIER.clear).toBe(1.0);
    });

    it("has modifier 1.0 for cloudy", () => {
      expect(WEATHER_SPEED_MODIFIER.cloudy).toBe(1.0);
    });

    it("has modifier 0.7 for rainy", () => {
      expect(WEATHER_SPEED_MODIFIER.rainy).toBe(0.7);
    });

    it("has modifier 0.4 for stormy", () => {
      expect(WEATHER_SPEED_MODIFIER.stormy).toBe(0.4);
    });

    it("covers all WeatherState values", () => {
      const states: WeatherState[] = ["clear", "cloudy", "rainy", "stormy"];
      for (const state of states) {
        expect(WEATHER_SPEED_MODIFIER[state]).toBeDefined();
        expect(typeof WEATHER_SPEED_MODIFIER[state]).toBe("number");
      }
    });
  });

  describe("shouldSeekShelter", () => {
    it("returns false for clear", () => {
      expect(shouldSeekShelter("clear")).toBe(false);
    });

    it("returns false for cloudy", () => {
      expect(shouldSeekShelter("cloudy")).toBe(false);
    });

    it("returns false for rainy", () => {
      expect(shouldSeekShelter("rainy")).toBe(false);
    });

    it("returns true for stormy", () => {
      expect(shouldSeekShelter("stormy")).toBe(true);
    });
  });

  describe("getWeatherCheckIntervalMs", () => {
    it("returns a positive number", () => {
      const interval = getWeatherCheckIntervalMs();
      expect(interval).toBeGreaterThan(0);
    });

    it("returns 60 seconds in milliseconds", () => {
      expect(getWeatherCheckIntervalMs()).toBe(60_000);
    });
  });
});

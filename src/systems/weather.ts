import type { WeatherState } from "@/types/simulation";

// Transition probabilities between adjacent weather states.
// Each state maps to the probability of transitioning to each neighbor.
// Only adjacent transitions are allowed: clear <-> cloudy <-> rainy <-> stormy
const TRANSITION_PROBABILITIES: Record<
  WeatherState,
  Partial<Record<WeatherState, number>>
> = {
  clear: { cloudy: 0.3 },
  cloudy: { clear: 0.25, rainy: 0.25 },
  rainy: { cloudy: 0.2, stormy: 0.15 },
  stormy: { rainy: 0.3 },
};

// Weather check interval in simulation seconds.
// Weather transitions are evaluated once per this interval.
const WEATHER_CHECK_INTERVAL_SIM_SECONDS = 60;

// Minimum simulation seconds between actual weather changes (roughly 2-5 min sim time).
// The check runs every 60s, but transition probability keeps changes spread out.
// With ~30% max transition probability per check, average change interval is ~3-5 checks = 3-5 min.

// @MX:NOTE: Speed modifiers applied to agent movement during weather conditions.
// clear/cloudy have no penalty; rainy slows to 70%; stormy slows to 40%.
export const WEATHER_SPEED_MODIFIER: Record<WeatherState, number> = {
  clear: 1.0,
  cloudy: 1.0,
  rainy: 0.7,
  stormy: 0.4,
};

/**
 * Returns the check interval in simulation seconds.
 * Exposed for testing and configuration.
 */
export function getWeatherCheckIntervalMs(): number {
  return WEATHER_CHECK_INTERVAL_SIM_SECONDS * 1000;
}

/**
 * Determines the next weather state based on transition probabilities.
 * Only adjacent transitions are possible (no direct clear -> stormy jumps).
 *
 * @param currentWeather - The current weather state
 * @param elapsedMs - Simulation milliseconds since last check (unused for now,
 *   reserved for future time-weighted transitions)
 * @returns The new weather state (may be the same as current)
 */
export function updateWeather(
  currentWeather: WeatherState,
  _elapsedMs: number,
): WeatherState {
  const transitions = TRANSITION_PROBABILITIES[currentWeather];
  const roll = Math.random();

  let cumulativeProbability = 0;
  for (const [state, probability] of Object.entries(transitions)) {
    cumulativeProbability += probability as number;
    if (roll < cumulativeProbability) {
      return state as WeatherState;
    }
  }

  // No transition occurred; stay in current state
  return currentWeather;
}

/**
 * Returns true if agents should seek shelter for the given weather.
 * Currently only stormy weather triggers shelter-seeking behavior.
 */
export function shouldSeekShelter(weather: WeatherState): boolean {
  return weather === "stormy";
}

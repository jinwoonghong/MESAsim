import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  searchNominatim,
  nominatimResultToBounds,
  resetNominatimThrottle,
} from "./nominatim";
import type { NominatimResult } from "@/types/poi";

describe("searchNominatim", () => {
  const mockResults: NominatimResult[] = [
    {
      place_id: 123,
      display_name: "Gangnam-gu, Seoul",
      lat: "37.4979",
      lon: "127.0276",
      boundingbox: ["37.47", "37.53", "127.01", "127.07"],
      type: "administrative",
      importance: 0.8,
    },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    resetNominatimThrottle();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResults),
      })
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("calls fetch with correct URL and headers", async () => {
    const promise = searchNominatim("Gangnam");
    // Advance past any rate-limit wait
    await vi.advanceTimersByTimeAsync(2000);
    await promise;

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "https://nominatim.openstreetmap.org/search?q=Gangnam&format=json&countrycodes=kr&limit=5"
      ),
      expect.objectContaining({
        headers: { "User-Agent": "MESAsim/1.0" },
      })
    );
  });

  it("encodes query parameter", async () => {
    const promise = searchNominatim("Seoul Station");
    await vi.advanceTimersByTimeAsync(2000);
    await promise;

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain("q=Seoul%20Station");
  });

  it("returns parsed results on success", async () => {
    const promise = searchNominatim("Gangnam");
    await vi.advanceTimersByTimeAsync(2000);
    const results = await promise;

    expect(results).toEqual(mockResults);
  });

  it("returns empty array on network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error"))
    );

    const promise = searchNominatim("Gangnam");
    await vi.advanceTimersByTimeAsync(2000);
    const results = await promise;

    expect(results).toEqual([]);
  });

  it("returns empty array on non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      })
    );

    const promise = searchNominatim("Gangnam");
    await vi.advanceTimersByTimeAsync(2000);
    const results = await promise;

    expect(results).toEqual([]);
  });

  it("rate limits back-to-back calls", async () => {
    // First call
    const promise1 = searchNominatim("Seoul");
    await vi.advanceTimersByTimeAsync(2000);
    await promise1;

    const firstCallTime = Date.now();

    // Second call immediately after
    const promise2 = searchNominatim("Busan");
    // Should wait up to 1000ms
    await vi.advanceTimersByTimeAsync(1000);
    await promise2;

    // fetch should have been called twice
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

describe("nominatimResultToBounds", () => {
  it("converts boundingbox strings to numbers", () => {
    const result: NominatimResult = {
      place_id: 1,
      display_name: "Test",
      lat: "37.5",
      lon: "127.0",
      boundingbox: ["37.47", "37.53", "127.01", "127.07"],
      type: "city",
      importance: 0.5,
    };

    const bounds = nominatimResultToBounds(result);
    expect(bounds).toEqual({
      south: 37.47,
      north: 37.53,
      west: 127.01,
      east: 127.07,
    });
  });

  it("handles negative coordinate values", () => {
    const result: NominatimResult = {
      place_id: 2,
      display_name: "Test",
      lat: "-33.8",
      lon: "151.2",
      boundingbox: ["-33.9", "-33.7", "151.1", "151.3"],
      type: "city",
      importance: 0.5,
    };

    const bounds = nominatimResultToBounds(result);
    expect(bounds.south).toBeCloseTo(-33.9);
    expect(bounds.north).toBeCloseTo(-33.7);
    expect(bounds.west).toBeCloseTo(151.1);
    expect(bounds.east).toBeCloseTo(151.3);
  });
});

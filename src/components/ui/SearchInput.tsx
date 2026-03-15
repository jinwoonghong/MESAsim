"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { searchNominatim, nominatimResultToBounds } from "@/city/nominatim";
import { fetchOSMData } from "@/city/osm-fetcher";
import { parseOSMResponse } from "@/city/osm-parser";
import { useCityStore } from "@/stores/city-store";
import type { NominatimResult } from "@/types/poi";

export default function SearchInput(): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const setCityData = useCityStore((s) => s.setCityData);
  const setSelectedRegion = useCityStore((s) => s.setSelectedRegion);
  const setStoreLoading = useCityStore((s) => s.setLoading);
  const setStoreError = useCityStore((s) => s.setError);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = useCallback(async (): Promise<void> => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setResults([]);
    setShowDropdown(true);

    try {
      const data = await searchNominatim(trimmed);
      if (data.length === 0) {
        setError("No results found.");
      }
      setResults(data);
    } catch {
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === "Enter") {
        void handleSearch();
      }
    },
    [handleSearch]
  );

  const handleResultClick = useCallback(
    (result: NominatimResult): void => {
      setShowDropdown(false);
      const displayName =
        result.display_name.split(",")[0] ?? result.display_name;
      setQuery(displayName);

      const bounds = nominatimResultToBounds(result);
      const center = {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
      };

      setSelectedRegion(result.display_name);
      setStoreLoading(true);
      setStoreError(null);

      void (async (): Promise<void> => {
        try {
          const osmData = await fetchOSMData(bounds);
          const cityData = parseOSMResponse(osmData, center, displayName, bounds);
          setCityData(cityData);
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : "Failed to load region data";
          setStoreError(message);
        }
      })();
    },
    [setSelectedRegion, setStoreLoading, setStoreError, setCityData],
  );

  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-1">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search Korean locations..."
          className="flex-1 rounded bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 outline-none ring-1 ring-gray-700 focus:ring-blue-500"
        />
        <button
          onClick={() => void handleSearch()}
          disabled={loading || !query.trim()}
          className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "..." : "Search"}
        </button>
      </div>

      {showDropdown && (results.length > 0 || error || loading) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded border border-gray-700 bg-gray-800 shadow-lg">
          {loading && (
            <div className="px-3 py-2 text-sm text-gray-400">Searching...</div>
          )}

          {error && !loading && (
            <div className="px-3 py-2 text-sm text-red-400">{error}</div>
          )}

          {!loading &&
            results.map((result) => (
              <button
                key={result.place_id}
                onClick={() => handleResultClick(result)}
                className="block w-full px-3 py-2 text-left text-sm text-gray-300 transition-colors hover:bg-gray-700"
              >
                <div className="truncate font-medium">
                  {result.display_name.split(",")[0]}
                </div>
                <div className="truncate text-xs text-gray-500">
                  {result.display_name}
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

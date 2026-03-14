import { create } from "zustand";
import type { CityData } from "@/types/city";

interface CityState {
  cityData: CityData | null;
  loading: boolean;
  error: string | null;
  selectedRegion: string | null;

  setCityData: (data: CityData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedRegion: (region: string | null) => void;
  clear: () => void;
}

export const useCityStore = create<CityState>()((set) => ({
  cityData: null,
  loading: false,
  error: null,
  selectedRegion: null,

  setCityData: (data: CityData): void => {
    set({ cityData: data, loading: false, error: null });
  },

  setLoading: (loading: boolean): void => {
    set({ loading });
  },

  setError: (error: string | null): void => {
    set({ error, loading: false });
  },

  setSelectedRegion: (region: string | null): void => {
    set({ selectedRegion: region });
  },

  clear: (): void => {
    set({
      cityData: null,
      loading: false,
      error: null,
      selectedRegion: null,
    });
  },
}));

import { create } from "zustand";
import { persist } from "zustand/middleware";

type ActiveTab =
  | "agents"
  | "city"
  | "settings"
  | "logs"
  | "camera"
  | "weather"
  | "vehicles"
  | "system";

type CameraPreset = "top-down" | "isometric" | "street-level" | "custom";

interface UIState {
  activeTab: ActiveTab;
  showMinimap: boolean;
  showBubbles: boolean;
  showDebug: boolean;
  showPOIs: boolean;
  showLabels: boolean;
  panelWidth: number;

  // Camera settings
  cameraPreset: CameraPreset;
  followAgent: boolean;
  orbitSpeed: number;
  dampingFactor: number;
  fov: number;
  minZoom: number;
  maxZoom: number;
  debugOverlay: boolean;

  setActiveTab: (tab: ActiveTab) => void;
  toggleMinimap: () => void;
  toggleBubbles: () => void;
  toggleDebug: () => void;
  setShowPOIs: (show: boolean) => void;
  setShowLabels: (show: boolean) => void;
  setPanelWidth: (width: number) => void;

  // Camera setters
  setCameraPreset: (preset: CameraPreset) => void;
  setFollowAgent: (follow: boolean) => void;
  setOrbitSpeed: (speed: number) => void;
  setDampingFactor: (factor: number) => void;
  setFov: (fov: number) => void;
  setMinZoom: (min: number) => void;
  setMaxZoom: (max: number) => void;
  setDebugOverlay: (enabled: boolean) => void;
}

export type { CameraPreset };

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeTab: "agents",
      showMinimap: true,
      showBubbles: true,
      showDebug: false,
      showPOIs: true,
      showLabels: true,
      panelWidth: 360,

      // Camera defaults
      cameraPreset: "custom",
      followAgent: false,
      orbitSpeed: 1.0,
      dampingFactor: 0.1,
      fov: 75,
      minZoom: 10,
      maxZoom: 500,
      debugOverlay: false,

      setActiveTab: (tab: ActiveTab): void => {
        set({ activeTab: tab });
      },

      toggleMinimap: (): void => {
        set((state) => ({ showMinimap: !state.showMinimap }));
      },

      toggleBubbles: (): void => {
        set((state) => ({ showBubbles: !state.showBubbles }));
      },

      toggleDebug: (): void => {
        set((state) => ({ showDebug: !state.showDebug }));
      },

      setShowPOIs: (show: boolean): void => {
        set({ showPOIs: show });
      },

      setShowLabels: (show: boolean): void => {
        set({ showLabels: show });
      },

      setPanelWidth: (width: number): void => {
        set({ panelWidth: width });
      },

      setCameraPreset: (preset: CameraPreset): void => {
        set({ cameraPreset: preset });
      },

      setFollowAgent: (follow: boolean): void => {
        set({ followAgent: follow });
      },

      setOrbitSpeed: (speed: number): void => {
        set({ orbitSpeed: speed });
      },

      setDampingFactor: (factor: number): void => {
        set({ dampingFactor: factor });
      },

      setFov: (fov: number): void => {
        set({ fov });
      },

      setMinZoom: (min: number): void => {
        set({ minZoom: min });
      },

      setMaxZoom: (max: number): void => {
        set({ maxZoom: max });
      },

      setDebugOverlay: (enabled: boolean): void => {
        set({ debugOverlay: enabled });
      },
    }),
    {
      name: "mesasim-ui",
      partialize: (state) => ({
        cameraPreset: state.cameraPreset,
        followAgent: state.followAgent,
        orbitSpeed: state.orbitSpeed,
        dampingFactor: state.dampingFactor,
        fov: state.fov,
        minZoom: state.minZoom,
        maxZoom: state.maxZoom,
        debugOverlay: state.debugOverlay,
        showMinimap: state.showMinimap,
        showBubbles: state.showBubbles,
        showPOIs: state.showPOIs,
        showLabels: state.showLabels,
      }),
    }
  )
);

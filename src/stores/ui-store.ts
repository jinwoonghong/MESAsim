import { create } from "zustand";

type ActiveTab = "agents" | "city" | "settings" | "logs";

interface UIState {
  activeTab: ActiveTab;
  showMinimap: boolean;
  showBubbles: boolean;
  showDebug: boolean;
  panelWidth: number;

  setActiveTab: (tab: ActiveTab) => void;
  toggleMinimap: () => void;
  toggleBubbles: () => void;
  toggleDebug: () => void;
  setPanelWidth: (width: number) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  activeTab: "agents",
  showMinimap: true,
  showBubbles: true,
  showDebug: false,
  panelWidth: 360,

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

  setPanelWidth: (width: number): void => {
    set({ panelWidth: width });
  },
}));

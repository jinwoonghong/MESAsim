import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  geminiApiKey: string;
  geminiModel: string;
  autoSave: boolean;

  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  setAutoSave: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      geminiApiKey: "",
      geminiModel: "gemini-2.0-flash",
      autoSave: true,

      setApiKey: (key: string): void => {
        set({ geminiApiKey: key });
      },

      setModel: (model: string): void => {
        set({ geminiModel: model });
      },

      setAutoSave: (enabled: boolean): void => {
        set({ autoSave: enabled });
      },
    }),
    {
      name: "mesasim-settings",
    }
  )
);

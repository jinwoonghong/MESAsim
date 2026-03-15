"use client";

import { useUIStore } from "@/stores";
import SimulationTab from "./SimulationTab";
import AgentTab from "./AgentTab";
import ApiSettingsTab from "./ApiSettingsTab";
import CameraTab from "./CameraTab";
import WeatherTab from "./WeatherTab";
import VehicleTab from "./VehicleTab";
import SystemTab from "./SystemTab";

type TabId =
  | "agents"
  | "city"
  | "camera"
  | "weather"
  | "vehicles"
  | "settings"
  | "system";

const TABS: { id: TabId; label: string }[] = [
  { id: "agents", label: "Agents" },
  { id: "city", label: "Simulation" },
  { id: "camera", label: "Camera" },
  { id: "weather", label: "Weather" },
  { id: "vehicles", label: "Vehicles" },
  { id: "settings", label: "Settings" },
  { id: "system", label: "System" },
];

export default function ControlPanel(): React.JSX.Element {
  const activeTab = useUIStore((s) => s.activeTab);
  const setActiveTab = useUIStore((s) => s.setActiveTab);

  return (
    <div className="flex h-full w-[360px] flex-col border-l border-gray-800 bg-gray-900">
      {/* Tab bar */}
      <div className="flex border-b border-gray-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-2 py-3 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-blue-500 text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "agents" && <AgentTab />}
        {activeTab === "city" && <SimulationTab />}
        {activeTab === "camera" && <CameraTab />}
        {activeTab === "weather" && <WeatherTab />}
        {activeTab === "vehicles" && <VehicleTab />}
        {activeTab === "settings" && <ApiSettingsTab />}
        {activeTab === "system" && <SystemTab />}
      </div>
    </div>
  );
}

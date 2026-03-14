"use client";

import { useState } from "react";
import { useSettingsStore } from "@/stores";

export default function ApiSettingsTab(): React.JSX.Element {
  const geminiApiKey = useSettingsStore((s) => s.geminiApiKey);
  const setApiKey = useSettingsStore((s) => s.setApiKey);

  const [inputKey, setInputKey] = useState(geminiApiKey);
  const [saved, setSaved] = useState(false);

  function handleSave(): void {
    setApiKey(inputKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const isConfigured = geminiApiKey.length > 0;

  return (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
        API Configuration
      </h3>

      <div className="flex flex-col gap-2">
        <label htmlFor="api-key" className="text-sm text-gray-400">
          Gemini API Key
        </label>
        <input
          id="api-key"
          type="password"
          value={inputKey}
          onChange={(e) => setInputKey(e.target.value)}
          placeholder="Enter your Gemini API key"
          className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <button
        onClick={handleSave}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
      >
        {saved ? "Saved!" : "Save"}
      </button>

      <div className="flex items-center gap-2 text-sm">
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${
            isConfigured ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="text-gray-400">
          {isConfigured ? "API key configured" : "API key not configured"}
        </span>
      </div>
    </div>
  );
}

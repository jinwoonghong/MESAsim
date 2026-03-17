"use client";

import { useCallback, useMemo } from "react";
import { useAgentStore } from "@/stores";
import { useUIStore } from "@/stores/ui-store";
import type { Agent, AgentState } from "@/types";

const STATE_COLORS: Record<AgentState, string> = {
  idle: "bg-green-500",
  moving: "bg-blue-500",
  interacting: "bg-orange-500",
  sleeping: "bg-gray-500",
};

function AgentListItem({
  agent,
  isSelected,
  onSelect,
}: {
  agent: Agent;
  isSelected: boolean;
  onSelect: () => void;
}): React.JSX.Element {
  return (
    <button
      onClick={onSelect}
      className={`w-full rounded border px-3 py-2 text-left transition-colors ${
        isSelected
          ? "border-blue-500 bg-blue-600/30"
          : "border-transparent bg-gray-800 hover:bg-gray-700"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white">{agent.name}</span>
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block h-2 w-2 rounded-full ${STATE_COLORS[agent.state]}`}
            title={agent.state}
          />
          <span className="text-xs capitalize text-gray-400">
            {agent.state}
          </span>
        </div>
      </div>
    </button>
  );
}

function AgentDetail({
  agent,
  onBack,
}: {
  agent: Agent;
  onBack: () => void;
}): React.JSX.Element {
  const personalityEntries = useMemo(
    () => Object.entries(agent.personality) as [string, number][],
    [agent.personality],
  );

  const recentActivities = useMemo(
    () => agent.memory.slice(-5).reverse(),
    [agent.memory],
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Back button */}
      <button
        onClick={onBack}
        className="self-start rounded px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
      >
        &larr; Back to list
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white">{agent.name}</h4>
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block h-2 w-2 rounded-full ${STATE_COLORS[agent.state]}`}
          />
          <span className="text-xs capitalize text-gray-400">
            {agent.state}
          </span>
        </div>
      </div>

      {/* Position and speed */}
      <div className="grid grid-cols-3 gap-2 rounded bg-gray-800 p-3 text-sm">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">X</span>
          <span className="font-mono text-white">
            {agent.position.x.toFixed(1)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Z</span>
          <span className="font-mono text-white">
            {agent.position.z.toFixed(1)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Speed</span>
          <span className="font-mono text-white">
            {agent.speed.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Personality bars */}
      <div className="flex flex-col gap-1">
        <span className="text-xs uppercase text-gray-500">Personality</span>
        {personalityEntries.map(([trait, value]) => (
          <div key={trait} className="flex items-center gap-2">
            <span className="w-28 text-xs capitalize text-gray-400">
              {trait}
            </span>
            <div className="h-1.5 flex-1 rounded-full bg-gray-700">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${value * 100}%` }}
              />
            </div>
            <span className="w-8 text-right text-xs text-gray-500">
              {(value * 100).toFixed(0)}
            </span>
          </div>
        ))}
      </div>

      {/* Recent activities */}
      {recentActivities.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase text-gray-500">
            Recent Activities
          </span>
          {recentActivities.map((mem) => (
            <div
              key={mem.id}
              className="rounded bg-gray-800 px-2 py-1.5 text-xs text-gray-300"
            >
              <span className="text-gray-500">[{mem.type}]</span> {mem.summary}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AgentTab(): React.JSX.Element {
  const agents = useAgentStore((s) => s.agents);
  const selectedAgentId = useAgentStore((s) => s.selectedAgentId);
  const selectAgent = useAgentStore((s) => s.selectAgent);

  const setCameraTarget = useUIStore((s) => s.setCameraTarget);

  const agentList = useMemo(() => Array.from(agents.values()), [agents]);
  const selectedAgent = selectedAgentId
    ? agents.get(selectedAgentId)
    : undefined;

  const handleSelectAgent = useCallback(
    (agent: Agent) => {
      selectAgent(agent.id);
      setCameraTarget({
        x: agent.position.x,
        y: agent.position.y,
        z: agent.position.z,
      });
    },
    [selectAgent, setCameraTarget],
  );

  // Empty state when no agents exist
  if (agentList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="text-sm text-gray-500">
          No agents in simulation. Start the simulation to spawn agents.
        </p>
      </div>
    );
  }

  // Detail view when an agent is selected
  if (selectedAgent) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <AgentDetail
          agent={selectedAgent}
          onBack={() => selectAgent(null)}
        />
      </div>
    );
  }

  // Agent list view
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
          Agents
        </h3>
        <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
          {agentList.length}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        {agentList.map((agent) => (
          <AgentListItem
            key={agent.id}
            agent={agent}
            isSelected={agent.id === selectedAgentId}
            onSelect={() => handleSelectAgent(agent)}
          />
        ))}
      </div>
    </div>
  );
}

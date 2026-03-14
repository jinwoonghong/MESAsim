export type AgentState = "idle" | "moving" | "interacting" | "sleeping";

export interface AgentPersonality {
  openness: number; // 0-1
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface AgentMemory {
  id: string;
  timestamp: number;
  type: "interaction" | "observation" | "decision";
  summary: string;
  involvedAgents: string[];
}

export interface RoutineEntry {
  time: number; // hour (0-23)
  activity: string;
  location?: string;
}

export interface Agent {
  id: string;
  name: string;
  personality: AgentPersonality;
  occupation: string;
  position: { x: number; y: number; z: number };
  destination: { x: number; y: number; z: number } | null;
  currentPath: { x: number; y: number; z: number }[];
  pathIndex: number;
  state: AgentState;
  homeBuilding: string | null;
  memory: AgentMemory[];
  relationships: Record<string, number>;
  dailyRoutine: RoutineEntry[];
  speed: number;
  lastDecisionTime: number;
}

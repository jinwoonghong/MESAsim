export interface GeminiAgentProfile {
  name: string;
  personality: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  occupation: string;
  dailyRoutine: { time: number; activity: string }[];
  backstory: string;
}

export interface GeminiDecision {
  action: "move" | "interact" | "idle" | "go_home";
  destination?: string;
  reason: string;
}

export interface GeminiConversation {
  dialogue: { speaker: string; text: string }[];
  summary: string;
  mood: "positive" | "neutral" | "negative";
}

export interface GeminiRequest {
  type: "generate_agent" | "decide_action" | "conversation";
  context: Record<string, unknown>;
}

export interface GeminiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached: boolean;
}

import type { Agent } from "@/types/agent";
import type { GeminiAgentProfile } from "@/types/gemini";
import { geminiClient } from "@/services/gemini-client";
import { createAgent } from "./agent-core";
import { randomRange } from "@/lib/math";

const KOREAN_NAMES: readonly string[] = [
  "김민수",
  "이지은",
  "박준호",
  "최서연",
  "정도윤",
  "한예린",
  "오승현",
  "강하늘",
  "윤서진",
  "장민영",
  "임재혁",
  "송지현",
  "홍성민",
  "배수아",
  "권태우",
  "조은비",
] as const;

const OCCUPATIONS: readonly string[] = [
  "회사원",
  "대학생",
  "카페 사장",
  "프리랜서",
  "교사",
  "의사",
  "요리사",
  "배달기사",
] as const;

interface RoutineTemplate {
  time: number;
  activity: string;
}

const ROUTINE_TEMPLATES: Record<string, readonly RoutineTemplate[]> = {
  회사원: [
    { time: 7, activity: "기상 및 준비" },
    { time: 8, activity: "출근" },
    { time: 9, activity: "업무 시작" },
    { time: 12, activity: "점심 식사" },
    { time: 13, activity: "오후 업무" },
    { time: 18, activity: "퇴근" },
    { time: 19, activity: "저녁 식사" },
    { time: 22, activity: "귀가 및 취침" },
  ],
  대학생: [
    { time: 8, activity: "기상" },
    { time: 9, activity: "등교" },
    { time: 10, activity: "수업" },
    { time: 12, activity: "점심" },
    { time: 14, activity: "도서관 공부" },
    { time: 17, activity: "카페에서 휴식" },
    { time: 19, activity: "저녁 식사" },
    { time: 23, activity: "취침" },
  ],
  "카페 사장": [
    { time: 6, activity: "기상 및 준비" },
    { time: 7, activity: "카페 오픈 준비" },
    { time: 8, activity: "영업 시작" },
    { time: 12, activity: "점심 교대" },
    { time: 15, activity: "오후 영업" },
    { time: 20, activity: "마감" },
    { time: 21, activity: "저녁 식사" },
    { time: 23, activity: "취침" },
  ],
  프리랜서: [
    { time: 9, activity: "기상" },
    { time: 10, activity: "카페에서 작업" },
    { time: 13, activity: "점심 식사" },
    { time: 14, activity: "작업 계속" },
    { time: 17, activity: "산책" },
    { time: 19, activity: "저녁 식사" },
    { time: 20, activity: "개인 시간" },
    { time: 0, activity: "취침" },
  ],
  교사: [
    { time: 6, activity: "기상" },
    { time: 7, activity: "출근" },
    { time: 8, activity: "수업 준비" },
    { time: 9, activity: "수업" },
    { time: 12, activity: "점심" },
    { time: 13, activity: "오후 수업" },
    { time: 16, activity: "퇴근" },
    { time: 18, activity: "저녁 식사" },
    { time: 22, activity: "취침" },
  ],
  의사: [
    { time: 6, activity: "기상" },
    { time: 7, activity: "출근" },
    { time: 8, activity: "진료 시작" },
    { time: 12, activity: "점심" },
    { time: 13, activity: "오후 진료" },
    { time: 18, activity: "퇴근" },
    { time: 19, activity: "저녁 식사" },
    { time: 22, activity: "취침" },
  ],
  요리사: [
    { time: 8, activity: "기상" },
    { time: 9, activity: "식재료 준비" },
    { time: 11, activity: "점심 영업 준비" },
    { time: 12, activity: "점심 영업" },
    { time: 15, activity: "휴식" },
    { time: 17, activity: "저녁 영업 준비" },
    { time: 18, activity: "저녁 영업" },
    { time: 22, activity: "마감 및 귀가" },
  ],
  배달기사: [
    { time: 8, activity: "기상" },
    { time: 10, activity: "배달 시작" },
    { time: 13, activity: "점심 식사" },
    { time: 14, activity: "오후 배달" },
    { time: 18, activity: "피크 배달" },
    { time: 21, activity: "배달 종료" },
    { time: 22, activity: "귀가 및 휴식" },
    { time: 0, activity: "취침" },
  ],
};

const DEFAULT_ROUTINE: readonly RoutineTemplate[] = [
  { time: 7, activity: "기상" },
  { time: 9, activity: "외출" },
  { time: 12, activity: "점심 식사" },
  { time: 14, activity: "활동" },
  { time: 18, activity: "저녁 식사" },
  { time: 22, activity: "귀가 및 취침" },
];

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRoutineForOccupation(occupation: string): RoutineTemplate[] {
  const template = ROUTINE_TEMPLATES[occupation] ?? DEFAULT_ROUTINE;
  return template.map((entry) => ({ ...entry }));
}

export async function generateAgentViaGemini(
  cityName: string,
): Promise<Agent> {
  const response = await geminiClient.generateAgent(cityName);

  if (response.success && response.data) {
    const startPos = {
      x: randomRange(-50, 50),
      y: 0,
      z: randomRange(-50, 50),
    };
    return createAgent(response.data, null, startPos);
  }

  return generateDefaultAgent();
}

export function generateDefaultAgent(index?: number): Agent {
  const name =
    index !== undefined
      ? KOREAN_NAMES[index % KOREAN_NAMES.length]
      : pickRandom(KOREAN_NAMES);

  const occupation = pickRandom(OCCUPATIONS);

  const profile: GeminiAgentProfile = {
    name,
    personality: {
      openness: randomRange(0.2, 0.8),
      conscientiousness: randomRange(0.2, 0.8),
      extraversion: randomRange(0.2, 0.8),
      agreeableness: randomRange(0.2, 0.8),
      neuroticism: randomRange(0.2, 0.8),
    },
    occupation,
    dailyRoutine: getRoutineForOccupation(occupation),
    backstory: "",
  };

  const startPos = {
    x: randomRange(-50, 50),
    y: 0,
    z: randomRange(-50, 50),
  };

  return createAgent(profile, null, startPos);
}

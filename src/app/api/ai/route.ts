import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Request validation schema
// ---------------------------------------------------------------------------

const GeminiRequestSchema = z.object({
  type: z.enum(["generate_agent", "decide_action", "conversation"]),
  context: z.record(z.string(), z.unknown()),
});

// ---------------------------------------------------------------------------
// In-memory rate limiter (per-process; resets on cold start)
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const RATE_LIMIT_WINDOW_MS = 60_000; // 60 seconds
const RATE_LIMIT_MAX = 30; // max requests per window

const rateLimitMap = new Map<string, RateLimitEntry>();

function isRateLimited(clientId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(clientId);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(clientId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

// ---------------------------------------------------------------------------
// Prompt mapping by request type
// ---------------------------------------------------------------------------

function buildGeminiPrompt(
  type: "generate_agent" | "decide_action" | "conversation",
  context: Record<string, unknown>,
): { systemInstruction: string; userMessage: string } {
  const systemPrompts: Record<string, string> = {
    generate_agent:
      "You are a character designer for a Korean city life simulation. " +
      "Create unique, realistic characters with Korean names. " +
      "Respond ONLY with valid JSON matching the requested schema. No markdown, no explanation.",
    decide_action:
      "You are the AI mind of a character in a city simulation. " +
      "Decide the next action based on personality, environment, and time. " +
      "Respond ONLY with valid JSON matching the requested schema. No markdown, no explanation.",
    conversation:
      "You generate realistic Korean conversations between two simulation characters. " +
      "Respond ONLY with valid JSON matching the requested schema. No markdown, no explanation.",
  };

  const userMessage =
    typeof context.prompt === "string"
      ? context.prompt
      : JSON.stringify(context);

  return {
    systemInstruction: systemPrompts[type],
    userMessage,
  };
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Verify API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "API key not configured", cached: false },
      { status: 401 },
    );
  }

  // 2. Rate limiting (use x-forwarded-for or fallback)
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded", cached: false },
      { status: 429 },
    );
  }

  // 3. Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body", cached: false },
      { status: 400 },
    );
  }

  const parseResult = GeminiRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: `Validation error: ${parseResult.error.issues.map((i) => i.message).join(", ")}`,
        cached: false,
      },
      { status: 400 },
    );
  }

  const { type, context } = parseResult.data;

  // 4. Call Gemini API
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const { systemInstruction, userMessage } = buildGeminiPrompt(type, context);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent(userMessage);
    const responseText = result.response.text();

    // Parse the JSON response from Gemini
    let data: unknown;
    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Gemini returned invalid JSON",
          cached: false,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      data,
      cached: false,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown Gemini API error";
    return NextResponse.json(
      { success: false, error: message, cached: false },
      { status: 500 },
    );
  }
}

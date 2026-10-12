export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server";
import { chatWithDecisionData, suggestQuestions, type ChatMessage } from "@/lib/vertex-ai/chat";

/**
 * POST /api/ai/chat
 * Conversational analytics - chat with decision data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, context, action } = body as {
      messages?: ChatMessage[];
      context: {
        criteria: Array<{ name: string; type: string; weight: number }>;
        alternatives: Array<{ name: string; id: string }>;
        rankings?: Array<{ alternativeId: string; rank: number; score: number }>;
        decisionMatrix?: number[][];
      };
      action?: "chat" | "suggest";
    };

    if (!context) {
      return NextResponse.json({ error: "Missing context parameter" }, { status: 400 });
    }

    if (action === "suggest") {
      const questions = await suggestQuestions(context);
      return NextResponse.json({ questions });
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "Missing messages parameter" }, { status: 400 });
    }

    const response = await chatWithDecisionData(messages, context);

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process chat";
    console.error("AI Chat error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

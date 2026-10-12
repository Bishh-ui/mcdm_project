import { NextRequest, NextResponse } from "next/server";
import { generateHypotheses, validateHypothesis } from "@/lib/vertex-ai/hypothesis";
import type { TopsisResult, Alternative, Criterion } from "@/lib/topsis/types";

/**
 * POST /api/ai/hypotheses
 * Generate optimization hypotheses based on TOPSIS results
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { result, alternatives, criteria, decisionMatrix } = body as {
      result: TopsisResult;
      alternatives: Alternative[];
      criteria: Criterion[];
      decisionMatrix: number[][];
    };

    if (!result || !alternatives || !criteria || !decisionMatrix) {
      return NextResponse.json(
        { error: "Missing required parameters: result, alternatives, criteria, decisionMatrix" },
        { status: 400 }
      );
    }

    const hypotheses = await generateHypotheses(result, alternatives, criteria, decisionMatrix);

    // Validate each hypothesis
    const validatedHypotheses = await Promise.all(
      hypotheses.map((h) => validateHypothesis(h, alternatives, criteria, result))
    );

    return NextResponse.json({
      hypotheses,
      validations: validatedHypotheses,
      count: hypotheses.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate hypotheses";
    console.error("AI Hypotheses error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

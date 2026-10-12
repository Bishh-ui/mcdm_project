export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server";
import { explainRanking, explainComparison, identifyBottleneck } from "@/lib/vertex-ai/explainer";
import type { TopsisResult, Alternative, Criterion } from "@/lib/topsis/types";

/**
 * POST /api/ai/explain
 * Generate natural language explanations for TOPSIS results
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, result, alternatives, criteria, altA, altB, scoresA, scoresB, scores, normalizedScores } = body as {
      type: "ranking" | "comparison" | "bottleneck";
      result?: TopsisResult;
      alternatives?: Alternative[];
      criteria?: Criterion[];
      altA?: Alternative;
      altB?: Alternative;
      scoresA?: number[];
      scoresB?: number[];
      scores?: number[];
      normalizedScores?: number[];
    };

    if (!type) {
      return NextResponse.json({ error: "Missing 'type' parameter" }, { status: 400 });
    }

    let explanation: string;

    switch (type) {
      case "ranking":
        if (!result || !alternatives || !criteria) {
          return NextResponse.json(
            { error: "Missing required parameters for ranking explanation" },
            { status: 400 }
          );
        }
        explanation = await explainRanking(result, alternatives, criteria);
        break;

      case "comparison":
        if (!altA || !altB || !criteria || !scoresA || !scoresB) {
          return NextResponse.json(
            { error: "Missing required parameters for comparison explanation" },
            { status: 400 }
          );
        }
        explanation = await explainComparison(altA, altB, criteria, scoresA, scoresB);
        break;

      case "bottleneck":
        if (!alternatives || !criteria || !scores || !normalizedScores) {
          return NextResponse.json(
            { error: "Missing required parameters for bottleneck identification" },
            { status: 400 }
          );
        }
        explanation = await identifyBottleneck(alternatives[0], criteria, scores, normalizedScores);
        break;

      default:
        return NextResponse.json({ error: "Invalid explanation type" }, { status: 400 });
    }

    return NextResponse.json({ explanation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate explanation";
    console.error("AI Explain error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

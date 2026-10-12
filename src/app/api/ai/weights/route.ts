export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server";
import {
  suggestWeights,
  validateWeightSuggestions,
  normalizeWeightSuggestions,
} from "@/lib/vertex-ai/weights";
import type { Criterion } from "@/lib/topsis/types";

/**
 * POST /api/ai/weights
 * Generate AI-assisted weight suggestions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { criteria, historicalData } = body as {
      criteria: Criterion[];
      historicalData?: {
        experimentResults?: Array<{
          weights: Record<string, number>;
          conversionRate: number;
          revenue: number;
        }>;
        businessGoals?: string[];
      };
    };

    if (!criteria || criteria.length === 0) {
      return NextResponse.json({ error: "Missing criteria parameter" }, { status: 400 });
    }

    let suggestions = await suggestWeights(criteria, historicalData);

    // Validate suggestions
    const validation = validateWeightSuggestions(suggestions, criteria);

    // If invalid, normalize them
    if (!validation.valid) {
      suggestions = normalizeWeightSuggestions(suggestions, criteria);
    }

    return NextResponse.json({
      suggestions,
      validation: {
        valid: validation.valid,
        errors: validation.errors,
        normalized: !validation.valid,
      },
      count: suggestions.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate weight suggestions";
    console.error("AI Weights error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { generateStructuredOutput } from "./client";
import type { Criterion } from "@/lib/topsis/types";

export interface WeightSuggestion {
  criterionId: string;
  criterionName: string;
  currentWeight: number;
  suggestedWeight: number;
  reasoning: string;
  confidence: "low" | "medium" | "high";
  expectedImpact: string;
  dataSupport: string[];
}

/**
 * Generate AI-assisted weight suggestions based on historical performance
 */
export async function suggestWeights(
  criteria: Criterion[],
  historicalData?: {
    experimentResults?: Array<{
      weights: Record<string, number>;
      conversionRate: number;
      revenue: number;
    }>;
    businessGoals?: string[];
  }
): Promise<WeightSuggestion[]> {
  const systemInstruction = `You are a data scientist specializing in multi-criteria optimization and weight tuning.
Your role is to suggest criterion weight adjustments based on business goals and historical performance data.
Be conservative - suggest incremental changes (±10-20%) rather than dramatic shifts.`;

  const criteriaText = criteria
    .map((c) => `- ${c.name}: Current weight ${c.weight} (${c.type})`)
    .join("\n");

  const historyText = historicalData?.experimentResults
    ? `**Historical Experiment Results:**
${historicalData.experimentResults
  .map(
    (exp, i) =>
      `Experiment ${i + 1}: Conversion ${(exp.conversionRate * 100).toFixed(1)}%, Revenue $${exp.revenue.toFixed(0)}, Weights: ${Object.entries(exp.weights)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ")}`
  )
  .join("\n")}`
    : "No historical data available.";

  const goalsText = historicalData?.businessGoals
    ? `**Business Goals:**
${historicalData.businessGoals.map((g) => `- ${g}`).join("\n")}`
    : "No specific business goals provided.";

  const prompt = `Analyze these criteria and suggest weight adjustments:

**Current Criteria:**
${criteriaText}

${historyText}

${goalsText}

Generate 2-4 weight adjustment suggestions that:
1. Align with business goals (if provided)
2. Are informed by historical performance (if available)
3. Make incremental changes (±10-20% of current weight)
4. Maintain total weight sum = 1.0 across all criteria
5. Include clear reasoning and expected impact

For each suggestion:
- Explain why this weight should change
- Cite specific data points if available
- Estimate the expected impact on rankings
- Rate your confidence in the suggestion

Return as JSON array.`;

  const schema = {
    type: "array",
    items: {
      type: "object",
      properties: {
        criterionId: { type: "string" },
        criterionName: { type: "string" },
        currentWeight: { type: "number" },
        suggestedWeight: { type: "number" },
        reasoning: { type: "string" },
        confidence: { type: "string", enum: ["low", "medium", "high"] },
        expectedImpact: { type: "string" },
        dataSupport: { type: "array", items: { type: "string" } },
      },
      required: [
        "criterionId",
        "criterionName",
        "currentWeight",
        "suggestedWeight",
        "reasoning",
        "confidence",
        "expectedImpact",
        "dataSupport",
      ],
    },
  };

  return generateStructuredOutput<WeightSuggestion[]>(prompt, schema, systemInstruction);
}

/**
 * Validate weight suggestions to ensure they're feasible
 */
export function validateWeightSuggestions(
  suggestions: WeightSuggestion[],
  criteria: Criterion[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check that all suggested weights are positive
  for (const suggestion of suggestions) {
    if (suggestion.suggestedWeight <= 0 || suggestion.suggestedWeight > 1) {
      errors.push(
        `${suggestion.criterionName}: Suggested weight ${suggestion.suggestedWeight} is out of valid range (0, 1]`
      );
    }
  }

  // Check that total weight sum is still 1.0 (with tolerance)
  const updatedWeights = criteria.map((c) => {
    const suggestion = suggestions.find((s) => s.criterionId === c.id);
    return suggestion ? suggestion.suggestedWeight : c.weight;
  });

  const totalWeight = updatedWeights.reduce((sum, w) => sum + w, 0);
  if (Math.abs(totalWeight - 1.0) > 0.01) {
    errors.push(
      `Total weight sum ${totalWeight.toFixed(3)} does not equal 1.0. Weights must be normalized.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Normalize weight suggestions to ensure they sum to 1.0
 */
export function normalizeWeightSuggestions(
  suggestions: WeightSuggestion[],
  criteria: Criterion[]
): WeightSuggestion[] {
  const updatedWeights = criteria.map((c) => {
    const suggestion = suggestions.find((s) => s.criterionId === c.id);
    return suggestion ? suggestion.suggestedWeight : c.weight;
  });

  const totalWeight = updatedWeights.reduce((sum, w) => sum + w, 0);

  return suggestions.map((s) => ({
    ...s,
    suggestedWeight: s.suggestedWeight / totalWeight,
  }));
}

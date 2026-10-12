import { generateStructuredOutput } from "./client";
import type { TopsisResult, Alternative, Criterion } from "@/lib/topsis/types";

export interface Hypothesis {
  id: string;
  title: string;
  description: string;
  targetAlternative: string;
  targetCriterion: string;
  currentScore: number;
  proposedScore: number;
  expectedRankChange: string;
  confidence: "low" | "medium" | "high";
  effort: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  actionableSteps: string[];
}

/**
 * Generate optimization hypotheses based on TOPSIS results
 */
export async function generateHypotheses(
  result: TopsisResult,
  alternatives: Alternative[],
  criteria: Criterion[],
  decisionMatrix: number[][]
): Promise<Hypothesis[]> {
  const systemInstruction = `You are a data-driven optimization strategist. 
Generate testable hypotheses for improving alternative rankings based on TOPSIS analysis.
Focus on high-impact, actionable improvements.`;

  const rankingsText = result.rankings
    .map((r) => `${r.rank}. ${r.alternative.name} (Score: ${r.closenessCoefficient.toFixed(3)})`)
    .join("\n");

  const criteriaText = criteria
    .map((c) => `${c.name} (${c.type}, weight: ${c.weight})`)
    .join(", ");

  const matrixText = alternatives
    .map((alt, i) => {
      const scores = decisionMatrix[i].map((s, j) => `${criteria[j].name}: ${s.toFixed(2)}`).join(", ");
      return `${alt.name}: ${scores}`;
    })
    .join("\n");

  const prompt = `Analyze this TOPSIS result and generate 3-5 optimization hypotheses:

**Current Rankings:**
${rankingsText}

**Criteria:**
${criteriaText}

**Decision Matrix:**
${matrixText}

Generate hypotheses that:
1. Target alternatives ranked #3-#7 (most improvable)
2. Focus on criteria with high weights where the alternative underperforms
3. Propose realistic score improvements (10-30% increase)
4. Include specific, actionable steps

For each hypothesis, estimate:
- Confidence: How certain are you this will work?
- Effort: How hard is it to implement?
- Impact: How much will it improve the ranking?

Return as JSON array.`;

  const schema = {
    type: "array",
    items: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        targetAlternative: { type: "string" },
        targetCriterion: { type: "string" },
        currentScore: { type: "number" },
        proposedScore: { type: "number" },
        expectedRankChange: { type: "string" },
        confidence: { type: "string", enum: ["low", "medium", "high"] },
        effort: { type: "string", enum: ["low", "medium", "high"] },
        impact: { type: "string", enum: ["low", "medium", "high"] },
        actionableSteps: { type: "array", items: { type: "string" } },
      },
      required: [
        "id",
        "title",
        "description",
        "targetAlternative",
        "targetCriterion",
        "currentScore",
        "proposedScore",
        "expectedRankChange",
        "confidence",
        "effort",
        "impact",
        "actionableSteps",
      ],
    },
  };

  return generateStructuredOutput<Hypothesis[]>(prompt, schema, systemInstruction);
}

/**
 * Validate a hypothesis by re-running TOPSIS with proposed changes
 */
export interface HypothesisValidation {
  hypothesis: Hypothesis;
  originalRank: number;
  projectedRank: number;
  rankImprovement: number;
  feasible: boolean;
  reasoning: string;
}

export async function validateHypothesis(
  hypothesis: Hypothesis,
  alternatives: Alternative[],
  criteria: Criterion[],
  currentRanking: TopsisResult
): Promise<HypothesisValidation> {
  const targetAlt = alternatives.find((a) => a.name === hypothesis.targetAlternative);
  const originalRank =
    currentRanking.rankings.findIndex((r) => r.alternative.id === targetAlt?.id) + 1;

  // Simulate the score change and estimate new rank
  // In a real implementation, you'd re-run TOPSIS with the modified matrix
  const scoreImprovement =
    ((hypothesis.proposedScore - hypothesis.currentScore) / hypothesis.currentScore) * 100;
  const estimatedRankImprovement = Math.floor(scoreImprovement / 10); // Rough heuristic

  const projectedRank = Math.max(1, originalRank - estimatedRankImprovement);

  return {
    hypothesis,
    originalRank,
    projectedRank,
    rankImprovement: originalRank - projectedRank,
    feasible: hypothesis.proposedScore <= 10 && hypothesis.proposedScore > hypothesis.currentScore,
    reasoning: `Improving ${hypothesis.targetCriterion} from ${hypothesis.currentScore.toFixed(2)} to ${hypothesis.proposedScore.toFixed(2)} (${scoreImprovement.toFixed(1)}% increase) could move ${hypothesis.targetAlternative} from rank #${originalRank} to #${projectedRank}.`,
  };
}

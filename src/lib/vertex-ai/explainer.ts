import { generateText } from "./client";
import type { TopsisResult, Alternative, Criterion } from "@/lib/topsis/types";

/**
 * Generate natural language explanation for a TOPSIS ranking
 */
export async function explainRanking(
  result: TopsisResult,
  alternatives: Alternative[],
  criteria: Criterion[]
): Promise<string> {
  const systemInstruction = `You are an expert in multi-criteria decision analysis (MCDM) and TOPSIS methodology. 
Your role is to explain TOPSIS rankings in clear, business-friendly language that non-technical stakeholders can understand.
Focus on the "why" behind rankings, not just the "what".`;

  const prompt = `Explain this TOPSIS ranking result in natural language:

**Ranked Alternatives:**
${result.rankings.map((r, i) => `${i + 1}. ${r.alternative.name} (Score: ${r.closenessCoefficient.toFixed(3)})`).join("\n")}

**Criteria Used:**
${criteria.map((c) => `- ${c.name} (${c.type === "benefit" ? "Higher is better" : "Lower is better"}, Weight: ${c.weight})`).join("\n")}

**Distance from Ideal:**
${result.rankings.map((r) => `- ${r.alternative.name}: ${r.distanceFromIdeal.toFixed(3)} from ideal, ${r.distanceFromAntiIdeal.toFixed(3)} from anti-ideal`).join("\n")}

Provide a 2-3 paragraph explanation that:
1. Summarizes the top 3 ranked alternatives and why they ranked where they did
2. Identifies which criteria had the most influence on the rankings
3. Highlights any surprising results or close competitions

Write in a professional but conversational tone. Avoid jargon.`;

  return generateText(prompt, systemInstruction, 0.7);
}

/**
 * Explain why Alternative X ranked above/below Alternative Y
 */
export async function explainComparison(
  altA: Alternative,
  altB: Alternative,
  criteria: Criterion[],
  scoresA: number[],
  scoresB: number[]
): Promise<string> {
  const systemInstruction = `You are an expert in multi-criteria decision analysis. 
Explain ranking differences by decomposing criterion-by-criterion contributions.`;

  const criteriaComparison = criteria
    .map((c, i) => {
      const direction = c.type === "benefit" ? "higher" : "lower";
      return `- ${c.name}: ${altA.name} scored ${scoresA[i].toFixed(2)} vs ${altB.name}'s ${scoresB[i].toFixed(2)} (${direction} is better, weight: ${c.weight})`;
    })
    .join("\n");

  const prompt = `Compare these two alternatives and explain why one ranked higher:

**Alternative A:** ${altA.name}
**Alternative B:** ${altB.name}

**Criterion-by-Criterion Scores:**
${criteriaComparison}

Explain in 1-2 paragraphs:
1. Which criteria favored Alternative A vs Alternative B
2. How the weights amplified or dampened those differences
3. The overall reason for the ranking difference

Be specific and quantitative.`;

  return generateText(prompt, systemInstruction, 0.5);
}

/**
 * Identify the bottleneck criterion for an alternative
 */
export async function identifyBottleneck(
  alternative: Alternative,
  criteria: Criterion[],
  scores: number[],
  normalizedScores: number[]
): Promise<string> {
  const systemInstruction = `You are a business analyst specializing in optimization. 
Identify the weakest criterion holding back an alternative's ranking.`;

  const criteriaBreakdown = criteria
    .map((c, i) => `- ${c.name}: Raw ${scores[i].toFixed(2)}, Normalized ${normalizedScores[i].toFixed(3)} (Weight: ${c.weight})`)
    .join("\n");

  const prompt = `Analyze this alternative's performance and identify its bottleneck:

**Alternative:** ${alternative.name}

**Performance Across Criteria:**
${criteriaBreakdown}

Identify:
1. Which criterion is the weakest link (lowest normalized score for benefit criteria, highest for cost criteria)
2. How much improving that criterion would impact the overall ranking
3. A specific, actionable recommendation to address the bottleneck

Be concise and actionable.`;

  return generateText(prompt, systemInstruction, 0.6);
}

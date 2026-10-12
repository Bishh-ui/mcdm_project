import { chat } from "./client";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

/**
 * Chat with decision data - grounded in actual TOPSIS results
 */
export async function chatWithDecisionData(
  messages: ChatMessage[],
  context: {
    criteria: Array<{ name: string; type: string; weight: number }>;
    alternatives: Array<{ name: string; id: string }>;
    rankings?: Array<{ alternativeId: string; rank: number; score: number }>;
    decisionMatrix?: number[][];
  }
): Promise<string> {
  const systemInstruction = `You are an AI assistant specialized in multi-criteria decision analysis (MCDM) and TOPSIS methodology.

You have access to the following decision context:

**Criteria:**
${context.criteria.map((c) => `- ${c.name} (${c.type}, weight: ${c.weight})`).join("\n")}

**Alternatives:**
${context.alternatives.map((a) => `- ${a.name} (ID: ${a.id})`).join("\n")}

${
  context.rankings
    ? `**Current Rankings:**
${context.rankings.map((r) => `${r.rank}. ${context.alternatives.find((a) => a.id === r.alternativeId)?.name} (Score: ${r.score.toFixed(3)})`).join("\n")}`
    : ""
}

${
  context.decisionMatrix
    ? `**Decision Matrix:**
${context.alternatives.map((alt, i) => `${alt.name}: ${context.decisionMatrix![i].map((s, j) => `${context.criteria[j].name}=${s.toFixed(2)}`).join(", ")}`).join("\n")}`
    : ""
}

**Your role:**
- Answer questions about the decision data accurately
- Explain rankings, scores, and criterion contributions
- Suggest optimizations based on the data
- Never hallucinate data - only use what's provided above
- If you don't have enough information, say so clearly

**Rules:**
- Be concise and direct
- Use specific numbers from the data
- Explain technical concepts in business-friendly language
- When suggesting changes, be realistic and actionable`;

  const formattedMessages = messages.map((msg) => ({
    role: msg.role === "assistant" ? ("model" as const) : ("user" as const),
    content: msg.content,
  }));

  return chat(formattedMessages, systemInstruction);
}

/**
 * Generate suggested questions based on current context
 */
export async function suggestQuestions(context: {
  criteria: Array<{ name: string; type: string; weight: number }>;
  alternatives: Array<{ name: string }>;
  rankings?: Array<{ alternativeId: string; rank: number }>;
}): Promise<string[]> {
  const hasRankings = context.rankings && context.rankings.length > 0;

  const baseQuestions = [
    "What criteria have the highest weights?",
    "Which alternatives are being compared?",
    "How does the TOPSIS algorithm work?",
  ];

  const rankingQuestions = hasRankings
    ? [
        "Why did the top-ranked alternative win?",
        "What's holding back the #3 ranked alternative?",
        "Which criterion has the most influence on rankings?",
        "How can I improve the ranking of a specific alternative?",
      ]
    : [];

  return [...baseQuestions, ...rankingQuestions].slice(0, 5);
}

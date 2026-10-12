/** A single competitor in the matrix */
export interface Competitor {
  id: string;
  name: string;
}

/** A capability being evaluated */
export interface Capability {
  id: string;
  name: string;
  category: string;
}

/** Score for a specific competitor × capability cell */
export interface MatrixScore {
  competitorId: string;
  capabilityId: string;
  score: number; // 1-5
}

/** Full competitor matrix state */
export interface CompetitorMatrix {
  competitors: Competitor[];
  capabilities: Capability[];
  scores: MatrixScore[];
  updatedAt: string;
}

export const DEFAULT_COMPETITORS: Competitor[] = [
  { id: "optimizely", name: "Optimizely" },
  { id: "dynamic-yield", name: "Dynamic Yield" },
  { id: "vwo", name: "VWO" },
  { id: "ab-tasty", name: "AB Tasty" },
  { id: "statsig", name: "Statsig" },
  { id: "nosto", name: "Nosto" },
  { id: "bloomreach", name: "Bloomreach" },
  { id: "mcdm-ours", name: "MCDM (Ours)" },
];

export const DEFAULT_CAPABILITIES: Capability[] = [
  { id: "multi-criteria-ranking", name: "Multi-Criteria Ranking", category: "Decision Engine" },
  { id: "explainability", name: "Decision Explainability", category: "Decision Engine" },
  { id: "audit-trail", name: "Audit Trail & Governance", category: "Decision Engine" },
  { id: "sensitivity-analysis", name: "Sensitivity Analysis", category: "Decision Engine" },
  { id: "ab-testing", name: "A/B Testing", category: "Experimentation" },
  { id: "feature-flags", name: "Feature Flags", category: "Experimentation" },
  { id: "personalization", name: "Personalization", category: "Personalization" },
  { id: "product-recs", name: "Product Recommendations", category: "Personalization" },
  { id: "ai-insights", name: "AI/ML Insights", category: "AI" },
  { id: "natural-language", name: "Natural Language Queries", category: "AI" },
  { id: "india-compliance", name: "India DPDP Compliance", category: "Compliance" },
  { id: "real-time-data", name: "Real-Time Data Pipeline", category: "Infrastructure" },
  { id: "platform-integrations", name: "Commerce Platform Integrations", category: "Infrastructure" },
  { id: "pricing-accessibility", name: "Mid-Market Pricing", category: "Commercial" },
];

/** Color for heatmap cells based on 1-5 score */
export function getScoreColor(score: number): string {
  switch (score) {
    case 1: return "bg-red-500/30 text-red-200";
    case 2: return "bg-orange-500/30 text-orange-200";
    case 3: return "bg-amber-500/30 text-amber-200";
    case 4: return "bg-lime-500/30 text-lime-200";
    case 5: return "bg-emerald-500/30 text-emerald-200";
    default: return "bg-white/5 text-[var(--muted)]";
  }
}

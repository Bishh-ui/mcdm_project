/** Criterion type: benefit (higher is better) or cost (lower is better) */
export type CriterionType = "benefit" | "cost";

/** Normalization method for the decision matrix */
export type NormalizationMethod = "vector" | "min-max" | "max";

/** Tie-break policy when closeness coefficients are equal */
export type TieBreakPolicy = "favor-first" | "favor-last" | "average-rank";

/** Category for organizing criteria */
export type CriterionCategory =
  | "business-impact"
  | "ux-quality"
  | "performance"
  | "trust-compliance"
  | "personalization-fit";

/** A single criterion definition */
export interface Criterion {
  id: string;
  name: string;
  category: CriterionCategory;
  type: CriterionType;
  weight: number;
  description: string;
}

/** TOPSIS policy configuration */
export interface TopsisPolicy {
  id: string;
  name: string;
  normalization: NormalizationMethod;
  tieBreak: TieBreakPolicy;
  rankStabilityThreshold: number;
  createdAt: string;
  updatedAt: string;
}

/** An alternative (product/option) being evaluated */
export interface Alternative {
  id: string;
  name: string;
  values: number[];
}

/** Input to the TOPSIS engine */
export interface TopsisInput {
  criteria: Criterion[];
  alternatives: Alternative[];
  policy: TopsisPolicy;
}

/** Step-by-step TOPSIS calculation result */
export interface TopsisSteps {
  /** Raw decision matrix [alternatives × criteria] */
  decisionMatrix: number[][];
  /** Normalized decision matrix */
  normalizedMatrix: number[][];
  /** Weighted normalized matrix */
  weightedMatrix: number[][];
  /** Ideal solution (best value per criterion) */
  idealSolution: number[];
  /** Anti-ideal solution (worst value per criterion) */
  antiIdealSolution: number[];
  /** Distance of each alternative from ideal */
  distancesFromIdeal: number[];
  /** Distance of each alternative from anti-ideal */
  distancesFromAntiIdeal: number[];
  /** Closeness coefficient for each alternative (0-1) */
  closenessCoefficients: number[];
}

/** A single ranked result */
export interface RankedAlternative {
  alternative: Alternative;
  rank: number;
  closenessCoefficient: number;
  distanceFromIdeal: number;
  distanceFromAntiIdeal: number;
}

/** Full TOPSIS output */
export interface TopsisResult {
  rankings: RankedAlternative[];
  steps: TopsisSteps;
  policy: TopsisPolicy;
  criteria: Criterion[];
  computedAt: string;
}

/** Category metadata for display */
export const CRITERION_CATEGORIES: Record<
  CriterionCategory,
  { label: string; color: string }
> = {
  "business-impact": { label: "Business Impact", color: "#35d0ff" },
  "ux-quality": { label: "UX Quality", color: "#8af26b" },
  performance: { label: "Performance", color: "#ffbe5b" },
  "trust-compliance": { label: "Trust & Compliance", color: "#f472b6" },
  "personalization-fit": { label: "Personalization Fit", color: "#a78bfa" },
};

import type {
  Criterion,
  Alternative,
  TopsisInput,
  TopsisResult,
  TopsisSteps,
  RankedAlternative,
  NormalizationMethod,
  TieBreakPolicy,
} from "./types";

/**
 * Pure TypeScript TOPSIS engine. Zero external dependencies.
 * Deterministic: same inputs always produce same outputs.
 */

// ── Normalization ──────────────────────────────────────────────

function normalizeVector(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result: number[][] = Array.from({ length: rows }, () =>
    new Array(cols).fill(0)
  );

  for (let j = 0; j < cols; j++) {
    let sumSq = 0;
    for (let i = 0; i < rows; i++) {
      sumSq += matrix[i][j] * matrix[i][j];
    }
    const norm = Math.sqrt(sumSq);
    if (norm === 0) continue;
    for (let i = 0; i < rows; i++) {
      result[i][j] = matrix[i][j] / norm;
    }
  }

  return result;
}

function normalizeMinMax(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result: number[][] = Array.from({ length: rows }, () =>
    new Array(cols).fill(0)
  );

  for (let j = 0; j < cols; j++) {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < rows; i++) {
      if (matrix[i][j] < min) min = matrix[i][j];
      if (matrix[i][j] > max) max = matrix[i][j];
    }
    const range = max - min;
    if (range === 0) continue;
    for (let i = 0; i < rows; i++) {
      result[i][j] = (matrix[i][j] - min) / range;
    }
  }

  return result;
}

function normalizeMax(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result: number[][] = Array.from({ length: rows }, () =>
    new Array(cols).fill(0)
  );

  for (let j = 0; j < cols; j++) {
    let max = -Infinity;
    for (let i = 0; i < rows; i++) {
      if (matrix[i][j] > max) max = matrix[i][j];
    }
    if (max === 0) continue;
    for (let i = 0; i < rows; i++) {
      result[i][j] = matrix[i][j] / max;
    }
  }

  return result;
}

function normalize(
  matrix: number[][],
  method: NormalizationMethod
): number[][] {
  switch (method) {
    case "vector":
      return normalizeVector(matrix);
    case "min-max":
      return normalizeMinMax(matrix);
    case "max":
      return normalizeMax(matrix);
  }
}

// ── Weighting ──────────────────────────────────────────────────

function applyWeights(
  normalizedMatrix: number[][],
  weights: number[]
): number[][] {
  return normalizedMatrix.map((row) => row.map((val, j) => val * weights[j]));
}

// ── Ideal / Anti-Ideal ─────────────────────────────────────────

function computeIdealSolutions(
  weightedMatrix: number[][],
  criteria: Criterion[]
): { ideal: number[]; antiIdeal: number[] } {
  const cols = criteria.length;
  const ideal: number[] = new Array(cols).fill(0);
  const antiIdeal: number[] = new Array(cols).fill(0);

  for (let j = 0; j < cols; j++) {
    const columnValues = weightedMatrix.map((row) => row[j]);
    if (criteria[j].type === "benefit") {
      ideal[j] = Math.max(...columnValues);
      antiIdeal[j] = Math.min(...columnValues);
    } else {
      ideal[j] = Math.min(...columnValues);
      antiIdeal[j] = Math.max(...columnValues);
    }
  }

  return { ideal, antiIdeal };
}

// ── Distance Calculation ───────────────────────────────────────

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) * (a[i] - b[i]);
  }
  return Math.sqrt(sum);
}

function computeDistances(
  weightedMatrix: number[][],
  ideal: number[],
  antiIdeal: number[]
): { fromIdeal: number[]; fromAntiIdeal: number[] } {
  const fromIdeal = weightedMatrix.map((row) => euclideanDistance(row, ideal));
  const fromAntiIdeal = weightedMatrix.map((row) =>
    euclideanDistance(row, antiIdeal)
  );
  return { fromIdeal, fromAntiIdeal };
}

// ── Closeness Coefficients ─────────────────────────────────────

function computeClosenessCoefficients(
  fromIdeal: number[],
  fromAntiIdeal: number[]
): number[] {
  return fromIdeal.map((dPlus, i) => {
    const dMinus = fromAntiIdeal[i];
    const total = dPlus + dMinus;
    if (total === 0) return 0;
    return dMinus / total;
  });
}

// ── Ranking ────────────────────────────────────────────────────

function rankAlternatives(
  alternatives: Alternative[],
  closenessCoefficients: number[],
  fromIdeal: number[],
  fromAntiIdeal: number[],
  tieBreak: TieBreakPolicy
): RankedAlternative[] {
  const indexed = alternatives.map((alt, i) => ({
    alternative: alt,
    closenessCoefficient: closenessCoefficients[i],
    distanceFromIdeal: fromIdeal[i],
    distanceFromAntiIdeal: fromAntiIdeal[i],
    originalIndex: i,
  }));

  indexed.sort((a, b) => {
    const diff = b.closenessCoefficient - a.closenessCoefficient;
    if (Math.abs(diff) > 1e-10) return diff;

    // Tie-break
    switch (tieBreak) {
      case "favor-first":
        return a.originalIndex - b.originalIndex;
      case "favor-last":
        return b.originalIndex - a.originalIndex;
      case "average-rank":
        return 0; // Stable sort preserves order
    }
  });

  return indexed.map((item, i) => ({
    alternative: item.alternative,
    rank: i + 1,
    closenessCoefficient: item.closenessCoefficient,
    distanceFromIdeal: item.distanceFromIdeal,
    distanceFromAntiIdeal: item.distanceFromAntiIdeal,
  }));
}

// ── Main Engine ────────────────────────────────────────────────

export function runTopsis(input: TopsisInput): TopsisResult {
  const { criteria, alternatives, policy } = input;

  if (alternatives.length === 0) {
    throw new Error("At least one alternative is required");
  }
  if (criteria.length === 0) {
    throw new Error("At least one criterion is required");
  }

  // Validate weights sum to ~1
  const weightSum = criteria.reduce((sum, c) => sum + c.weight, 0);
  if (Math.abs(weightSum - 1) > 0.01) {
    throw new Error(
      `Weights must sum to 1.0 (current sum: ${weightSum.toFixed(4)})`
    );
  }

  // Validate matrix dimensions
  for (const alt of alternatives) {
    if (alt.values.length !== criteria.length) {
      throw new Error(
        `Alternative "${alt.name}" has ${alt.values.length} values but ${criteria.length} criteria defined`
      );
    }
  }

  // Step 1: Build decision matrix
  const decisionMatrix = alternatives.map((alt) => [...alt.values]);

  // Step 2: Normalize
  const normalizedMatrix = normalize(decisionMatrix, policy.normalization);

  // Step 3: Apply weights
  const weights = criteria.map((c) => c.weight);
  const weightedMatrix = applyWeights(normalizedMatrix, weights);

  // Step 4: Ideal and anti-ideal solutions
  const { ideal, antiIdeal } = computeIdealSolutions(weightedMatrix, criteria);

  // Step 5: Distances
  const { fromIdeal, fromAntiIdeal } = computeDistances(
    weightedMatrix,
    ideal,
    antiIdeal
  );

  // Step 6: Closeness coefficients
  const closenessCoefficients = computeClosenessCoefficients(
    fromIdeal,
    fromAntiIdeal
  );

  // Step 7: Rank
  const rankings = rankAlternatives(
    alternatives,
    closenessCoefficients,
    fromIdeal,
    fromAntiIdeal,
    policy.tieBreak
  );

  const steps: TopsisSteps = {
    decisionMatrix,
    normalizedMatrix,
    weightedMatrix,
    idealSolution: ideal,
    antiIdealSolution: antiIdeal,
    distancesFromIdeal: fromIdeal,
    distancesFromAntiIdeal: fromAntiIdeal,
    closenessCoefficients,
  };

  return {
    rankings,
    steps,
    policy,
    criteria,
    computedAt: new Date().toISOString(),
  };
}

// ── Sensitivity Analysis ───────────────────────────────────────

export interface SensitivityResult {
  criterionId: string;
  criterionName: string;
  perturbation: number;
  originalRankings: RankedAlternative[];
  perturbedRankings: RankedAlternative[];
  rankReversals: Array<{
    alternative: string;
    originalRank: number;
    newRank: number;
  }>;
  isStable: boolean;
}

export function runSensitivityAnalysis(
  input: TopsisInput,
  perturbationPercent: number = 10
): SensitivityResult[] {
  const baseResult = runTopsis(input);
  const results: SensitivityResult[] = [];
  const perturbation = perturbationPercent / 100;

  for (const criterion of input.criteria) {
    // Increase this criterion's weight, proportionally decrease others
    const newCriteria = input.criteria.map((c) => {
      if (c.id === criterion.id) {
        return { ...c, weight: Math.min(c.weight * (1 + perturbation), 0.99) };
      }
      return { ...c };
    });

    // Re-normalize weights to sum to 1
    const totalWeight = newCriteria.reduce((s, c) => s + c.weight, 0);
    const normalizedCriteria = newCriteria.map((c) => ({
      ...c,
      weight: c.weight / totalWeight,
    }));

    const perturbedResult = runTopsis({
      ...input,
      criteria: normalizedCriteria,
    });

    const reversals: SensitivityResult["rankReversals"] = [];
    for (const original of baseResult.rankings) {
      const perturbed = perturbedResult.rankings.find(
        (r) => r.alternative.id === original.alternative.id
      );
      if (perturbed && perturbed.rank !== original.rank) {
        reversals.push({
          alternative: original.alternative.name,
          originalRank: original.rank,
          newRank: perturbed.rank,
        });
      }
    }

    results.push({
      criterionId: criterion.id,
      criterionName: criterion.name,
      perturbation: perturbationPercent,
      originalRankings: baseResult.rankings,
      perturbedRankings: perturbedResult.rankings,
      rankReversals: reversals,
      isStable: reversals.length === 0,
    });
  }

  return results;
}

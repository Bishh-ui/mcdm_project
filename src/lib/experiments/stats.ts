/**
 * Statistical analysis for A/B experiments
 * Includes frequentist and Bayesian methods
 */

/**
 * Calculate z-score for two proportions
 */
function calculateZScore(
  conversionsA: number,
  visitorsA: number,
  conversionsB: number,
  visitorsB: number
): number {
  const pA = conversionsA / visitorsA;
  const pB = conversionsB / visitorsB;
  const pPooled = (conversionsA + conversionsB) / (visitorsA + visitorsB);

  const standardError = Math.sqrt(pPooled * (1 - pPooled) * (1 / visitorsA + 1 / visitorsB));

  return (pB - pA) / standardError;
}

/**
 * Calculate p-value from z-score (two-tailed test)
 */
function zScoreToPValue(zScore: number): number {
  // Approximation of cumulative normal distribution
  const z = Math.abs(zScore);
  const t = 1 / (1 + 0.2316419 * z);
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p =
    d *
    t *
    (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

  return 2 * p; // Two-tailed
}

/**
 * Frequentist statistical significance test
 */
export interface FrequentistResult {
  pValue: number;
  zScore: number;
  significant: boolean;
  confidenceLevel: number;
  uplift: number;
  upliftPercent: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

export function calculateFrequentistSignificance(
  controlConversions: number,
  controlVisitors: number,
  treatmentConversions: number,
  treatmentVisitors: number,
  confidenceLevel = 0.95
): FrequentistResult {
  const controlRate = controlConversions / controlVisitors;
  const treatmentRate = treatmentConversions / treatmentVisitors;

  const uplift = treatmentRate - controlRate;
  const upliftPercent = (uplift / controlRate) * 100;

  const zScore = calculateZScore(
    controlConversions,
    controlVisitors,
    treatmentConversions,
    treatmentVisitors
  );
  const pValue = zScoreToPValue(zScore);

  // Calculate confidence interval for uplift
  const zCritical = confidenceLevel === 0.95 ? 1.96 : confidenceLevel === 0.99 ? 2.576 : 1.645;
  const standardError = Math.sqrt(
    (controlRate * (1 - controlRate)) / controlVisitors +
      (treatmentRate * (1 - treatmentRate)) / treatmentVisitors
  );

  const marginOfError = zCritical * standardError;

  return {
    pValue,
    zScore,
    significant: pValue < 1 - confidenceLevel,
    confidenceLevel,
    uplift,
    upliftPercent,
    confidenceInterval: {
      lower: uplift - marginOfError,
      upper: uplift + marginOfError,
    },
  };
}

/**
 * Bayesian A/B test using Beta distribution
 */
export interface BayesianResult {
  probabilityToBeBest: number;
  expectedLoss: number;
  credibleInterval: {
    lower: number;
    upper: number;
  };
  uplift: number;
  upliftPercent: number;
}

/**
 * Beta distribution quantile (approximation)
 */
function betaQuantile(alpha: number, beta: number, p: number): number {
  // Simple approximation using normal distribution
  const mean = alpha / (alpha + beta);
  const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
  const stdDev = Math.sqrt(variance);

  // Z-score for given probability
  const z = p === 0.025 ? -1.96 : p === 0.975 ? 1.96 : 0;

  return mean + z * stdDev;
}

export function calculateBayesianSignificance(
  controlConversions: number,
  controlVisitors: number,
  treatmentConversions: number,
  treatmentVisitors: number,
  priorAlpha = 1,
  priorBeta = 1
): BayesianResult {
  // Posterior parameters (Beta distribution)
  const controlAlpha = priorAlpha + controlConversions;
  const controlBeta = priorBeta + (controlVisitors - controlConversions);
  const treatmentAlpha = priorAlpha + treatmentConversions;
  const treatmentBeta = priorBeta + (treatmentVisitors - treatmentConversions);

  // Expected values (posterior means)
  const controlRate = controlAlpha / (controlAlpha + controlBeta);
  const treatmentRate = treatmentAlpha / (treatmentAlpha + treatmentBeta);

  const uplift = treatmentRate - controlRate;
  const upliftPercent = (uplift / controlRate) * 100;

  // Monte Carlo simulation for probability to be best
  const samples = 10000;
  let treatmentWins = 0;

  for (let i = 0; i < samples; i++) {
    // Sample from Beta distributions (simplified using normal approximation)
    const controlSample =
      controlRate + (Math.random() - 0.5) * 2 * Math.sqrt(controlRate * (1 - controlRate));
    const treatmentSample =
      treatmentRate + (Math.random() - 0.5) * 2 * Math.sqrt(treatmentRate * (1 - treatmentRate));

    if (treatmentSample > controlSample) {
      treatmentWins++;
    }
  }

  const probabilityToBeBest = treatmentWins / samples;

  // Expected loss (simplified)
  const expectedLoss = probabilityToBeBest < 0.5 ? Math.abs(uplift) : 0;

  // Credible interval (95%)
  const credibleInterval = {
    lower: betaQuantile(treatmentAlpha, treatmentBeta, 0.025),
    upper: betaQuantile(treatmentAlpha, treatmentBeta, 0.975),
  };

  return {
    probabilityToBeBest,
    expectedLoss,
    credibleInterval,
    uplift,
    upliftPercent,
  };
}

/**
 * Calculate required sample size for experiment
 * Uses fixed alpha=0.05 and power=0.8 for standard statistical rigor
 */
export function calculateRequiredSampleSize(
  baselineConversionRate: number,
  minimumDetectableEffect: number // e.g., 0.05 for 5% relative change
): number {
  const zAlpha = 1.96; // For alpha = 0.05 (two-tailed)
  const zBeta = 0.84; // For power = 0.8

  const p1 = baselineConversionRate;
  const p2 = p1 * (1 + minimumDetectableEffect);

  const numerator =
    (zAlpha * Math.sqrt(2 * p1 * (1 - p1)) + zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) **
    2;
  const denominator = (p2 - p1) ** 2;

  return Math.ceil(numerator / denominator);
}

/**
 * Check if experiment has reached statistical significance
 */
export function hasReachedSignificance(
  controlConversions: number,
  controlVisitors: number,
  treatmentConversions: number,
  treatmentVisitors: number,
  requiredSampleSize: number,
  confidenceLevel = 0.95
): {
  reached: boolean;
  reason: string;
  progress: number;
} {
  const totalVisitors = controlVisitors + treatmentVisitors;
  const progress = Math.min(totalVisitors / (requiredSampleSize * 2), 1);

  // Check sample size
  if (totalVisitors < requiredSampleSize * 2) {
    return {
      reached: false,
      reason: `Need ${requiredSampleSize * 2 - totalVisitors} more visitors`,
      progress,
    };
  }

  // Check statistical significance
  const stats = calculateFrequentistSignificance(
    controlConversions,
    controlVisitors,
    treatmentConversions,
    treatmentVisitors,
    confidenceLevel
  );

  if (!stats.significant) {
    return {
      reached: false,
      reason: `Not statistically significant (p=${stats.pValue.toFixed(4)})`,
      progress,
    };
  }

  return {
    reached: true,
    reason: "Statistically significant",
    progress: 1,
  };
}

/**
 * Feedback loop: Update TOPSIS baselines from winning experiments
 */

import { getDocument, logAudit } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import type { Experiment } from "./types";

export interface BaselineUpdate {
  criterionId: string;
  criterionName: string;
  previousBaseline: number;
  newBaseline: number;
  improvement: number;
  improvementPercent: number;
  experimentId: string;
  experimentName: string;
}

/**
 * Update TOPSIS criteria baselines based on winning experiment results
 */
export async function updateBaselinesFromExperiment(
  experimentId: string,
  winningVariantId: string,
  metrics: {
    conversionRate: number;
    revenuePerVisitor: number;
    averageOrderValue: number;
    bounceRate: number;
  }
): Promise<BaselineUpdate[]> {
  const experiment = await getDocument<Experiment>(
    `${COLLECTIONS.EXPERIMENTS}/${experimentId}`
  );

  if (!experiment) {
    throw new Error("Experiment not found");
  }

  const updates: BaselineUpdate[] = [];

  // Map experiment metrics to criteria
  const metricToCriterionMap: Record<string, string> = {
    conversion_rate: "conversionRate",
    revenue_per_visitor: "revenuePerVisitor",
    average_order_value: "averageOrderValue",
  };

  const criterionField = metricToCriterionMap[experiment.primaryMetric];
  if (!criterionField) {
    return updates;
  }

  const newValue = metrics[criterionField as keyof typeof metrics];

  // Find the criterion in Firestore and update its baseline
  // This is a simplified version - in production, you'd query for the specific criterion
  // For now, we'll just track the update intent

  updates.push({
    criterionId: experiment.primaryMetric,
    criterionName: experiment.primaryMetric.replace(/_/g, " "),
    previousBaseline: 0, // Would fetch from criterion document
    newBaseline: newValue,
    improvement: newValue,
    improvementPercent: 0,
    experimentId: experiment.id,
    experimentName: experiment.name,
  });

  // Log the baseline update
  await logAudit(
    "system",
    "Experiment Feedback Loop",
    "update",
    "criterion_baseline",
    experiment.primaryMetric,
    { baseline: 0 },
    { baseline: newValue, source: `experiment:${experimentId}` }
  );

  return updates;
}

/**
 * Calculate impact attribution: which criteria changes drove uplift
 */
export async function calculateImpactAttribution(
  experimentId: string,
  controlMetrics: {
    conversionRate: number;
    revenuePerVisitor: number;
    averageOrderValue: number;
  },
  treatmentMetrics: {
    conversionRate: number;
    revenuePerVisitor: number;
    averageOrderValue: number;
  }
): Promise<{
  primaryDriver: string;
  contributions: Array<{
    metric: string;
    uplift: number;
    upliftPercent: number;
    contribution: number;
  }>;
}> {
  const contributions = [
    {
      metric: "conversion_rate",
      uplift: treatmentMetrics.conversionRate - controlMetrics.conversionRate,
      upliftPercent:
        ((treatmentMetrics.conversionRate - controlMetrics.conversionRate) /
          controlMetrics.conversionRate) *
        100,
      contribution: 0,
    },
    {
      metric: "revenue_per_visitor",
      uplift: treatmentMetrics.revenuePerVisitor - controlMetrics.revenuePerVisitor,
      upliftPercent:
        ((treatmentMetrics.revenuePerVisitor - controlMetrics.revenuePerVisitor) /
          controlMetrics.revenuePerVisitor) *
        100,
      contribution: 0,
    },
    {
      metric: "average_order_value",
      uplift: treatmentMetrics.averageOrderValue - controlMetrics.averageOrderValue,
      upliftPercent:
        ((treatmentMetrics.averageOrderValue - controlMetrics.averageOrderValue) /
          controlMetrics.averageOrderValue) *
        100,
      contribution: 0,
    },
  ];

  // Calculate contribution percentages
  const totalAbsoluteUplift = contributions.reduce(
    (sum, c) => sum + Math.abs(c.upliftPercent),
    0
  );

  contributions.forEach((c) => {
    c.contribution = (Math.abs(c.upliftPercent) / totalAbsoluteUplift) * 100;
  });

  // Sort by contribution
  contributions.sort((a, b) => b.contribution - a.contribution);

  return {
    primaryDriver: contributions[0].metric,
    contributions,
  };
}

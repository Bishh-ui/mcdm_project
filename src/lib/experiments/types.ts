/**
 * Type definitions for experiments
 */

export interface Experiment {
  id: string;
  name: string;
  hypothesis: string;
  status: "draft" | "running" | "paused" | "completed" | "archived";
  createdBy: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;

  // Variants
  variants: ExperimentVariant[];

  // Metrics to track
  primaryMetric: "conversion_rate" | "revenue_per_visitor" | "average_order_value";
  secondaryMetrics: string[];

  // Configuration
  trafficAllocation: number; // Percentage of total traffic (0-100)
  minimumDetectableEffect: number; // e.g., 0.05 for 5%
  confidenceLevel: number; // e.g., 0.95 for 95%
  requiredSampleSize: number;

  // TOPSIS configuration
  topsisConfig?: {
    policyId: string;
    criteriaWeights: Record<string, number>;
  };

  // Results
  winner?: string; // Variant ID
  winnerDeclaredAt?: string;
}

export interface ExperimentVariant {
  id: string;
  name: string;
  description: string;
  trafficAllocation: number; // Percentage (0-100)
  isControl: boolean;

  // TOPSIS ranking configuration (for treatment variants)
  rankingStrategy?: "topsis" | "current" | "random" | "custom";
  customRanking?: string[]; // Product IDs in order
}

export interface ExperimentAssignment {
  experimentId: string;
  userId: string;
  variantId: string;
  assignedAt: string;
  bucket: number; // 0-99
}

export interface ExperimentResult {
  experimentId: string;
  variantId: string;
  lastUpdated: string;

  // Aggregate metrics
  visitors: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  revenuePerVisitor: number;
  averageOrderValue: number;
  bounceRate: number;

  // Statistical analysis
  frequentist?: {
    pValue: number;
    zScore: number;
    significant: boolean;
    uplift: number;
    upliftPercent: number;
    confidenceInterval: {
      lower: number;
      upper: number;
    };
  };

  bayesian?: {
    probabilityToBeBest: number;
    expectedLoss: number;
    credibleInterval: {
      lower: number;
      upper: number;
    };
  };

  // Segment breakdown
  segments?: {
    device?: Record<string, ExperimentMetrics>;
    country?: Record<string, ExperimentMetrics>;
    userType?: Record<string, ExperimentMetrics>;
  };
}

export interface ExperimentMetrics {
  visitors: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  revenuePerVisitor: number;
  averageOrderValue: number;
}

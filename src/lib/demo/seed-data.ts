/**
 * Demo Data Seeder
 * Populates the app with realistic sample data for demos
 */

import { setDocument, COLLECTIONS } from "@/lib/firebase/firestore";
import type { Criterion } from "@/lib/topsis/types";
import type { TopsisPolicy } from "@/lib/topsis/types";
import type { Experiment, ExperimentResult } from "@/lib/experiments/types";

export async function seedDemoData() {
  console.log("🌱 Seeding demo data...");

  try {
    // 1. Seed Criteria
    await seedCriteria();
    
    // 2. Seed TOPSIS Policy
    await seedPolicy();
    
    // 3. Seed Sample Experiment
    await seedExperiment();
    
    console.log("✅ Demo data seeded successfully!");
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to seed demo data:", error);
    return { success: false, error };
  }
}

async function seedCriteria() {
  const criteria: Criterion[] = [
    {
      id: "conversion-rate",
      name: "Conversion Rate",
      category: "business-impact",
      type: "benefit",
      weight: 0.35,
      description: "Percentage of visitors who purchase this product",
    },
    {
      id: "revenue-per-visitor",
      name: "Revenue Per Visitor",
      category: "business-impact",
      type: "benefit",
      weight: 0.30,
      description: "Average revenue generated per product page visitor",
    },
    {
      id: "customer-rating",
      name: "Customer Rating",
      category: "ux-quality",
      type: "benefit",
      weight: 0.20,
      description: "Average customer review rating",
    },
    {
      id: "inventory-level",
      name: "Inventory Level",
      category: "business-impact",
      type: "benefit",
      weight: 0.10,
      description: "Current stock availability",
    },
    {
      id: "return-rate",
      name: "Return Rate",
      category: "ux-quality",
      type: "cost",
      weight: 0.05,
      description: "Percentage of orders that are returned",
    },
  ];

  // Write to Firestore
  for (const criterion of criteria) {
    await setDocument(`${COLLECTIONS.CRITERIA}/${criterion.id}`, criterion);
  }

  console.log(`✓ Seeded ${criteria.length} criteria`);
}

async function seedPolicy() {
  const policy: TopsisPolicy = {
    id: "default-policy",
    name: "Default E-commerce Policy",
    normalization: "vector",
    tieBreak: "favor-first",
    rankStabilityThreshold: 0.05,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Write to Firestore
  await setDocument(`${COLLECTIONS.POLICIES}/${policy.id}`, policy);

  console.log("✓ Seeded TOPSIS policy");
}

async function seedExperiment() {
  const experiment: Experiment = {
    id: "demo-homepage-ranking",
    name: "Homepage Product Ranking",
    hypothesis: "TOPSIS-optimized ranking will increase conversion rate by 10%+",
    status: "completed",
    createdBy: "demo-user",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    variants: [
      {
        id: "control",
        name: "Control (Current Order)",
        description: "Current product order on homepage",
        isControl: true,
        trafficAllocation: 50,
        rankingStrategy: "current",
      },
      {
        id: "treatment",
        name: "Treatment (TOPSIS Optimized)",
        description: "TOPSIS-ranked product order",
        isControl: false,
        trafficAllocation: 50,
        rankingStrategy: "topsis",
      },
    ],
    primaryMetric: "conversion_rate",
    secondaryMetrics: ["revenue_per_visitor", "average_order_value"],
    trafficAllocation: 100,
    minimumDetectableEffect: 0.10,
    confidenceLevel: 0.95,
    requiredSampleSize: 10000,
    winner: "treatment",
    winnerDeclaredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  };

  await setDocument(`${COLLECTIONS.EXPERIMENTS}/${experiment.id}`, experiment);
  console.log("✓ Seeded completed experiment");

  // Seed experiment results for both variants
  const controlResult: ExperimentResult = {
    experimentId: experiment.id,
    variantId: "control",
    lastUpdated: new Date().toISOString(),
    visitors: 5420,
    conversions: 487,
    conversionRate: 0.0898,
    revenue: 24350,
    revenuePerVisitor: 4.49,
    averageOrderValue: 50.00,
    bounceRate: 0.42,
    frequentist: {
      pValue: 0.012,
      zScore: -2.51,
      significant: true,
      uplift: -0.0109,
      upliftPercent: -10.8,
      confidenceInterval: {
        lower: -0.018,
        upper: -0.004,
      },
    },
    bayesian: {
      probabilityToBeBest: 0.05,
      expectedLoss: 0.011,
      credibleInterval: {
        lower: 0.085,
        upper: 0.095,
      },
    },
  };

  const treatmentResult: ExperimentResult = {
    experimentId: experiment.id,
    variantId: "treatment",
    lastUpdated: new Date().toISOString(),
    visitors: 5380,
    conversions: 542,
    conversionRate: 0.1007,
    revenue: 27640,
    revenuePerVisitor: 5.14,
    averageOrderValue: 51.00,
    bounceRate: 0.38,
    frequentist: {
      pValue: 0.012,
      zScore: 2.51,
      significant: true,
      uplift: 0.0109,
      upliftPercent: 12.1,
      confidenceInterval: {
        lower: 0.004,
        upper: 0.018,
      },
    },
    bayesian: {
      probabilityToBeBest: 0.95,
      expectedLoss: 0.001,
      credibleInterval: {
        lower: 0.095,
        upper: 0.107,
      },
    },
  };

  await setDocument(
    `${COLLECTIONS.EXPERIMENTS}/${experiment.id}/results/control`,
    controlResult
  );
  await setDocument(
    `${COLLECTIONS.EXPERIMENTS}/${experiment.id}/results/treatment`,
    treatmentResult
  );

  console.log("✓ Seeded experiment results");
}

// Sample products for TOPSIS demo
export const DEMO_PRODUCTS = [
  {
    id: "prod-001",
    name: "Premium Wireless Headphones",
    conversionRate: 8.5,
    revenuePerVisitor: 12.50,
    customerRating: 4.7,
    inventoryLevel: 450,
    returnRate: 3.2,
  },
  {
    id: "prod-002",
    name: "Smart Fitness Watch",
    conversionRate: 12.3,
    revenuePerVisitor: 18.20,
    customerRating: 4.8,
    inventoryLevel: 320,
    returnRate: 2.8,
  },
  {
    id: "prod-003",
    name: "Portable Bluetooth Speaker",
    conversionRate: 9.8,
    revenuePerVisitor: 8.90,
    customerRating: 4.5,
    inventoryLevel: 680,
    returnRate: 4.1,
  },
  {
    id: "prod-004",
    name: "Wireless Charging Pad",
    conversionRate: 7.2,
    revenuePerVisitor: 5.40,
    customerRating: 4.3,
    inventoryLevel: 890,
    returnRate: 5.5,
  },
  {
    id: "prod-005",
    name: "USB-C Hub Adapter",
    conversionRate: 11.5,
    revenuePerVisitor: 9.80,
    customerRating: 4.6,
    inventoryLevel: 540,
    returnRate: 3.8,
  },
  {
    id: "prod-006",
    name: "Laptop Stand",
    conversionRate: 6.8,
    revenuePerVisitor: 4.20,
    customerRating: 4.4,
    inventoryLevel: 720,
    returnRate: 6.2,
  },
  {
    id: "prod-007",
    name: "Mechanical Keyboard",
    conversionRate: 10.2,
    revenuePerVisitor: 15.60,
    customerRating: 4.9,
    inventoryLevel: 280,
    returnRate: 2.1,
  },
  {
    id: "prod-008",
    name: "Ergonomic Mouse",
    conversionRate: 8.9,
    revenuePerVisitor: 7.30,
    customerRating: 4.5,
    inventoryLevel: 620,
    returnRate: 3.5,
  },
  {
    id: "prod-009",
    name: "Webcam HD 1080p",
    conversionRate: 9.5,
    revenuePerVisitor: 11.20,
    customerRating: 4.6,
    inventoryLevel: 410,
    returnRate: 4.3,
  },
  {
    id: "prod-010",
    name: "Phone Case Premium",
    conversionRate: 13.8,
    revenuePerVisitor: 6.50,
    customerRating: 4.4,
    inventoryLevel: 950,
    returnRate: 7.8,
  },
];

// Helper to get demo products in TOPSIS format
export function getDemoProductsForTopsis() {
  return DEMO_PRODUCTS.map((product) => ({
    id: product.id,
    name: product.name,
    values: {
      "conversion-rate": product.conversionRate,
      "revenue-per-visitor": product.revenuePerVisitor,
      "customer-rating": product.customerRating,
      "inventory-level": product.inventoryLevel,
      "return-rate": product.returnRate,
    },
  }));
}

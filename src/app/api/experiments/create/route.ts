export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server";
import { setDocument, logAudit } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import { calculateRequiredSampleSize } from "@/lib/experiments/stats";
import { validateTrafficAllocations } from "@/lib/experiments/bucketing";
import type { Experiment } from "@/lib/experiments/types";

/**
 * POST /api/experiments/create
 * Create a new A/B experiment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      hypothesis,
      variants,
      primaryMetric,
      secondaryMetrics,
      trafficAllocation,
      minimumDetectableEffect,
      confidenceLevel,
      baselineConversionRate,
      topsisConfig,
      userId,
    } = body as {
      name: string;
      hypothesis: string;
      variants: Array<{
        id: string;
        name: string;
        description: string;
        trafficAllocation: number;
        isControl: boolean;
        rankingStrategy?: "topsis" | "current" | "random" | "custom";
        customRanking?: string[];
      }>;
      primaryMetric: "conversion_rate" | "revenue_per_visitor" | "average_order_value";
      secondaryMetrics?: string[];
      trafficAllocation: number;
      minimumDetectableEffect: number;
      confidenceLevel: number;
      baselineConversionRate: number;
      topsisConfig?: {
        policyId: string;
        criteriaWeights: Record<string, number>;
      };
      userId: string;
    };

    // Validation
    if (!name || !hypothesis || !variants || variants.length < 2) {
      return NextResponse.json(
        { error: "Missing required fields or insufficient variants" },
        { status: 400 }
      );
    }

    // Validate traffic allocations
    const validation = validateTrafficAllocations(variants);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join(", ") }, { status: 400 });
    }

    // Check that exactly one variant is control
    const controlVariants = variants.filter((v) => v.isControl);
    if (controlVariants.length !== 1) {
      return NextResponse.json(
        { error: "Exactly one variant must be marked as control" },
        { status: 400 }
      );
    }

    // Calculate required sample size
    const requiredSampleSize = calculateRequiredSampleSize(
      baselineConversionRate,
      minimumDetectableEffect
    );

    // Create experiment
    const experimentId = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const experiment: Experiment = {
      id: experimentId,
      name,
      hypothesis,
      status: "draft",
      createdBy: userId,
      createdAt: new Date().toISOString(),
      variants,
      primaryMetric,
      secondaryMetrics: secondaryMetrics || [],
      trafficAllocation,
      minimumDetectableEffect,
      confidenceLevel,
      requiredSampleSize,
      topsisConfig,
    };

    await setDocument(`${COLLECTIONS.EXPERIMENTS}/${experimentId}`, experiment);

    // Log audit entry
    await logAudit(
      userId,
      userId, // TODO: Get actual user name from auth context
      "create",
      "experiment",
      experimentId,
      null,
      experiment
    );

    return NextResponse.json({
      experiment,
      message: "Experiment created successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create experiment";
    console.error("Create experiment error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server";
import { getDocument, setDocument } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import { assignVariant, getUserBucket, isUserInExperiment } from "@/lib/experiments/bucketing";
import type { Experiment, ExperimentAssignment } from "@/lib/experiments/types";

/**
 * POST /api/experiments/assign
 * Assign user to experiment variant (with consistent hashing)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { experimentId, userId } = body as {
      experimentId: string;
      userId: string;
    };

    if (!experimentId || !userId) {
      return NextResponse.json(
        { error: "Missing experimentId or userId" },
        { status: 400 }
      );
    }

    // Check if user already has an assignment
    const existingAssignment = await getDocument<ExperimentAssignment>(
      `${COLLECTIONS.EXPERIMENT_ASSIGNMENTS}/${experimentId}_${userId}`
    );

    if (existingAssignment) {
      return NextResponse.json({
        assignment: existingAssignment,
        cached: true,
      });
    }

    // Get experiment
    const experiment = await getDocument<Experiment>(
      `${COLLECTIONS.EXPERIMENTS}/${experimentId}`
    );

    if (!experiment) {
      return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
    }

    if (experiment.status !== "running") {
      return NextResponse.json(
        { error: "Experiment is not running" },
        { status: 400 }
      );
    }

    // Check if user is in experiment (based on traffic allocation)
    const inExperiment = isUserInExperiment(userId, experimentId, experiment.trafficAllocation);

    if (!inExperiment) {
      return NextResponse.json({
        assignment: null,
        reason: "User not in experiment traffic allocation",
      });
    }

    // Assign variant
    const variantId = assignVariant(userId, experimentId, experiment.variants);
    const bucket = getUserBucket(userId, experimentId);

    const assignment: ExperimentAssignment = {
      experimentId,
      userId,
      variantId,
      assignedAt: new Date().toISOString(),
      bucket,
    };

    // Save assignment
    await setDocument(
      `${COLLECTIONS.EXPERIMENT_ASSIGNMENTS}/${experimentId}_${userId}`,
      assignment
    );

    return NextResponse.json({
      assignment,
      cached: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to assign variant";
    console.error("Assign variant error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

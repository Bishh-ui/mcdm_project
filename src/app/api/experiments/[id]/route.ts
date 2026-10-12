export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getDocument, updateDocument, logAudit } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import type { Experiment } from "@/lib/experiments/types";

/**
 * GET /api/experiments/[id]
 * Get experiment details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const experiment = await getDocument<Experiment>(`${COLLECTIONS.EXPERIMENTS}/${id}`);

    if (!experiment) {
      return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
    }

    return NextResponse.json({ experiment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get experiment";
    console.error("Get experiment error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/experiments/[id]
 * Update experiment (start, pause, complete, declare winner)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, winnerId } = body as {
      action: "start" | "pause" | "complete" | "declare_winner";
      winnerId?: string;
    };

    const experiment = await getDocument<Experiment>(`${COLLECTIONS.EXPERIMENTS}/${id}`);

    if (!experiment) {
      return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
    }

    const updates: Partial<Experiment> = {};

    switch (action) {
      case "start":
        if (experiment.status !== "draft" && experiment.status !== "paused") {
          return NextResponse.json(
            { error: "Can only start draft or paused experiments" },
            { status: 400 }
          );
        }
        updates.status = "running";
        updates.startedAt = experiment.startedAt || new Date().toISOString();
        break;

      case "pause":
        if (experiment.status !== "running") {
          return NextResponse.json(
            { error: "Can only pause running experiments" },
            { status: 400 }
          );
        }
        updates.status = "paused";
        break;

      case "complete":
        if (experiment.status !== "running" && experiment.status !== "paused") {
          return NextResponse.json(
            { error: "Can only complete running or paused experiments" },
            { status: 400 }
          );
        }
        updates.status = "completed";
        updates.completedAt = new Date().toISOString();
        break;

      case "declare_winner":
        if (!winnerId) {
          return NextResponse.json({ error: "Missing winnerId" }, { status: 400 });
        }
        if (!experiment.variants.find((v) => v.id === winnerId)) {
          return NextResponse.json({ error: "Invalid winnerId" }, { status: 400 });
        }
        updates.winner = winnerId;
        updates.winnerDeclaredAt = new Date().toISOString();
        updates.status = "completed";
        updates.completedAt = new Date().toISOString();
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await updateDocument(`${COLLECTIONS.EXPERIMENTS}/${id}`, updates);

    const updatedExperiment = { ...experiment, ...updates };

    // Log audit entry
    await logAudit(
      "system", // TODO: Get from auth context
      "system",
      action === "declare_winner" ? "approve" : "update",
      "experiment",
      id,
      experiment,
      updatedExperiment
    );

    return NextResponse.json({
      experiment: updatedExperiment,
      message: `Experiment ${action} successful`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update experiment";
    console.error("Update experiment error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

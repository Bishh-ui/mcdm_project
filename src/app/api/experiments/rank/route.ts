import { NextRequest, NextResponse } from "next/server";
import { getDocument } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import { runTopsis } from "@/lib/topsis/engine";
import type { Experiment, ExperimentAssignment } from "@/lib/experiments/types";
import type { Alternative, Criterion } from "@/lib/topsis/types";

/**
 * POST /api/experiments/rank
 * Get ranked products based on user's experiment assignment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { experimentId, userId, products, criteria } = body as {
      experimentId: string;
      userId: string;
      products: Alternative[];
      criteria?: Criterion[];
    };

    if (!experimentId || !userId || !products) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Get user's experiment assignment
    const assignment = await getDocument<ExperimentAssignment>(
      `${COLLECTIONS.EXPERIMENT_ASSIGNMENTS}/${experimentId}_${userId}`
    );

    if (!assignment) {
      // User not in experiment - return default ranking
      return NextResponse.json({
        ranking: products,
        variant: null,
        reason: "User not assigned to experiment",
      });
    }

    // Get experiment
    const experiment = await getDocument<Experiment>(
      `${COLLECTIONS.EXPERIMENTS}/${experimentId}`
    );

    if (!experiment) {
      return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
    }

    // Find assigned variant
    const variant = experiment.variants.find((v) => v.id === assignment.variantId);

    if (!variant) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    // Determine ranking strategy
    let rankedProducts: Alternative[];

    switch (variant.rankingStrategy) {
      case "topsis":
        // Run TOPSIS with experiment configuration
        if (!criteria || !experiment.topsisConfig) {
          return NextResponse.json(
            { error: "Missing criteria or TOPSIS config" },
            { status: 400 }
          );
        }

        // Build decision matrix from products (not used in current implementation)
        // const decisionMatrix = products.map((product) =>
        //   criteria.map((criterion) => {
        //     return (product as Record<string, number>)[criterion.id] || 0;
        //   })
        // );

        const result = runTopsis({
          criteria,
          alternatives: products,
          policy: {
            id: "experiment-policy",
            name: "Experiment Policy",
            normalization: "vector",
            tieBreak: "favor-first",
            rankStabilityThreshold: 0.05,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });

        rankedProducts = result.rankings.map((r) => r.alternative);
        break;

      case "custom":
        // Use custom ranking order
        if (!variant.customRanking) {
          return NextResponse.json(
            { error: "Custom ranking not defined" },
            { status: 400 }
          );
        }

        const rankingMap = new Map(
          variant.customRanking.map((id, index) => [id, index])
        );
        rankedProducts = [...products].sort((a, b) => {
          const rankA = rankingMap.get(a.id) ?? Infinity;
          const rankB = rankingMap.get(b.id) ?? Infinity;
          return rankA - rankB;
        });
        break;

      case "random":
        // Random shuffle
        rankedProducts = [...products].sort(() => Math.random() - 0.5);
        break;

      case "current":
      default:
        // Keep current order (control)
        rankedProducts = products;
        break;
    }

    return NextResponse.json({
      ranking: rankedProducts,
      variant: {
        id: variant.id,
        name: variant.name,
        strategy: variant.rankingStrategy,
      },
      experimentId,
      assignmentId: assignment.variantId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to rank products";
    console.error("Rank products error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

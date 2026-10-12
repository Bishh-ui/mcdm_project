export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getDocument } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import { getExperimentMetrics, getExperimentMetricsBySegment } from "@/lib/experiments/metrics";
import {
  calculateFrequentistSignificance,
  calculateBayesianSignificance,
  hasReachedSignificance,
} from "@/lib/experiments/stats";
import type { Experiment, ExperimentResult, ExperimentMetrics } from "@/lib/experiments/types";

/**
 * GET /api/experiments/[id]/results
 * Get experiment results with statistical analysis
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeSegments = searchParams.get("segments") === "true";

    const experiment = await getDocument<Experiment>(`${COLLECTIONS.EXPERIMENTS}/${id}`);

    if (!experiment) {
      return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
    }

    if (!experiment.startedAt) {
      return NextResponse.json(
        { error: "Experiment has not started yet" },
        { status: 400 }
      );
    }

    // Calculate date range
    const startDate = experiment.startedAt.split("T")[0];
    const endDate = experiment.completedAt
      ? experiment.completedAt.split("T")[0]
      : new Date().toISOString().split("T")[0];

    // Get metrics from BigQuery
    const metrics = await getExperimentMetrics(id, startDate, endDate);

    if (metrics.length === 0) {
      return NextResponse.json({
        results: [],
        message: "No data available yet",
      });
    }

    // Find control variant
    const controlVariant = experiment.variants.find((v) => v.isControl);
    if (!controlVariant) {
      return NextResponse.json({ error: "No control variant found" }, { status: 500 });
    }

    const controlMetrics = metrics.find((m) => m.variantId === controlVariant.id);
    if (!controlMetrics) {
      return NextResponse.json(
        { error: "No data for control variant" },
        { status: 500 }
      );
    }

    // Calculate statistical significance for each treatment variant
    const results: ExperimentResult[] = metrics.map((variantMetrics) => {
      const isControl = variantMetrics.variantId === controlVariant.id;

      let frequentist, bayesian;

      if (!isControl) {
        frequentist = calculateFrequentistSignificance(
          controlMetrics.conversions,
          controlMetrics.visitors,
          variantMetrics.conversions,
          variantMetrics.visitors,
          experiment.confidenceLevel
        );

        bayesian = calculateBayesianSignificance(
          controlMetrics.conversions,
          controlMetrics.visitors,
          variantMetrics.conversions,
          variantMetrics.visitors
        );
      }

      return {
        experimentId: id,
        variantId: variantMetrics.variantId,
        lastUpdated: new Date().toISOString(),
        visitors: variantMetrics.visitors,
        conversions: variantMetrics.conversions,
        conversionRate: variantMetrics.conversionRate,
        revenue: variantMetrics.revenue,
        revenuePerVisitor: variantMetrics.revenuePerVisitor,
        averageOrderValue: variantMetrics.averageOrderValue,
        bounceRate: variantMetrics.bounceRate,
        frequentist,
        bayesian,
      };
    });

    // Check if experiment has reached significance
    const treatmentResults = results.filter((r) => r.variantId !== controlVariant.id);
    const significanceChecks = treatmentResults.map((r) =>
      hasReachedSignificance(
        controlMetrics.conversions,
        controlMetrics.visitors,
        r.conversions,
        r.visitors,
        experiment.requiredSampleSize,
        experiment.confidenceLevel
      )
    );

    // Get segment breakdown if requested
    if (includeSegments) {
      for (const result of results) {
        const deviceMetrics = await getExperimentMetricsBySegment(
          id,
          startDate,
          endDate,
          "device"
        );
        const countryMetrics = await getExperimentMetricsBySegment(
          id,
          startDate,
          endDate,
          "country"
        );
        const userTypeMetrics = await getExperimentMetricsBySegment(
          id,
          startDate,
          endDate,
          "user_type"
        );

        result.segments = {
          device: deviceMetrics
            .filter((m) => m.variantId === result.variantId)
            .reduce<Record<string, ExperimentMetrics>>(
              (acc, m) => {
                acc[m.segmentValue] = {
                  visitors: m.visitors,
                  conversions: m.conversions,
                  conversionRate: m.conversionRate,
                  revenue: m.revenue,
                  revenuePerVisitor: m.revenuePerVisitor,
                  averageOrderValue: m.averageOrderValue,
                };
                return acc;
              },
              {}
            ),
          country: countryMetrics
            .filter((m) => m.variantId === result.variantId)
            .reduce<Record<string, ExperimentMetrics>>(
              (acc, m) => {
                acc[m.segmentValue] = {
                  visitors: m.visitors,
                  conversions: m.conversions,
                  conversionRate: m.conversionRate,
                  revenue: m.revenue,
                  revenuePerVisitor: m.revenuePerVisitor,
                  averageOrderValue: m.averageOrderValue,
                };
                return acc;
              },
              {}
            ),
          userType: userTypeMetrics
            .filter((m) => m.variantId === result.variantId)
            .reduce<Record<string, ExperimentMetrics>>(
              (acc, m) => {
                acc[m.segmentValue] = {
                  visitors: m.visitors,
                  conversions: m.conversions,
                  conversionRate: m.conversionRate,
                  revenue: m.revenue,
                  revenuePerVisitor: m.revenuePerVisitor,
                  averageOrderValue: m.averageOrderValue,
                };
                return acc;
              },
              {}
            ),
        };
      }
    }

    return NextResponse.json({
      results,
      significance: significanceChecks,
      experiment: {
        id: experiment.id,
        name: experiment.name,
        status: experiment.status,
        startedAt: experiment.startedAt,
        completedAt: experiment.completedAt,
        requiredSampleSize: experiment.requiredSampleSize,
        winner: experiment.winner,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get experiment results";
    console.error("Get experiment results error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

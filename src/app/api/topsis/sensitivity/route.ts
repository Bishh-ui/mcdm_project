import { NextRequest, NextResponse } from "next/server";
import { runSensitivityAnalysis } from "@/lib/topsis/engine";
import type { TopsisInput } from "@/lib/topsis";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TopsisInput & {
      perturbationPercent?: number;
    };

    if (!body.criteria || body.criteria.length === 0) {
      return NextResponse.json(
        { error: "At least one criterion is required" },
        { status: 400 }
      );
    }
    if (!body.alternatives || body.alternatives.length < 2) {
      return NextResponse.json(
        { error: "At least two alternatives are required" },
        { status: 400 }
      );
    }
    if (!body.policy) {
      return NextResponse.json(
        { error: "A TOPSIS policy is required" },
        { status: 400 }
      );
    }

    const results = runSensitivityAnalysis(
      body,
      body.perturbationPercent ?? 10
    );

    return NextResponse.json(results);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Sensitivity analysis failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

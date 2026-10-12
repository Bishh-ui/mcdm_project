import { NextRequest, NextResponse } from "next/server";
import { queryConversionFunnel } from "@/lib/bigquery/client";

/**
 * GET /api/ga4/funnel?days=30
 * Fetches conversion funnel data from GA4 via BigQuery.
 */
export async function GET(request: NextRequest) {
  try {
    const days = parseInt(request.nextUrl.searchParams.get("days") ?? "30");
    const funnel = await queryConversionFunnel(days);
    return NextResponse.json({ funnel, days });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to query funnel";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

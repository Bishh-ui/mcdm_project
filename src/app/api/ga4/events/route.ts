export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server";
import { queryEcommerceEvents } from "@/lib/bigquery/client";

/**
 * GET /api/ga4/events?days=30
 * Fetches e-commerce event summary from GA4 via BigQuery.
 */
export async function GET(request: NextRequest) {
  try {
    const days = parseInt(request.nextUrl.searchParams.get("days") ?? "30");
    const events = await queryEcommerceEvents(days);
    return NextResponse.json({ events, days });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to query GA4 events";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

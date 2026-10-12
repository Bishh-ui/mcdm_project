import { NextRequest, NextResponse } from "next/server";
import { queryProductPerformance } from "@/lib/bigquery/client";

/**
 * GET /api/ga4/products?days=30
 * Fetches product-level performance from GA4 via BigQuery.
 */
export async function GET(request: NextRequest) {
  try {
    const days = parseInt(request.nextUrl.searchParams.get("days") ?? "30");
    const products = await queryProductPerformance(days);
    return NextResponse.json({ products, days, count: products.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to query product performance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

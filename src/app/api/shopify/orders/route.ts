export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server";
import { fetchOrders } from "@/lib/shopify/client";
import { getDocument } from "@/lib/firebase/firestore";

interface ShopifyStoreDoc {
  shop: string;
  accessToken: string;
  scope: string;
  installedAt: string;
  lastSyncAt: string | null;
}

/**
 * GET /api/shopify/orders?shop=store.myshopify.com
 * Fetches recent orders from the connected Shopify store.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const shop = searchParams.get("shop");

  if (!shop) {
    return NextResponse.json({ error: "Missing shop parameter" }, { status: 400 });
  }

  const storeDoc = await getDocument<ShopifyStoreDoc>(`shopify_stores/${shop}`);
  if (!storeDoc) {
    return NextResponse.json(
      { error: "Store not connected. Complete OAuth first." },
      { status: 401 }
    );
  }

  const accessToken = storeDoc.accessToken;

  try {
    const limit = searchParams.get("limit") ?? "50";
    const orders = await fetchOrders(shop, accessToken, parseInt(limit));
    return NextResponse.json({ orders, count: orders.length, shop });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

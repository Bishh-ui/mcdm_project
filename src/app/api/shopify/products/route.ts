import { NextRequest, NextResponse } from "next/server";
import { fetchProducts } from "@/lib/shopify/client";
import { getDocument } from "@/lib/firebase/firestore";

interface ShopifyStoreDoc {
  shop: string;
  accessToken: string;
  scope: string;
  installedAt: string;
  lastSyncAt: string | null;
}

/**
 * GET /api/shopify/products?shop=store.myshopify.com
 * Fetches products from the connected Shopify store.
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
    const products = await fetchProducts(shop, accessToken, parseInt(limit));
    return NextResponse.json({ products, count: products.length, shop });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch products";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

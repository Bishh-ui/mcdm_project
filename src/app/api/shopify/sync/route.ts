export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server";
import { fetchProducts, fetchOrders, fetchLocations } from "@/lib/shopify/client";
import { getDocument } from "@/lib/firebase/firestore";
import type { ShopifyProduct, ShopifyOrder } from "@/lib/shopify/client";

interface ShopifyStoreDoc {
  shop: string;
  accessToken: string;
  scope: string;
  installedAt: string;
  lastSyncAt: string | null;
}

/**
 * POST /api/shopify/sync
 * Full sync: fetches products, orders, locations and computes
 * signal scores that can feed into TOPSIS criteria.
 */

interface ProductSignal {
  productId: number;
  name: string;
  handle: string;
  /** Business impact signals */
  totalRevenue: number;
  totalUnitsSold: number;
  averageOrderValue: number;
  orderCount: number;
  /** Performance signals */
  variantCount: number;
  hasInventory: boolean;
  totalInventory: number;
  /** UX signals */
  imageCount: number;
  hasDescription: boolean;
  descriptionLength: number;
  /** Trust signals */
  vendor: string;
  productType: string;
  status: string;
}

function computeProductSignals(
  products: ShopifyProduct[],
  orders: ShopifyOrder[]
): ProductSignal[] {
  // Build a map of product revenue and units from orders
  const revenueMap = new Map<number, { revenue: number; units: number; orders: number }>();

  for (const order of orders) {
    for (const item of order.line_items) {
      if (!item.product_id) continue;
      const existing = revenueMap.get(item.product_id) ?? { revenue: 0, units: 0, orders: 0 };
      existing.revenue += parseFloat(item.price) * item.quantity;
      existing.units += item.quantity;
      existing.orders += 1;
      revenueMap.set(item.product_id, existing);
    }
  }

  return products.map((product) => {
    const sales = revenueMap.get(product.id) ?? { revenue: 0, units: 0, orders: 0 };
    const totalInventory = product.variants.reduce(
      (sum, v) => sum + (v.inventory_quantity ?? 0),
      0
    );

    return {
      productId: product.id,
      name: product.title,
      handle: product.handle,
      totalRevenue: sales.revenue,
      totalUnitsSold: sales.units,
      averageOrderValue: sales.orders > 0 ? sales.revenue / sales.orders : 0,
      orderCount: sales.orders,
      variantCount: product.variants.length,
      hasInventory: totalInventory > 0,
      totalInventory,
      imageCount: product.images.length,
      hasDescription: !!product.body_html && product.body_html.length > 0,
      descriptionLength: product.body_html?.length ?? 0,
      vendor: product.vendor,
      productType: product.product_type,
      status: product.status,
    };
  });
}

export async function POST(request: NextRequest) {
  // Get shop from query params or body
  const { searchParams } = request.nextUrl;
  const shop = searchParams.get("shop");

  if (!shop) {
    return NextResponse.json(
      { error: "Missing shop parameter" },
      { status: 400 }
    );
  }

  // Fetch store credentials from Firestore
  const storeDoc = await getDocument<ShopifyStoreDoc>(`shopify_stores/${shop}`);
  if (!storeDoc) {
    return NextResponse.json(
      { error: "Store not connected. Please authorize first." },
      { status: 401 }
    );
  }

  const accessToken = storeDoc.accessToken;

  try {
    const [products, orders, locations] = await Promise.all([
      fetchProducts(shop, accessToken, 250),
      fetchOrders(shop, accessToken, 250),
      fetchLocations(shop, accessToken),
    ]);

    const signals = computeProductSignals(products, orders);

    return NextResponse.json({
      shop,
      syncedAt: new Date().toISOString(),
      summary: {
        products: products.length,
        orders: orders.length,
        locations: locations.length,
        signals: signals.length,
      },
      signals,
      locations,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

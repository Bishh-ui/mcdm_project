import { adminApiUrl } from "./config";

/** Shopify product from REST Admin API */
export interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string | null;
  vendor: string;
  product_type: string;
  handle: string;
  status: "active" | "archived" | "draft";
  tags: string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  created_at: string;
  updated_at: string;
}

export interface ShopifyVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  compare_at_price: string | null;
  sku: string | null;
  inventory_quantity: number;
  weight: number;
  weight_unit: string;
}

export interface ShopifyImage {
  id: number;
  src: string;
  alt: string | null;
  width: number;
  height: number;
}

export interface ShopifyOrder {
  id: number;
  name: string;
  email: string | null;
  total_price: string;
  subtotal_price: string;
  total_discounts: string;
  currency: string;
  financial_status: string;
  fulfillment_status: string | null;
  line_items: ShopifyLineItem[];
  created_at: string;
  updated_at: string;
}

export interface ShopifyLineItem {
  id: number;
  product_id: number | null;
  variant_id: number | null;
  title: string;
  quantity: number;
  price: string;
}

export interface ShopifyLocation {
  id: number;
  name: string;
  address1: string | null;
  city: string | null;
  country: string;
  active: boolean;
}

export interface ShopifyInventoryLevel {
  inventory_item_id: number;
  location_id: number;
  available: number | null;
}

/** Generic Shopify REST API fetcher */
async function shopifyFetch<T>(
  shop: string,
  accessToken: string,
  endpoint: string,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(adminApiUrl(shop, endpoint));
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Shopify API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

/** Fetch all products (paginated) */
export async function fetchProducts(
  shop: string,
  accessToken: string,
  limit = 50
): Promise<ShopifyProduct[]> {
  const data = await shopifyFetch<{ products: ShopifyProduct[] }>(
    shop,
    accessToken,
    "products.json",
    { limit: String(limit), status: "active" }
  );
  return data.products;
}

/** Fetch recent orders */
export async function fetchOrders(
  shop: string,
  accessToken: string,
  limit = 50
): Promise<ShopifyOrder[]> {
  const data = await shopifyFetch<{ orders: ShopifyOrder[] }>(
    shop,
    accessToken,
    "orders.json",
    { limit: String(limit), status: "any" }
  );
  return data.orders;
}

/** Fetch locations */
export async function fetchLocations(
  shop: string,
  accessToken: string
): Promise<ShopifyLocation[]> {
  const data = await shopifyFetch<{ locations: ShopifyLocation[] }>(
    shop,
    accessToken,
    "locations.json"
  );
  return data.locations;
}

/** Fetch inventory levels for a location */
export async function fetchInventoryLevels(
  shop: string,
  accessToken: string,
  locationId: number
): Promise<ShopifyInventoryLevel[]> {
  const data = await shopifyFetch<{ inventory_levels: ShopifyInventoryLevel[] }>(
    shop,
    accessToken,
    "inventory_levels.json",
    { location_ids: String(locationId) }
  );
  return data.inventory_levels;
}

/** Fetch shop info */
export async function fetchShopInfo(
  shop: string,
  accessToken: string
): Promise<Record<string, unknown>> {
  const data = await shopifyFetch<{ shop: Record<string, unknown> }>(
    shop,
    accessToken,
    "shop.json"
  );
  return data.shop;
}

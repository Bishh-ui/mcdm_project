/** Shopify API configuration */
export const shopifyConfig = {
  clientId: process.env.SHOPIFY_CLIENT_ID!,
  clientSecret: process.env.SHOPIFY_CLIENT_SECRET!,
  scopes: process.env.SHOPIFY_SCOPES ?? "read_products,read_orders,read_inventory,read_analytics,read_customers,read_locations",
  apiVersion: process.env.SHOPIFY_API_VERSION ?? "2025-04",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};

/** Build the Shopify Admin API URL for a store */
export function adminApiUrl(shop: string, endpoint: string): string {
  const domain = shop.includes(".myshopify.com") ? shop : `${shop}.myshopify.com`;
  return `https://${domain}/admin/api/${shopifyConfig.apiVersion}/${endpoint}`;
}

/** Build the Shopify GraphQL Admin API URL */
export function graphqlApiUrl(shop: string): string {
  const domain = shop.includes(".myshopify.com") ? shop : `${shop}.myshopify.com`;
  return `https://${domain}/admin/api/${shopifyConfig.apiVersion}/graphql.json`;
}

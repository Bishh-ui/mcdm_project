import { BigQuery } from "@google-cloud/bigquery";

const projectId = process.env.BIGQUERY_PROJECT_ID ?? "abm-agent";
const mcdmDataset = process.env.BIGQUERY_DATASET ?? "mcdm_events";

/** BigQuery client — uses Application Default Credentials or service account */
const bigquery = new BigQuery({ projectId });

export { bigquery, projectId, mcdmDataset };

// ── GA4 Queries ────────────────────────────────────────────────

/**
 * Find the GA4 export dataset name.
 * GA4 exports to a dataset named `analytics_<PROPERTY_ID>`.
 */
export function ga4DatasetId(): string {
  const propertyId = process.env.GA4_PROPERTY_ID ?? "415108382";
  return `analytics_${propertyId}`;
}

/** E-commerce event summary: page views, add-to-cart, purchases per page */
export async function queryEcommerceEvents(days = 30): Promise<GA4EventSummary[]> {
  const dataset = ga4DatasetId();
  const query = `
    SELECT
      event_name,
      COUNT(*) as event_count,
      COUNT(DISTINCT user_pseudo_id) as unique_users,
      COUNTIF(event_name = 'purchase') as purchases,
      COUNTIF(event_name = 'add_to_cart') as add_to_carts,
      COUNTIF(event_name = 'view_item') as view_items
    FROM \`${projectId}.${dataset}.events_*\`
    WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY))
      AND event_name IN ('page_view', 'view_item', 'add_to_cart', 'begin_checkout', 'purchase')
    GROUP BY event_name
    ORDER BY event_count DESC
  `;

  try {
    const [rows] = await bigquery.query({ query, location: "US" });
    return rows as GA4EventSummary[];
  } catch (error) {
    console.error("BigQuery GA4 query failed:", error);
    return [];
  }
}

/** Product-level performance from GA4 e-commerce events */
export async function queryProductPerformance(days = 30): Promise<GA4ProductPerformance[]> {
  const dataset = ga4DatasetId();
  const query = `
    SELECT
      items.item_id as product_id,
      items.item_name as product_name,
      COUNT(DISTINCT CASE WHEN event_name = 'view_item' THEN user_pseudo_id END) as viewers,
      COUNT(DISTINCT CASE WHEN event_name = 'add_to_cart' THEN user_pseudo_id END) as add_to_carts,
      COUNT(DISTINCT CASE WHEN event_name = 'purchase' THEN user_pseudo_id END) as purchasers,
      SUM(CASE WHEN event_name = 'purchase' THEN items.quantity ELSE 0 END) as units_sold,
      SUM(CASE WHEN event_name = 'purchase' THEN items.item_revenue ELSE 0 END) as revenue,
      SAFE_DIVIDE(
        COUNT(DISTINCT CASE WHEN event_name = 'purchase' THEN user_pseudo_id END),
        COUNT(DISTINCT CASE WHEN event_name = 'view_item' THEN user_pseudo_id END)
      ) as conversion_rate,
      SAFE_DIVIDE(
        COUNT(DISTINCT CASE WHEN event_name = 'add_to_cart' THEN user_pseudo_id END),
        COUNT(DISTINCT CASE WHEN event_name = 'view_item' THEN user_pseudo_id END)
      ) as add_to_cart_rate
    FROM \`${projectId}.${dataset}.events_*\`,
      UNNEST(items) as items
    WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY))
      AND event_name IN ('view_item', 'add_to_cart', 'purchase')
      AND items.item_id IS NOT NULL
    GROUP BY items.item_id, items.item_name
    HAVING viewers > 0
    ORDER BY revenue DESC
    LIMIT 100
  `;

  try {
    const [rows] = await bigquery.query({ query, location: "US" });
    return rows as GA4ProductPerformance[];
  } catch (error) {
    console.error("BigQuery product performance query failed:", error);
    return [];
  }
}

/** Site-wide conversion funnel */
export async function queryConversionFunnel(days = 30): Promise<GA4FunnelStep[]> {
  const dataset = ga4DatasetId();
  const query = `
    SELECT
      event_name,
      COUNT(DISTINCT user_pseudo_id) as unique_users
    FROM \`${projectId}.${dataset}.events_*\`
    WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY))
      AND event_name IN ('session_start', 'page_view', 'view_item', 'add_to_cart', 'begin_checkout', 'purchase')
    GROUP BY event_name
    ORDER BY unique_users DESC
  `;

  try {
    const [rows] = await bigquery.query({ query, location: "US" });
    return rows as GA4FunnelStep[];
  } catch (error) {
    console.error("BigQuery funnel query failed:", error);
    return [];
  }
}

// ── MCDM Dataset Operations ────────────────────────────────────

/** Ensure the mcdm_events dataset exists */
export async function ensureMcdmDataset(): Promise<void> {
  const dataset = bigquery.dataset(mcdmDataset);
  const [exists] = await dataset.exists();
  if (!exists) {
    await bigquery.createDataset(mcdmDataset, {
      location: "US",
      description: "MCDM Commerce Optimizer — event signals and decision data",
    });
  }
}

/** Write product signals to BigQuery for historical tracking */
export async function writeProductSignals(
  signals: Record<string, unknown>[]
): Promise<void> {
  await ensureMcdmDataset();
  const table = bigquery.dataset(mcdmDataset).table("product_signals");
  const [tableExists] = await table.exists();

  if (!tableExists) {
    await bigquery.dataset(mcdmDataset).createTable("product_signals", {
      schema: {
        fields: [
          { name: "product_id", type: "STRING" },
          { name: "product_name", type: "STRING" },
          { name: "source", type: "STRING" },
          { name: "total_revenue", type: "FLOAT" },
          { name: "total_units_sold", type: "INTEGER" },
          { name: "order_count", type: "INTEGER" },
          { name: "conversion_rate", type: "FLOAT" },
          { name: "add_to_cart_rate", type: "FLOAT" },
          { name: "inventory_level", type: "INTEGER" },
          { name: "image_count", type: "INTEGER" },
          { name: "synced_at", type: "TIMESTAMP" },
        ],
      },
    });
  }

  if (signals.length > 0) {
    await table.insert(signals);
  }
}

// ── Types ──────────────────────────────────────────────────────

export interface GA4EventSummary {
  event_name: string;
  event_count: number;
  unique_users: number;
  purchases: number;
  add_to_carts: number;
  view_items: number;
}

export interface GA4ProductPerformance {
  product_id: string;
  product_name: string;
  viewers: number;
  add_to_carts: number;
  purchasers: number;
  units_sold: number;
  revenue: number;
  conversion_rate: number;
  add_to_cart_rate: number;
}

export interface GA4FunnelStep {
  event_name: string;
  unique_users: number;
}

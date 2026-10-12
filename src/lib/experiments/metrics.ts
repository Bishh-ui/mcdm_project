/**
 * Experiment metrics calculation from BigQuery
 */

import { BigQuery } from "@google-cloud/bigquery";

const bigquery = new BigQuery({
  projectId: process.env.BIGQUERY_PROJECT_ID,
});

export interface ExperimentMetrics {
  variantId: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  revenuePerVisitor: number;
  averageOrderValue: number;
  bounceRate: number;
  sessions: number;
}

export interface SegmentMetrics extends ExperimentMetrics {
  segment: string;
  segmentValue: string;
}

/**
 * Query experiment metrics from GA4 BigQuery export
 */
export async function getExperimentMetrics(
  experimentId: string,
  startDate: string,
  endDate: string
): Promise<ExperimentMetrics[]> {
  const query = `
    WITH experiment_sessions AS (
      SELECT
        user_pseudo_id,
        (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'experiment_id') as experiment_id,
        (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'variant_id') as variant_id,
        event_name,
        event_timestamp,
        (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'value') as event_value,
        (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'session_id') as session_id
      FROM \`${process.env.BIGQUERY_PROJECT_ID}.analytics_${process.env.GA4_PROPERTY_ID}.events_*\`
      WHERE _TABLE_SUFFIX BETWEEN @start_date AND @end_date
        AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'experiment_id') = @experiment_id
    ),
    variant_metrics AS (
      SELECT
        variant_id,
        COUNT(DISTINCT user_pseudo_id) as visitors,
        COUNT(DISTINCT session_id) as sessions,
        COUNTIF(event_name = 'purchase') as conversions,
        SUM(CASE WHEN event_name = 'purchase' THEN event_value ELSE 0 END) as revenue,
        COUNTIF(event_name = 'page_view' AND event_timestamp = (
          SELECT MIN(event_timestamp) 
          FROM experiment_sessions es2 
          WHERE es2.session_id = experiment_sessions.session_id
        )) as session_starts,
        COUNTIF(
          event_name = 'page_view' 
          AND event_timestamp = (SELECT MIN(event_timestamp) FROM experiment_sessions es2 WHERE es2.session_id = experiment_sessions.session_id)
          AND (SELECT MAX(event_timestamp) FROM experiment_sessions es3 WHERE es3.session_id = experiment_sessions.session_id) - event_timestamp < 10000000
        ) as bounces
      FROM experiment_sessions
      GROUP BY variant_id
    )
    SELECT
      variant_id,
      visitors,
      sessions,
      conversions,
      SAFE_DIVIDE(conversions, visitors) as conversion_rate,
      revenue,
      SAFE_DIVIDE(revenue, visitors) as revenue_per_visitor,
      SAFE_DIVIDE(revenue, conversions) as average_order_value,
      SAFE_DIVIDE(bounces, session_starts) as bounce_rate
    FROM variant_metrics
    ORDER BY variant_id
  `;

  const options = {
    query,
    params: {
      experiment_id: experimentId,
      start_date: startDate.replace(/-/g, ""),
      end_date: endDate.replace(/-/g, ""),
    },
  };

  const [rows] = await bigquery.query(options);

  return rows.map((row) => ({
    variantId: row.variant_id,
    visitors: parseInt(row.visitors),
    conversions: parseInt(row.conversions),
    conversionRate: parseFloat(row.conversion_rate) || 0,
    revenue: parseFloat(row.revenue) || 0,
    revenuePerVisitor: parseFloat(row.revenue_per_visitor) || 0,
    averageOrderValue: parseFloat(row.average_order_value) || 0,
    bounceRate: parseFloat(row.bounce_rate) || 0,
    sessions: parseInt(row.sessions),
  }));
}

/**
 * Query experiment metrics by segment (device, geography, etc.)
 */
export async function getExperimentMetricsBySegment(
  experimentId: string,
  startDate: string,
  endDate: string,
  segmentType: "device" | "country" | "user_type"
): Promise<SegmentMetrics[]> {
  const segmentField =
    segmentType === "device"
      ? "device.category"
      : segmentType === "country"
        ? "geo.country"
        : "CASE WHEN (SELECT value.int_value FROM UNNEST(user_properties) WHERE key = 'first_visit_timestamp') = event_timestamp THEN 'new' ELSE 'returning' END";

  const query = `
    WITH experiment_sessions AS (
      SELECT
        user_pseudo_id,
        ${segmentField} as segment_value,
        (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'experiment_id') as experiment_id,
        (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'variant_id') as variant_id,
        event_name,
        (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'value') as event_value,
        (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'session_id') as session_id
      FROM \`${process.env.BIGQUERY_PROJECT_ID}.analytics_${process.env.GA4_PROPERTY_ID}.events_*\`
      WHERE _TABLE_SUFFIX BETWEEN @start_date AND @end_date
        AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'experiment_id') = @experiment_id
    )
    SELECT
      variant_id,
      segment_value,
      COUNT(DISTINCT user_pseudo_id) as visitors,
      COUNT(DISTINCT session_id) as sessions,
      COUNTIF(event_name = 'purchase') as conversions,
      SAFE_DIVIDE(COUNTIF(event_name = 'purchase'), COUNT(DISTINCT user_pseudo_id)) as conversion_rate,
      SUM(CASE WHEN event_name = 'purchase' THEN event_value ELSE 0 END) as revenue,
      SAFE_DIVIDE(SUM(CASE WHEN event_name = 'purchase' THEN event_value ELSE 0 END), COUNT(DISTINCT user_pseudo_id)) as revenue_per_visitor,
      SAFE_DIVIDE(SUM(CASE WHEN event_name = 'purchase' THEN event_value ELSE 0 END), COUNTIF(event_name = 'purchase')) as average_order_value
    FROM experiment_sessions
    GROUP BY variant_id, segment_value
    ORDER BY variant_id, segment_value
  `;

  const options = {
    query,
    params: {
      experiment_id: experimentId,
      start_date: startDate.replace(/-/g, ""),
      end_date: endDate.replace(/-/g, ""),
    },
  };

  const [rows] = await bigquery.query(options);

  return rows.map((row) => ({
    variantId: row.variant_id,
    segment: segmentType,
    segmentValue: row.segment_value,
    visitors: parseInt(row.visitors),
    conversions: parseInt(row.conversions),
    conversionRate: parseFloat(row.conversion_rate) || 0,
    revenue: parseFloat(row.revenue) || 0,
    revenuePerVisitor: parseFloat(row.revenue_per_visitor) || 0,
    averageOrderValue: parseFloat(row.average_order_value) || 0,
    bounceRate: 0, // Not calculated in segment query for simplicity
    sessions: parseInt(row.sessions),
  }));
}

/**
 * Track experiment event to GA4 (via Measurement Protocol)
 */
export async function trackExperimentEvent(
  userId: string,
  experimentId: string,
  variantId: string,
  eventName: string,
  eventParams?: Record<string, string | number>
) {
  // This would use GA4 Measurement Protocol API
  // For now, we'll just log it (implement when needed)
  console.log("Track experiment event:", {
    userId,
    experimentId,
    variantId,
    eventName,
    eventParams,
  });
}

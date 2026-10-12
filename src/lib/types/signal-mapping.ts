/** How a raw signal maps to a TOPSIS criterion */
export interface SignalMapping {
  id: string;
  criterionId: string;
  criterionName: string;
  source: "shopify" | "ga4" | "manual";
  signalField: string;
  aggregation: "sum" | "average" | "max" | "min" | "count" | "latest";
  refreshFrequency: "real-time" | "hourly" | "daily";
  description: string;
  enabled: boolean;
}

export const AGGREGATION_OPTIONS = [
  { value: "sum", label: "Sum" },
  { value: "average", label: "Average" },
  { value: "max", label: "Maximum" },
  { value: "min", label: "Minimum" },
  { value: "count", label: "Count" },
  { value: "latest", label: "Latest Value" },
];

export const REFRESH_OPTIONS = [
  { value: "real-time", label: "Real-time" },
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
];

export const SOURCE_OPTIONS = [
  { value: "shopify", label: "Shopify" },
  { value: "ga4", label: "Google Analytics 4" },
  { value: "manual", label: "Manual Input" },
];

/** Available signal fields per source */
export const SIGNAL_FIELDS: Record<string, Array<{ value: string; label: string }>> = {
  shopify: [
    { value: "totalRevenue", label: "Total Revenue" },
    { value: "totalUnitsSold", label: "Units Sold" },
    { value: "averageOrderValue", label: "Average Order Value" },
    { value: "orderCount", label: "Order Count" },
    { value: "totalInventory", label: "Inventory Level" },
    { value: "variantCount", label: "Variant Count" },
    { value: "imageCount", label: "Image Count" },
    { value: "descriptionLength", label: "Description Length" },
  ],
  ga4: [
    { value: "conversion_rate", label: "Conversion Rate" },
    { value: "add_to_cart_rate", label: "Add-to-Cart Rate" },
    { value: "viewers", label: "Product Viewers" },
    { value: "revenue", label: "GA4 Revenue" },
    { value: "units_sold", label: "GA4 Units Sold" },
  ],
  manual: [
    { value: "custom", label: "Custom Value" },
  ],
};

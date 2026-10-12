/** KPI status lifecycle */
export type KpiStatus = "draft" | "review" | "approved";

/** KPI category */
export type KpiCategory =
  | "conversion-uplift"
  | "rpv"
  | "speed-to-decision"
  | "confidence-stability";

export interface Kpi {
  id: string;
  name: string;
  formula: string;
  owner: string;
  baseline: number;
  target: number;
  category: KpiCategory;
  status: KpiStatus;
  createdAt: string;
  updatedAt: string;
}

export const KPI_CATEGORIES: Record<KpiCategory, { label: string; color: string }> = {
  "conversion-uplift": { label: "Conversion Uplift", color: "#35d0ff" },
  rpv: { label: "Revenue Per Visitor", color: "#8af26b" },
  "speed-to-decision": { label: "Speed to Decision", color: "#ffbe5b" },
  "confidence-stability": { label: "Confidence Stability", color: "#a78bfa" },
};

export const KPI_STATUS_CONFIG: Record<KpiStatus, { label: string; variant: "neutral" | "amber" | "lime" }> = {
  draft: { label: "Draft", variant: "neutral" },
  review: { label: "In Review", variant: "amber" },
  approved: { label: "Approved", variant: "lime" },
};

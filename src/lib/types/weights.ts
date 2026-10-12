/** Weight proposal status */
export type WeightProposalStatus = "proposed" | "approved" | "rejected";

/** A single weight change proposal */
export interface WeightProposal {
  id: string;
  criterionId: string;
  criterionName: string;
  previousWeight: number;
  proposedWeight: number;
  reason: string;
  proposedBy: string;
  status: WeightProposalStatus;
  reviewedBy: string | null;
  reviewNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

/** A saved weight configuration snapshot */
export interface WeightSnapshot {
  id: string;
  name: string;
  weights: Record<string, number>; // criterionId → weight
  source: "manual" | "ahp" | "ml-suggested";
  createdAt: string;
  isActive: boolean;
}

export const WEIGHT_STATUS_CONFIG: Record<
  WeightProposalStatus,
  { label: string; variant: "amber" | "lime" | "pink" }
> = {
  proposed: { label: "Proposed", variant: "amber" },
  approved: { label: "Approved", variant: "lime" },
  rejected: { label: "Rejected", variant: "pink" },
};

import { PageHeader } from "@/components/ui/page-header";
import { WeightGovernance } from "@/components/weights/weight-governance";

export default function WeightsPage() {
  return (
    <>
      <PageHeader
        title="Weight Governance"
        description="Propose, review, and approve weight changes. Full audit trail with version history."
      />
      <WeightGovernance />
    </>
  );
}

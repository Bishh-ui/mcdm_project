import { PageHeader } from "@/components/ui/page-header";
import { TopsisRunner } from "@/components/topsis/topsis-runner";

export default function TopsisRunPage() {
  return (
    <>
      <PageHeader
        title="Run TOPSIS Analysis"
        description="Input alternatives, score them against your criteria, and get deterministic ranked results with full step-by-step breakdown."
      />
      <TopsisRunner />
    </>
  );
}

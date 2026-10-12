import { PageHeader } from "@/components/ui/page-header";
import { PolicyManager } from "@/components/topsis/policy-manager";

export default function TopsisConfigPage() {
  return (
    <>
      <PageHeader
        title="TOPSIS Policy Config"
        description="Configure normalization method, tie-break rules, and rank stability thresholds. Each policy pack defines how the TOPSIS engine processes decisions."
      />
      <PolicyManager />
    </>
  );
}

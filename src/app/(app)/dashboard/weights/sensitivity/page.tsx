import { PageHeader } from "@/components/ui/page-header";
import { SensitivityAnalysis } from "@/components/weights/sensitivity-analysis";

export default function SensitivityPage() {
  return (
    <>
      <PageHeader
        title="Sensitivity Analysis"
        description="Perturb weights with sliders and see real-time rank changes. Detect rank reversals and assess ranking stability."
      />
      <SensitivityAnalysis />
    </>
  );
}

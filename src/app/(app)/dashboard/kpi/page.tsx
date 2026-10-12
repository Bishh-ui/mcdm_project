import { PageHeader } from "@/components/ui/page-header";
import { KpiManager } from "@/components/kpi/kpi-manager";

export default function KpiPage() {
  return (
    <>
      <PageHeader
        title="KPI Framework"
        description="Define north-star KPIs with formulas, owners, baselines, and targets. Track status from draft through approval."
      />
      <KpiManager />
    </>
  );
}

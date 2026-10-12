"use client";

import { use } from "react";
import { ResultsDashboard } from "@/components/experiments/results-dashboard";
import { PageHeader } from "@/components/ui/page-header";

export default function ExperimentResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Experiment Results"
        description="Real-time metrics and statistical analysis"
      />
      <ResultsDashboard experimentId={id} />
    </div>
  );
}

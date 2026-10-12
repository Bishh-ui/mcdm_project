"use client";

import { ExperimentBuilder } from "@/components/experiments/experiment-builder";
import { PageHeader } from "@/components/ui/page-header";

export default function NewExperimentPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Experiment"
        description="Set up a new A/B test to compare TOPSIS rankings"
      />
      <ExperimentBuilder />
    </div>
  );
}

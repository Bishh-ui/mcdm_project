import { DataFreshnessIndicator } from "@/components/transparency/data-freshness-indicator";
import { DecisionAuditTrail } from "@/components/transparency/decision-audit-trail";
import { WeightHistoryTimeline } from "@/components/transparency/weight-history-timeline";

export default function TransparencyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Decision Transparency</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Full visibility into data freshness, decision history, and weight changes
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Data Freshness */}
        <DataFreshnessIndicator />

        {/* Weight History */}
        <WeightHistoryTimeline />

        {/* Audit Trail */}
        <DecisionAuditTrail limit={20} />
      </div>
    </div>
  );
}

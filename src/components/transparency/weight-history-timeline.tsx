"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { getCollection, type AuditEntry } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/firebase/firestore";

interface WeightChange {
  id: string;
  timestamp: Date;
  userId: string;
  criterionId: string;
  criterionName: string;
  previousWeight: number;
  newWeight: number;
  reason?: string;
  status: "proposed" | "approved" | "rejected";
  reviewedBy?: string;
}

export function WeightHistoryTimeline() {
  const [changes, setChanges] = useState<WeightChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "approved" | "rejected">("all");

  useMemo(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const auditEntries = await getCollection<AuditEntry>(COLLECTIONS.AUDIT_LOG);

        // Filter for weight-related changes
        const weightChanges = auditEntries
          .filter(
            (entry) =>
              entry.entity === "weight" ||
              entry.entity === "criterion" ||
              entry.action === "approve" ||
              entry.action === "reject"
          )
          .map((entry) => {
            const prevValue = entry.previousValue as Record<string, unknown> | null;
            const newValue = entry.newValue as Record<string, unknown> | null;
            const metadata = entry.metadata || {};
            
            return {
              id: entry.id,
              timestamp: new Date(entry.timestamp),
              userId: entry.userId,
              criterionId: metadata.criterionId as string || entry.entityId,
              criterionName: metadata.criterionName as string || entry.entity,
              previousWeight: (prevValue?.weight as number) || 0,
              newWeight: (newValue?.weight as number) || 0,
              reason: metadata.reason as string || entry.entity,
              status: entry.action === "approve" ? "approved" : entry.action === "reject" ? "rejected" : "proposed",
              reviewedBy: metadata.reviewedBy as string || entry.userName,
            } as WeightChange;
          })
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        setChanges(weightChanges);
      } catch (error) {
        console.error("Failed to load weight history:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredChanges = changes.filter((change) => {
    if (filter === "all") return true;
    return change.status === filter;
  });

  function getStatusColor(status: string): string {
    switch (status) {
      case "approved":
        return "bg-green-500/10 text-green-500";
      case "rejected":
        return "bg-red-500/10 text-red-500";
      case "proposed":
        return "bg-yellow-500/10 text-yellow-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  }

  function formatTimestamp(date: Date): string {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }

  function formatWeightChange(prev: number, next: number): string {
    const diff = next - prev;
    const sign = diff > 0 ? "+" : "";
    const percentage = prev > 0 ? ((diff / prev) * 100).toFixed(1) : "N/A";
    return `${sign}${diff.toFixed(3)} (${sign}${percentage}%)`;
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Weight Change History</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded text-sm ${
              filter === "all"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`px-3 py-1 rounded text-sm ${
              filter === "approved"
                ? "bg-green-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter("rejected")}
            className={`px-3 py-1 rounded text-sm ${
              filter === "rejected"
                ? "bg-red-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            Rejected
          </button>
        </div>
      </div>

      {filteredChanges.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No weight changes found</p>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

          <div className="space-y-6">
            {filteredChanges.map((change) => (
              <div key={change.id} className="relative pl-12">
                {/* Timeline dot */}
                <div
                  className={`absolute left-2.5 w-3 h-3 rounded-full ${
                    change.status === "approved"
                      ? "bg-green-500"
                      : change.status === "rejected"
                      ? "bg-red-500"
                      : "bg-yellow-500"
                  }`}
                />

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{change.criterionName}</h4>
                      <p className="text-xs text-gray-500">
                        {formatTimestamp(change.timestamp)}
                      </p>
                    </div>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(change.status)}`}>
                      {change.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                    <div>
                      <span className="text-gray-500">Previous:</span>
                      <p className="font-medium">{change.previousWeight.toFixed(3)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">New:</span>
                      <p className="font-medium">{change.newWeight.toFixed(3)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Change:</span>
                      <p
                        className={`font-medium ${
                          change.newWeight > change.previousWeight
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {formatWeightChange(change.previousWeight, change.newWeight)}
                      </p>
                    </div>
                  </div>

                  {change.reason && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Reason:</span> {change.reason}
                      </p>
                    </div>
                  )}

                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                    <span>Proposed by: {change.userId}</span>
                    {change.reviewedBy && (
                      <span>Reviewed by: {change.reviewedBy}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { getCollection, type AuditEntry } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/firebase/firestore";

export function DecisionAuditTrail({ decisionId, limit = 50 }: { decisionId?: string; limit?: number }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  useMemo(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const allEntries = await getCollection<AuditEntry>(COLLECTIONS.AUDIT_LOG);
        
        let filtered = allEntries;
        if (decisionId) {
          filtered = allEntries.filter(
            (entry) => entry.metadata?.decisionId === decisionId
          );
        }

        // Sort by timestamp descending
        const sorted = filtered.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        setEntries(sorted.slice(0, limit));
      } catch (error) {
        console.error("Failed to load audit trail:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [limit, decisionId]);

  function getActionColor(action: string): string {
    switch (action) {
      case "create":
        return "bg-green-500/10 text-green-500";
      case "update":
        return "bg-blue-500/10 text-blue-500";
      case "delete":
        return "bg-red-500/10 text-red-500";
      case "approve":
        return "bg-purple-500/10 text-purple-500";
      case "reject":
        return "bg-orange-500/10 text-orange-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  }

  function formatTimestamp(date: string): string {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-gray-500 text-center">No audit entries found</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Decision Audit Trail</h3>
      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getActionColor(entry.action)}`}>
                    {entry.action}
                  </span>
                  <span className="text-sm font-medium">{entry.entity}</span>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span className="font-medium">{entry.userName}</span>
                  {entry.entity && <span> — {entry.entity}/{entry.entityId}</span>}
                </div>

                {(entry.previousValue || entry.newValue || entry.metadata) && (
                  <button
                    onClick={() =>
                      setExpandedEntry(
                        expandedEntry === entry.id ? null : entry.id
                      )
                    }
                    className="text-xs text-blue-500 hover:text-blue-600"
                  >
                    {expandedEntry === entry.id ? "Hide" : "Show"} details
                  </button>
                )}
              </div>
            </div>

            {expandedEntry === entry.id && (entry.previousValue || entry.newValue || entry.metadata) && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {entry.previousValue && (
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Previous:
                      </span>
                      <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto">
                        {JSON.stringify(entry.previousValue, null, 2)}
                      </pre>
                    </div>
                  )}
                  {entry.newValue && (
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        New:
                      </span>
                      <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto">
                        {JSON.stringify(entry.newValue, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
                {entry.metadata && (
                  <div className="mt-3">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Metadata:
                    </span>
                    <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto">
                      {JSON.stringify(entry.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

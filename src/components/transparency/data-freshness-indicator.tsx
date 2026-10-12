"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

interface DataSource {
  id: string;
  name: string;
  lastSync: Date;
  status: "fresh" | "stale" | "error" | "syncing";
  recordCount?: number;
  errorMessage?: string;
}

interface DataFreshnessIndicatorProps {
  sources?: DataSource[];
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

export function DataFreshnessIndicator({
  sources: initialSources,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}: DataFreshnessIndicatorProps) {
  const [sources, setSources] = useState<DataSource[]>(() => {
    const now = Date.now();
    return initialSources || [
      {
        id: "shopify",
        name: "Shopify Products",
        lastSync: new Date(now - 1000 * 60 * 15), // 15 min ago
        status: "fresh",
        recordCount: 247,
      },
      {
        id: "ga4",
        name: "GA4 Analytics",
        lastSync: new Date(now - 1000 * 60 * 60 * 2), // 2 hours ago
        status: "stale",
        recordCount: 15420,
      },
      {
        id: "bigquery",
        name: "BigQuery Events",
        lastSync: new Date(now - 1000 * 60 * 5), // 5 min ago
        status: "fresh",
        recordCount: 89234,
      },
      {
        id: "experiments",
        name: "Experiment Results",
        lastSync: new Date(now - 1000 * 60 * 60 * 24), // 1 day ago
        status: "stale",
        recordCount: 12,
      },
    ];
  });

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Update freshness status based on time elapsed
      setSources((prev) =>
        prev.map((source) => ({
          ...source,
          status: getFreshnessStatus(source.lastSync),
        }))
      );
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  function getFreshnessStatus(lastSync: Date): "fresh" | "stale" | "error" {
    const minutesAgo = (Date.now() - lastSync.getTime()) / 1000 / 60;

    if (minutesAgo < 30) return "fresh";
    if (minutesAgo < 120) return "stale";
    return "error";
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case "fresh":
        return "bg-green-500/10 text-green-500";
      case "stale":
        return "bg-yellow-500/10 text-yellow-500";
      case "error":
        return "bg-red-500/10 text-red-500";
      case "syncing":
        return "bg-blue-500/10 text-blue-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  }

  function getStatusIcon(status: string): string {
    switch (status) {
      case "fresh":
        return "✓";
      case "stale":
        return "⚠";
      case "error":
        return "✕";
      case "syncing":
        return "↻";
      default:
        return "?";
    }
  }

  function formatLastSync(date: Date): string {
    const now = new Date();
    const minutesAgo = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);

    if (minutesAgo < 1) return "Just now";
    if (minutesAgo < 60) return `${minutesAgo}m ago`;

    const hoursAgo = Math.floor(minutesAgo / 60);
    if (hoursAgo < 24) return `${hoursAgo}h ago`;

    const daysAgo = Math.floor(hoursAgo / 24);
    return `${daysAgo}d ago`;
  }

  function formatRecordCount(count?: number): string {
    if (!count) return "—";
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  }

  const freshCount = sources.filter((s) => s.status === "fresh").length;
  const staleCount = sources.filter((s) => s.status === "stale").length;
  const errorCount = sources.filter((s) => s.status === "error").length;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Data Freshness</h3>
        <div className="flex gap-3 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-600 dark:text-gray-400">
              {freshCount} fresh
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-gray-600 dark:text-gray-400">
              {staleCount} stale
            </span>
          </div>
          {errorCount > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {errorCount} error
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {sources.map((source) => (
          <div
            key={source.id}
            className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${getStatusColor(
                  source.status
                )}`}
              >
                {getStatusIcon(source.status)}
              </div>
              <div>
                <h4 className="font-medium">{source.name}</h4>
                <p className="text-sm text-gray-500">
                  Last sync: {formatLastSync(source.lastSync)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {source.recordCount !== undefined && (
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {formatRecordCount(source.recordCount)}
                  </p>
                  <p className="text-xs text-gray-500">records</p>
                </div>
              )}
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(source.status)}`}>
                {source.status}
              </span>
            </div>

            {source.errorMessage && (
              <div className="mt-2 text-sm text-red-500">
                {source.errorMessage}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500">
          <span className="font-medium">Fresh:</span> Updated within 30 minutes •{" "}
          <span className="font-medium">Stale:</span> Updated 30min-2h ago •{" "}
          <span className="font-medium">Error:</span> Not updated in 2+ hours
        </p>
      </div>
    </Card>
  );
}

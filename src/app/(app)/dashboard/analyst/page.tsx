"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { getAuditLog } from "@/lib/firebase/firestore";
import type { AuditEntry } from "@/lib/firebase/firestore";

export default function AnalystDashboard() {
  const router = useRouter();
  const { profile } = useAuth();
  const [recentActivity, setRecentActivity] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuditLog().then((logs) => {
      setRecentActivity(logs.slice(0, 10));
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${profile?.displayName || "Analyst"}`}
        description="Deep-dive into TOPSIS analysis and data quality"
      />

      {/* Analysis Tools */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="text-3xl mb-2">⬡</div>
          <h3 className="text-sm font-semibold text-white mb-1">TOPSIS Deep-Dive</h3>
          <p className="text-xs text-gray-400 mb-3">
            Step-by-step analysis
          </p>
          <Button onClick={() => router.push("/dashboard/topsis/run")} className="w-full text-sm">
            Analyze
          </Button>
        </Card>

        <Card className="p-6">
          <div className="text-3xl mb-2">〰</div>
          <h3 className="text-sm font-semibold text-white mb-1">Sensitivity</h3>
          <p className="text-xs text-gray-400 mb-3">
            Weight perturbation
          </p>
          <Button
            onClick={() => router.push("/dashboard/weights/sensitivity")}
            className="w-full text-sm"
          >
            Test
          </Button>
        </Card>

        <Card className="p-6">
          <div className="text-3xl mb-2">📋</div>
          <h3 className="text-sm font-semibold text-white mb-1">Audit Log</h3>
          <p className="text-xs text-gray-400 mb-3">
            Full change history
          </p>
          <Button onClick={() => router.push("/dashboard/audit")} className="w-full text-sm">
            Review
          </Button>
        </Card>

        <Card className="p-6">
          <div className="text-3xl mb-2">🔗</div>
          <h3 className="text-sm font-semibold text-white mb-1">Data Quality</h3>
          <p className="text-xs text-gray-400 mb-3">
            Signal monitoring
          </p>
          <Button onClick={() => router.push("/dashboard/connectors")} className="w-full text-sm">
            Monitor
          </Button>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        {recentActivity.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No recent activity</div>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-800"
              >
                <div className="flex-1">
                  <div className="text-sm text-white">
                    <span className="font-medium">{entry.userName}</span>
                    <span className="text-gray-400"> {entry.action} </span>
                    <span className="font-medium">{entry.entity}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(entry.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

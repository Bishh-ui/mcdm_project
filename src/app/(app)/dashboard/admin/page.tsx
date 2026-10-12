"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/auth-provider";
import { getAuditLog } from "@/lib/firebase/firestore";
import type { AuditEntry } from "@/lib/firebase/firestore";

export default function AdminDashboard() {
  const router = useRouter();
  const { profile } = useAuth();
  const [recentActivity, setRecentActivity] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuditLog().then((logs) => {
      setRecentActivity(logs.slice(0, 15));
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${profile?.displayName || "Admin"}`}
        description="System health, user management, and full audit access"
      />

      {/* System Health */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="text-sm text-gray-400 mb-1">System Status</div>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <div className="text-lg font-semibold text-white">Operational</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-400 mb-1">Connectors</div>
          <div className="text-2xl font-bold text-white">3</div>
          <div className="text-xs text-gray-500 mt-1">Shopify, GA4, BigQuery</div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-400 mb-1">Audit Entries</div>
          <div className="text-2xl font-bold text-white">{recentActivity.length}+</div>
          <div className="text-xs text-gray-500 mt-1">Recent activity</div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-400 mb-1">Data Quality</div>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <div className="text-lg font-semibold text-white">Good</div>
          </div>
        </Card>
      </div>

      {/* Admin Actions */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="text-3xl mb-2">👥</div>
          <h3 className="text-lg font-semibold text-white mb-1">User Management</h3>
          <p className="text-sm text-gray-400 mb-4">
            Manage roles and permissions
          </p>
          <Button className="w-full" disabled>
            Coming Soon
          </Button>
        </Card>

        <Card className="p-6">
          <div className="text-3xl mb-2">🔌</div>
          <h3 className="text-lg font-semibold text-white mb-1">Connectors</h3>
          <p className="text-sm text-gray-400 mb-4">
            Manage data source connections
          </p>
          <Button onClick={() => router.push("/dashboard/connectors")} className="w-full">
            Manage
          </Button>
        </Card>

        <Card className="p-6">
          <div className="text-3xl mb-2">📋</div>
          <h3 className="text-lg font-semibold text-white mb-1">Full Audit Log</h3>
          <p className="text-sm text-gray-400 mb-4">
            Complete system audit trail
          </p>
          <Button onClick={() => router.push("/dashboard/audit")} className="w-full">
            View Log
          </Button>
        </Card>
      </div>

      {/* Recent System Activity */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent System Activity</h3>
          <Button onClick={() => router.push("/dashboard/audit")} className="text-sm">
            View All
          </Button>
        </div>
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
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        entry.action === "create"
                          ? "lime"
                          : entry.action === "delete"
                            ? "pink"
                            : entry.action === "approve"
                              ? "cyan"
                              : "neutral"
                      }
                    >
                      {entry.action}
                    </Badge>
                    <span className="text-sm text-white">
                      <span className="font-medium">{entry.userName}</span>
                      <span className="text-gray-400"> modified </span>
                      <span className="font-medium">{entry.entity}</span>
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
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

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/auth-provider";
import { subscribeToCollection } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import type { Experiment } from "@/lib/experiments/types";

export default function MerchandiserDashboard() {
  const router = useRouter();
  const { profile } = useAuth();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToCollection<Experiment>(
      COLLECTIONS.EXPERIMENTS,
      (data) => {
        const running = data.filter((e) => e.status === "running" || e.status === "completed");
        setExperiments(running.slice(0, 5));
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${profile?.displayName || "Merchandiser"}`}
        description="Quick actions and product ranking insights"
      />

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="text-3xl mb-2">📊</div>
          <h3 className="text-lg font-semibold text-white mb-1">View Rankings</h3>
          <p className="text-sm text-gray-400 mb-4">
            See current TOPSIS product rankings
          </p>
          <Button onClick={() => router.push("/dashboard/topsis/run")} className="w-full">
            View Rankings
          </Button>
        </Card>

        <Card className="p-6">
          <div className="text-3xl mb-2">🧪</div>
          <h3 className="text-lg font-semibold text-white mb-1">Active Experiments</h3>
          <p className="text-sm text-gray-400 mb-4">
            Monitor running A/B tests
          </p>
          <Button onClick={() => router.push("/dashboard/experiments")} className="w-full">
            View Experiments
          </Button>
        </Card>

        <Card className="p-6">
          <div className="text-3xl mb-2">📈</div>
          <h3 className="text-lg font-semibold text-white mb-1">Export Data</h3>
          <p className="text-sm text-gray-400 mb-4">
            Download rankings and reports
          </p>
          <Button onClick={() => router.push("/dashboard/topsis/run")} className="w-full">
            Export
          </Button>
        </Card>
      </div>

      {/* Recent Experiments */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Experiments</h3>
        {experiments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No experiments yet</div>
        ) : (
          <div className="space-y-3">
            {experiments.map((exp) => (
              <div
                key={exp.id}
                onClick={() => router.push(`/dashboard/experiments/${exp.id}`)}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-800 hover:border-cyan-500/50 cursor-pointer transition"
              >
                <div className="flex-1">
                  <div className="font-medium text-white">{exp.name}</div>
                  <div className="text-sm text-gray-400">{exp.hypothesis}</div>
                </div>
                <Badge variant={exp.status === "running" ? "lime" : "cyan"}>
                  {exp.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

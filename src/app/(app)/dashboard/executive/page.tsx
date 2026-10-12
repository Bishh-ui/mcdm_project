"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { subscribeToCollection } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import type { Experiment } from "@/lib/experiments/types";

export default function ExecutiveDashboard() {
  const router = useRouter();
  const { profile } = useAuth();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToCollection<Experiment>(
      COLLECTIONS.EXPERIMENTS,
      (data) => {
        setExperiments(data);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const completedExperiments = experiments.filter((e) => e.status === "completed");
  const runningExperiments = experiments.filter((e) => e.status === "running");
  const experimentsWithWinners = experiments.filter((e) => e.winner);

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${profile?.displayName || "Executive"}`}
        description="High-level KPIs and experiment ROI"
      />

      {/* KPI Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="text-sm text-gray-400 mb-1">Total Experiments</div>
          <div className="text-3xl font-bold text-white">{experiments.length}</div>
          <div className="text-xs text-gray-500 mt-1">All time</div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-400 mb-1">Running Now</div>
          <div className="text-3xl font-bold text-cyan-400">{runningExperiments.length}</div>
          <div className="text-xs text-gray-500 mt-1">Active tests</div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-400 mb-1">Completed</div>
          <div className="text-3xl font-bold text-green-400">{completedExperiments.length}</div>
          <div className="text-xs text-gray-500 mt-1">With results</div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-400 mb-1">Winners Declared</div>
          <div className="text-3xl font-bold text-amber-400">{experimentsWithWinners.length}</div>
          <div className="text-xs text-gray-500 mt-1">Successful tests</div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Experiment ROI</h3>
          <p className="text-sm text-gray-400 mb-4">
            View conversion uplift and revenue impact
          </p>
          <Button onClick={() => router.push("/dashboard/experiments")} className="w-full">
            View Experiments
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Weight Approvals</h3>
          <p className="text-sm text-gray-400 mb-4">
            Review pending weight change requests
          </p>
          <Button onClick={() => router.push("/dashboard/weights")} className="w-full">
            Review
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Export Reports</h3>
          <p className="text-sm text-gray-400 mb-4">
            Download executive summary reports
          </p>
          <Button onClick={() => router.push("/dashboard/topsis/run")} className="w-full">
            Export
          </Button>
        </Card>
      </div>

      {/* Recent Winners */}
      {experimentsWithWinners.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Winners</h3>
          <div className="space-y-3">
            {experimentsWithWinners.slice(0, 5).map((exp) => (
              <div
                key={exp.id}
                onClick={() => router.push(`/dashboard/experiments/${exp.id}`)}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-800 hover:border-green-500/50 cursor-pointer transition"
              >
                <div className="flex-1">
                  <div className="font-medium text-white">{exp.name}</div>
                  <div className="text-sm text-gray-400">
                    Winner: {exp.variants.find((v) => v.id === exp.winner)?.name}
                  </div>
                </div>
                <div className="text-sm text-green-400">✓ Completed</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

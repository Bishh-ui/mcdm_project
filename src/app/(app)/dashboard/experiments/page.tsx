"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { subscribeToCollection } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import type { Experiment } from "@/lib/experiments/types";

export default function ExperimentsPage() {
  const router = useRouter();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToCollection<Experiment>(
      COLLECTIONS.EXPERIMENTS,
      (data) => {
        setExperiments(data.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const getStatusVariant = (status: Experiment["status"]): "cyan" | "lime" | "amber" | "pink" | "purple" | "neutral" => {
    switch (status) {
      case "running":
        return "lime";
      case "completed":
        return "cyan";
      case "paused":
        return "amber";
      case "draft":
        return "neutral";
      case "archived":
        return "purple";
      default:
        return "neutral";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Experiments"
          description="A/B test TOPSIS rankings vs control"
        />
        <div className="text-center py-12 text-gray-400">Loading experiments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Experiments"
        description="A/B test TOPSIS rankings vs control"
        actions={
          <Button onClick={() => router.push("/dashboard/experiments/new")}>
            Create Experiment
          </Button>
        }
      />

      {experiments.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-gray-400 mb-4">No experiments yet</div>
          <Button onClick={() => router.push("/dashboard/experiments/new")}>
            Create Your First Experiment
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {experiments.map((experiment) => (
            <div
              key={experiment.id}
              onClick={() => router.push(`/dashboard/experiments/${experiment.id}`)}
              className="cursor-pointer"
            >
              <Card className="p-6 hover:border-blue-500/50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {experiment.name}
                    </h3>
                    <p className="text-sm text-gray-400">{experiment.hypothesis}</p>
                  </div>
                  <Badge variant={getStatusVariant(experiment.status)}>
                    {experiment.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Variants</div>
                    <div className="text-white font-medium">{experiment.variants.length}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Traffic</div>
                    <div className="text-white font-medium">{experiment.trafficAllocation}%</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Primary Metric</div>
                    <div className="text-white font-medium capitalize">
                      {experiment.primaryMetric.replace(/_/g, " ")}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Created</div>
                    <div className="text-white font-medium">
                      {new Date(experiment.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {experiment.winner && (
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400">Winner:</span>
                      <span className="text-green-500 font-medium">
                        {experiment.variants.find((v) => v.id === experiment.winner)?.name}
                      </span>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

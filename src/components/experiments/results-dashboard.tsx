"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { subscribeToDocument } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import type { Experiment, ExperimentResult } from "@/lib/experiments/types";

interface ResultsDashboardProps {
  experimentId: string;
}

export function ResultsDashboard({ experimentId }: ResultsDashboardProps) {
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [results, setResults] = useState<ExperimentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToDocument<Experiment>(
      `${COLLECTIONS.EXPERIMENTS}/${experimentId}`,
      (data) => {
        setExperiment(data);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [experimentId]);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/experiments/${experimentId}/results`);
        if (!response.ok) throw new Error("Failed to fetch results");
        const data = await response.json();
        setResults(data.results || []);
      } catch (err) {
        console.error("Failed to fetch results:", err);
      }
    };

    if (experiment?.status === "running" || experiment?.status === "completed") {
      fetchResults();
      const interval = setInterval(fetchResults, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [experiment?.status, experimentId]);

  const handleAction = async (action: "start" | "pause" | "complete" | "declare_winner", winnerId?: string) => {
    setActionLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/experiments/${experimentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, winnerId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Action failed");
      }

      // Refetch results after action
      const resultsResponse = await fetch(`/api/experiments/${experimentId}/results`);
      if (resultsResponse.ok) {
        const data = await resultsResponse.json();
        setResults(data.results || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading experiment...</div>;
  }

  if (!experiment) {
    return <div className="text-center py-12 text-gray-400">Experiment not found</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <Card className="p-4 bg-red-500/10 border-red-500/50">
          <div className="text-red-500 text-sm">{error}</div>
        </Card>
      )}

      {/* Experiment Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{experiment.name}</h2>
            <p className="text-gray-400">{experiment.hypothesis}</p>
          </div>
          <Badge
            variant={
              experiment.status === "running"
                ? "lime"
                : experiment.status === "completed"
                  ? "cyan"
                  : "neutral"
            }
          >
            {experiment.status}
          </Badge>
        </div>

        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Primary Metric</div>
            <div className="text-white font-medium capitalize">
              {experiment.primaryMetric.replace(/_/g, " ")}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Traffic Allocation</div>
            <div className="text-white font-medium">{experiment.trafficAllocation}%</div>
          </div>
          <div>
            <div className="text-gray-400">Required Sample Size</div>
            <div className="text-white font-medium">
              {experiment.requiredSampleSize.toLocaleString()} per variant
            </div>
          </div>
          <div>
            <div className="text-gray-400">Confidence Level</div>
            <div className="text-white font-medium">
              {(experiment.confidenceLevel * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          {experiment.status === "draft" && (
            <Button onClick={() => handleAction("start")} disabled={actionLoading}>
              Start Experiment
            </Button>
          )}
          {experiment.status === "running" && (
            <>
              <Button
                onClick={() => handleAction("pause")}
                disabled={actionLoading}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Pause
              </Button>
              <Button
                onClick={() => handleAction("complete")}
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Complete
              </Button>
            </>
          )}
          {experiment.status === "paused" && (
            <Button onClick={() => handleAction("start")} disabled={actionLoading}>
              Resume
            </Button>
          )}
        </div>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <>
          <div className="grid gap-4">
            {experiment.variants.map((variant) => {
              const variantResults = results.find((r) => r.variantId === variant.id);
              if (!variantResults) return null;

              const isControl = variant.isControl;
              const progress =
                (variantResults.visitors / experiment.requiredSampleSize) * 100;

              return (
                <Card key={variant.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {variant.name}
                      </h3>
                      <p className="text-sm text-gray-400">{variant.description}</p>
                    </div>
                    {isControl && (
                      <Badge variant="neutral">Control</Badge>
                    )}
                    {experiment.winner === variant.id && (
                      <Badge variant="lime">Winner</Badge>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Sample Size Progress</span>
                      <span>{progress.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-gray-400">Visitors</div>
                      <div className="text-lg font-semibold text-white">
                        {variantResults.visitors.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Conversions</div>
                      <div className="text-lg font-semibold text-white">
                        {variantResults.conversions.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Conversion Rate</div>
                      <div className="text-lg font-semibold text-white">
                        {(variantResults.conversionRate * 100).toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Revenue/Visitor</div>
                      <div className="text-lg font-semibold text-white">
                        ${variantResults.revenuePerVisitor.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Statistical Significance */}
                  {!isControl && variantResults.frequentist && (
                    <div className="pt-4 border-t border-gray-800">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-400">Uplift</div>
                          <div
                            className={`font-semibold ${
                              variantResults.frequentist.upliftPercent > 0
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          >
                            {variantResults.frequentist.upliftPercent > 0 ? "+" : ""}
                            {variantResults.frequentist.upliftPercent.toFixed(2)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">P-Value</div>
                          <div className="font-semibold text-white">
                            {variantResults.frequentist.pValue.toFixed(4)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Significant?</div>
                          <div
                            className={`font-semibold ${
                              variantResults.frequentist.significant
                                ? "text-green-500"
                                : "text-gray-400"
                            }`}
                          >
                            {variantResults.frequentist.significant ? "Yes" : "No"}
                          </div>
                        </div>
                      </div>

                      {variantResults.bayesian && (
                        <div className="mt-4 pt-4 border-t border-gray-800">
                          <div className="text-xs text-gray-400 mb-2">Bayesian Analysis</div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-gray-400">Probability to Beat Control</div>
                              <div className="font-semibold text-white">
                                {(variantResults.bayesian.probabilityToBeBest * 100).toFixed(1)}%
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400">Expected Loss</div>
                              <div className="font-semibold text-white">
                                {(variantResults.bayesian.expectedLoss * 100).toFixed(3)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {variantResults.frequentist.significant &&
                        !experiment.winner &&
                        experiment.status === "running" && (
                          <div className="mt-4">
                            <Button
                              onClick={() => handleAction("declare_winner", variant.id)}
                              disabled={actionLoading}
                              className="w-full bg-green-600 hover:bg-green-700"
                            >
                              Declare Winner
                            </Button>
                          </div>
                        )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}

      {results.length === 0 && experiment.status !== "draft" && (
        <Card className="p-12 text-center">
          <div className="text-gray-400">
            No data available yet. Results will appear once users start interacting with the
            experiment.
          </div>
        </Card>
      )}
    </div>
  );
}

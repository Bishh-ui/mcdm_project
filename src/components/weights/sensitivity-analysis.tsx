"use client";

import { useState, useMemo } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFirestoreState } from "@/lib/hooks/use-firestore-state";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import { generateId } from "@/lib/id";
import { runTopsis, runSensitivityAnalysis } from "@/lib/topsis/engine";
import type { Criterion, TopsisPolicy, Alternative, TopsisResult } from "@/lib/topsis";

export function SensitivityAnalysis() {
  const [criteria] = useFirestoreState<Criterion[]>(COLLECTIONS.CRITERIA, []);
  const [policies] = useFirestoreState<TopsisPolicy[]>(COLLECTIONS.POLICIES, []);
  const [activeId] = useFirestoreState<string | null>("mcdm:active-policy", null);

  const policy = policies.find((p) => p.id === activeId) ?? policies[0] ?? null;

  const [perturbation, setPerturbation] = useState(10);
  const [sliderWeights, setSliderWeights] = useState<Record<string, number>>({});
  const [baseResult, setBaseResult] = useState<TopsisResult | null>(null);
  const [perturbedResult, setPerturbedResult] = useState<TopsisResult | null>(null);

  // Generate sample alternatives for analysis
  const sampleAlternatives = useMemo((): Alternative[] => {
    if (criteria.length === 0) return [];
    return ["Product A", "Product B", "Product C", "Product D", "Product E"].map(
      (name) => ({
        id: generateId(),
        name,
        values: criteria.map(() => Math.round((Math.random() * 8 + 2) * 10) / 10),
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [criteria.length]);

  // Initialize slider weights from criteria
  const activeWeights = useMemo(() => {
    const w: Record<string, number> = {};
    criteria.forEach((c) => {
      w[c.id] = sliderWeights[c.id] ?? c.weight;
    });
    return w;
  }, [criteria, sliderWeights]);

  const handleSliderChange = (criterionId: string, value: number) => {
    const updated = { ...sliderWeights, [criterionId]: value };
    setSliderWeights(updated);

    // Re-normalize and run TOPSIS with new weights
    if (!policy || sampleAlternatives.length < 2) return;

    const totalWeight = Object.values({ ...activeWeights, [criterionId]: value }).reduce(
      (s, v) => s + v,
      0
    );
    if (totalWeight === 0) return;

    const adjustedCriteria = criteria.map((c) => ({
      ...c,
      weight: (c.id === criterionId ? value : (sliderWeights[c.id] ?? c.weight)) / totalWeight,
    }));

    try {
      const result = runTopsis({
        criteria: adjustedCriteria,
        alternatives: sampleAlternatives,
        policy,
      });
      setPerturbedResult(result);
    } catch {
      // Invalid weights
    }
  };

  const runAnalysis = () => {
    if (!policy || criteria.length === 0 || sampleAlternatives.length < 2) return;

    try {
      const base = runTopsis({ criteria, alternatives: sampleAlternatives, policy });
      setBaseResult(base);
      setPerturbedResult(base);
      // Reset sliders
      setSliderWeights({});
    } catch {
      // Error
    }
  };

  const sensitivityResults = useMemo(() => {
    if (!policy || criteria.length === 0 || sampleAlternatives.length < 2) return null;
    try {
      return runSensitivityAnalysis(
        { criteria, alternatives: sampleAlternatives, policy },
        perturbation
      );
    } catch {
      return null;
    }
  }, [criteria, sampleAlternatives, policy, perturbation]);

  // Detect rank reversals between base and perturbed
  const reversals = useMemo(() => {
    if (!baseResult || !perturbedResult) return [];
    const result: Array<{ name: string; from: number; to: number }> = [];
    for (const base of baseResult.rankings) {
      const perturbed = perturbedResult.rankings.find(
        (r) => r.alternative.id === base.alternative.id
      );
      if (perturbed && perturbed.rank !== base.rank) {
        result.push({
          name: base.alternative.name,
          from: base.rank,
          to: perturbed.rank,
        });
      }
    }
    return result;
  }, [baseResult, perturbedResult]);

  if (criteria.length === 0 || !policy) {
    return (
      <Card className="py-16 text-center">
        <p className="text-lg text-[var(--muted)]">
          {criteria.length === 0 ? "No criteria defined" : "No TOPSIS policy configured"}
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]/60">
          Set up criteria and a policy first to run sensitivity analysis.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={runAnalysis}>Run Sensitivity Analysis</Button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--muted)]">Perturbation:</span>
          {[10, 20, 50].map((p) => (
            <button
              key={p}
              onClick={() => setPerturbation(p)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                perturbation === p
                  ? "bg-cyan-400/15 text-cyan-300 border border-cyan-400/30"
                  : "bg-white/5 text-[var(--muted)] border border-white/10 hover:bg-white/10"
              }`}
            >
              ±{p}%
            </button>
          ))}
        </div>
      </div>

      {/* Weight sliders */}
      {baseResult && (
        <Card>
          <CardHeader
            tag="What-If"
            title="Weight Perturbation Sliders"
            description="Drag sliders to see how weight changes affect rankings in real-time"
          />
          <div className="space-y-4">
            {criteria.map((c) => {
              const currentWeight = activeWeights[c.id] ?? c.weight;
              return (
                <div key={c.id} className="flex items-center gap-4">
                  <span className="w-40 shrink-0 text-sm text-white">{c.name}</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(currentWeight * 100)}
                    onChange={(e) =>
                      handleSliderChange(c.id, parseInt(e.target.value) / 100)
                    }
                    className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-400"
                  />
                  <span className="w-14 text-right font-mono text-sm text-cyan-300">
                    {currentWeight.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Rank reversal alerts */}
          {reversals.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 p-4">
              <p className="text-sm font-medium text-amber-200">
                ⚠ Rank Reversals Detected ({reversals.length})
              </p>
              <div className="mt-2 space-y-1">
                {reversals.map((r) => (
                  <p key={r.name} className="text-xs text-amber-100/80">
                    {r.name}: #{r.from} → #{r.to}
                  </p>
                ))}
              </div>
            </div>
          )}

          {reversals.length === 0 && baseResult && (
            <div className="mt-4 rounded-lg border border-lime-400/30 bg-lime-400/10 p-3">
              <p className="text-sm text-lime-200">✓ Rankings are stable under current perturbation</p>
            </div>
          )}
        </Card>
      )}

      {/* Live perturbed rankings */}
      {perturbedResult && (
        <Card>
          <CardHeader
            tag="Live Rankings"
            title="Current Rankings with Adjusted Weights"
          />
          <div className="space-y-2">
            {perturbedResult.rankings.map((r) => {
              const baseRank = baseResult?.rankings.find(
                (br) => br.alternative.id === r.alternative.id
              )?.rank;
              const changed = baseRank !== undefined && baseRank !== r.rank;
              return (
                <div
                  key={r.alternative.id}
                  className={`flex items-center gap-4 rounded-lg border px-4 py-3 ${
                    changed ? "border-amber-400/30 bg-amber-400/5" : "border-white/10 bg-white/5"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${
                      r.rank === 1 ? "bg-lime-400/20 text-lime-300" : "bg-white/10 text-[var(--muted)]"
                    }`}
                  >
                    #{r.rank}
                  </span>
                  <span className="flex-1 text-sm text-white">{r.alternative.name}</span>
                  <span className="font-mono text-sm text-cyan-300">
                    {r.closenessCoefficient.toFixed(4)}
                  </span>
                  {changed && baseRank !== undefined && (
                    <Badge variant="amber">was #{baseRank}</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Automated sensitivity results */}
      {sensitivityResults && (
        <Card>
          <CardHeader
            tag={`±${perturbation}% Analysis`}
            tagColor="text-purple-200/90"
            title="Per-Criterion Stability Check"
            description={`Each criterion's weight increased by ${perturbation}% (others re-normalized). Shows if rankings change.`}
          />
          <div className="space-y-2">
            {sensitivityResults.map((sr) => (
              <div
                key={sr.criterionId}
                className={`flex items-center gap-4 rounded-lg border px-4 py-3 ${
                  sr.isStable ? "border-white/10 bg-white/5" : "border-amber-400/30 bg-amber-400/5"
                }`}
              >
                <span className="min-w-0 flex-1 text-sm text-white">{sr.criterionName}</span>
                {sr.isStable ? (
                  <Badge variant="lime">Stable</Badge>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge variant="amber">{sr.rankReversals.length} reversal(s)</Badge>
                    <span className="text-xs text-amber-200/80">
                      {sr.rankReversals.map((rr) => `${rr.alternative}: #${rr.originalRank}→#${rr.newRank}`).join(", ")}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

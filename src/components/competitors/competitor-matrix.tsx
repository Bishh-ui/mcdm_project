"use client";

import React from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFirestoreState } from "@/lib/hooks/use-firestore-state";
import { useAudit } from "@/lib/hooks/use-audit";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import {
  DEFAULT_COMPETITORS,
  DEFAULT_CAPABILITIES,
  getScoreColor,
  type CompetitorMatrix as MatrixType,
} from "@/lib/types/competitor";

const defaultMatrix: MatrixType = {
  competitors: DEFAULT_COMPETITORS,
  capabilities: DEFAULT_CAPABILITIES,
  scores: [],
  updatedAt: new Date().toISOString(),
};

export function CompetitorMatrix() {
  const [matrix, setMatrix] = useFirestoreState<MatrixType>(
    COLLECTIONS.COMPETITOR_MATRIX,
    defaultMatrix
  );
  const logAudit = useAudit();

  const getScore = (competitorId: string, capabilityId: string): number => {
    return (
      matrix.scores.find(
        (s) => s.competitorId === competitorId && s.capabilityId === capabilityId
      )?.score ?? 0
    );
  };

  const setScore = (competitorId: string, capabilityId: string, score: number) => {
    const existing = matrix.scores.filter(
      (s) => !(s.competitorId === competitorId && s.capabilityId === capabilityId)
    );
    const previousScore = getScore(competitorId, capabilityId);
    const newMatrix = {
      ...matrix,
      scores: [...existing, { competitorId, capabilityId, score }],
      updatedAt: new Date().toISOString(),
    };
    setMatrix(newMatrix);
    logAudit(
      "update",
      "competitor_score",
      `${competitorId}:${capabilityId}`,
      { score: previousScore },
      { score }
    );
  };

  const getCompetitorAvg = (competitorId: string): number => {
    const scores = matrix.capabilities
      .map((cap) => getScore(competitorId, cap.id))
      .filter((s) => s > 0);
    if (scores.length === 0) return 0;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  const getCapabilityGap = (capabilityId: string): number => {
    const ourScore = getScore("mcdm-ours", capabilityId);
    const competitorScores = matrix.competitors
      .filter((c) => c.id !== "mcdm-ours")
      .map((c) => getScore(c.id, capabilityId))
      .filter((s) => s > 0);
    if (competitorScores.length === 0) return 0;
    const maxCompetitor = Math.max(...competitorScores);
    return ourScore - maxCompetitor;
  };

  const handleExportCsv = () => {
    const header = ["Capability", ...matrix.competitors.map((c) => c.name), "Gap"].join(",");
    const rows = matrix.capabilities.map((cap) => {
      const scores = matrix.competitors.map((c) => getScore(c.id, cap.id) || "");
      const gap = getCapabilityGap(cap.id);
      return [`"${cap.name}"`, ...scores, gap].join(",");
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "competitor-matrix.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Group capabilities by category
  const categories = [...new Set(matrix.capabilities.map((c) => c.category))];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={handleExportCsv}>
          Export CSV
        </Button>
        <div className="ml-auto flex items-center gap-4 text-xs text-[var(--muted)]">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-red-500/30" /> 1
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-orange-500/30" /> 2
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-amber-500/30" /> 3
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-lime-500/30" /> 4
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-emerald-500/30" /> 5
          </span>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Capability × Competitor Heatmap"
          description="Click cells to cycle scores 0→1→2→3→4→5→0. Our column is highlighted."
        />
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                <th className="sticky left-0 z-10 bg-[var(--surface)] px-3 py-2 text-left font-medium text-[var(--muted)]">
                  Capability
                </th>
                {matrix.competitors.map((comp) => (
                  <th
                    key={comp.id}
                    className={`px-2 py-2 text-center font-medium ${
                      comp.id === "mcdm-ours"
                        ? "text-cyan-300 bg-cyan-400/5"
                        : "text-[var(--muted)]"
                    }`}
                  >
                    <div className="min-w-[70px]">{comp.name}</div>
                  </th>
                ))}
                <th className="px-2 py-2 text-center font-medium text-[var(--muted)]">Gap</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <React.Fragment key={`cat-${category}`}>
                  <tr>
                    <td
                      colSpan={matrix.competitors.length + 2}
                      className="bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]"
                    >
                      {category}
                    </td>
                  </tr>
                  {matrix.capabilities
                    .filter((cap) => cap.category === category)
                    .map((cap) => {
                      const gap = getCapabilityGap(cap.id);
                      return (
                        <tr key={cap.id} className="border-b border-white/5">
                          <td className="sticky left-0 z-10 bg-[var(--surface)] px-3 py-2 font-medium text-white/80">
                            {cap.name}
                          </td>
                          {matrix.competitors.map((comp) => {
                            const score = getScore(comp.id, cap.id);
                            return (
                              <td
                                key={comp.id}
                                className={`px-2 py-2 text-center ${
                                  comp.id === "mcdm-ours" ? "bg-cyan-400/5" : ""
                                }`}
                              >
                                <button
                                  onClick={() =>
                                    setScore(comp.id, cap.id, score >= 5 ? 0 : score + 1)
                                  }
                                  className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold transition hover:scale-110 ${
                                    score > 0 ? getScoreColor(score) : "bg-white/5 text-white/20"
                                  }`}
                                >
                                  {score || "·"}
                                </button>
                              </td>
                            );
                          })}
                          <td className="px-2 py-2 text-center">
                            <span
                              className={`font-mono font-bold ${
                                gap > 0
                                  ? "text-lime-300"
                                  : gap < 0
                                    ? "text-red-300"
                                    : "text-[var(--muted)]"
                              }`}
                            >
                              {gap > 0 ? `+${gap}` : gap === 0 ? "—" : gap}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </React.Fragment>
              ))}
              {/* Average row */}
              <tr className="border-t border-white/15">
                <td className="sticky left-0 z-10 bg-[var(--surface)] px-3 py-2 font-semibold text-white">
                  Average
                </td>
                {matrix.competitors.map((comp) => {
                  const avg = getCompetitorAvg(comp.id);
                  return (
                    <td
                      key={comp.id}
                      className={`px-2 py-2 text-center font-mono font-bold ${
                        comp.id === "mcdm-ours" ? "text-cyan-300 bg-cyan-400/5" : "text-white/80"
                      }`}
                    >
                      {avg > 0 ? avg.toFixed(1) : "—"}
                    </td>
                  );
                })}
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

"use client";

import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TopsisResult } from "@/lib/topsis";

interface ResultsViewProps {
  result: TopsisResult;
}

export function ResultsView({ result }: ResultsViewProps) {
  const maxCC = Math.max(
    ...result.rankings.map((r) => r.closenessCoefficient)
  );

  return (
    <Card>
      <CardHeader
        tag="Results"
        tagColor="text-lime-200/90"
        title="TOPSIS Rankings"
        description={`Computed at ${new Date(result.computedAt).toLocaleString()} using ${result.policy.normalization} normalization`}
      />

      <div className="space-y-3">
        {result.rankings.map((ranked) => {
          const barWidth =
            maxCC > 0
              ? (ranked.closenessCoefficient / maxCC) * 100
              : 0;

          return (
            <div
              key={ranked.alternative.id}
              className="rounded-lg border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg font-bold ${
                    ranked.rank === 1
                      ? "bg-lime-400/20 text-lime-300"
                      : ranked.rank === 2
                        ? "bg-cyan-400/20 text-cyan-300"
                        : ranked.rank === 3
                          ? "bg-amber-400/20 text-amber-300"
                          : "bg-white/10 text-[var(--muted)]"
                  }`}
                >
                  #{ranked.rank}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {ranked.alternative.name}
                    </span>
                    <Badge
                      variant={
                        ranked.rank === 1
                          ? "lime"
                          : ranked.rank <= 3
                            ? "cyan"
                            : "neutral"
                      }
                    >
                      CC: {ranked.closenessCoefficient.toFixed(4)}
                    </Badge>
                  </div>

                  {/* Bar */}
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full transition-all ${
                        ranked.rank === 1
                          ? "bg-lime-400"
                          : ranked.rank === 2
                            ? "bg-cyan-400"
                            : ranked.rank === 3
                              ? "bg-amber-400"
                              : "bg-white/30"
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>

                  {/* Distances */}
                  <div className="mt-1.5 flex gap-4 text-xs text-[var(--muted)]">
                    <span>
                      D⁺ (ideal): {ranked.distanceFromIdeal.toFixed(4)}
                    </span>
                    <span>
                      D⁻ (anti-ideal): {ranked.distanceFromAntiIdeal.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

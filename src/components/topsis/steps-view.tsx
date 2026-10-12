"use client";

import { Card, CardHeader } from "@/components/ui/card";
import type { TopsisResult } from "@/lib/topsis";

interface StepsViewProps {
  result: TopsisResult;
}

function MatrixTable({
  matrix,
  rowLabels,
  colLabels,
}: {
  matrix: number[][];
  rowLabels: string[];
  colLabels: string[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/10">
            <th className="px-2 py-1.5 text-left text-[var(--muted)]" />
            {colLabels.map((label) => (
              <th
                key={label}
                className="px-2 py-1.5 text-center font-medium text-[var(--muted)]"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={rowLabels[i]} className="border-b border-white/5">
              <td className="px-2 py-1.5 font-medium text-[var(--muted)]">
                {rowLabels[i]}
              </td>
              {row.map((val, j) => (
                <td
                  key={j}
                  className="px-2 py-1.5 text-center font-mono text-white/80"
                >
                  {val.toFixed(4)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StepsView({ result }: StepsViewProps) {
  const { steps, criteria, rankings } = result;

  // Build ordered names matching the decision matrix row order
  // The decision matrix rows correspond to the original alternatives order
  // We need to map from the input order (which matches steps arrays)
  const inputAlternatives = rankings
    .slice()
    .sort((a, b) => {
      // Find original index by matching closeness coefficients
      const aIdx = steps.closenessCoefficients.indexOf(a.closenessCoefficient);
      const bIdx = steps.closenessCoefficients.indexOf(b.closenessCoefficient);
      return aIdx - bIdx;
    })
    .map((r) => r.alternative.name);

  const criteriaNames = criteria.map((c) => c.name);

  return (
    <div className="space-y-6">
      {/* Step 1: Decision Matrix */}
      <Card>
        <CardHeader
          tag="Step 1"
          tagColor="text-cyan-200/90"
          title="Decision Matrix"
          description="Raw input values for each alternative × criterion"
        />
        <MatrixTable
          matrix={steps.decisionMatrix}
          rowLabels={inputAlternatives}
          colLabels={criteriaNames}
        />
      </Card>

      {/* Step 2: Normalized Matrix */}
      <Card>
        <CardHeader
          tag="Step 2"
          tagColor="text-cyan-200/90"
          title="Normalized Matrix"
          description={`Normalized using ${result.policy.normalization} method`}
        />
        <MatrixTable
          matrix={steps.normalizedMatrix}
          rowLabels={inputAlternatives}
          colLabels={criteriaNames}
        />
      </Card>

      {/* Step 3: Weighted Normalized Matrix */}
      <Card>
        <CardHeader
          tag="Step 3"
          tagColor="text-cyan-200/90"
          title="Weighted Normalized Matrix"
          description="Each normalized value multiplied by its criterion weight"
        />
        <MatrixTable
          matrix={steps.weightedMatrix}
          rowLabels={inputAlternatives}
          colLabels={criteriaNames}
        />
      </Card>

      {/* Step 4: Ideal & Anti-Ideal */}
      <Card>
        <CardHeader
          tag="Step 4"
          tagColor="text-lime-200/90"
          title="Ideal & Anti-Ideal Solutions"
          description="Best and worst possible values per criterion"
        />
        <MatrixTable
          matrix={[steps.idealSolution, steps.antiIdealSolution]}
          rowLabels={["Ideal (A⁺)", "Anti-Ideal (A⁻)"]}
          colLabels={criteriaNames}
        />
      </Card>

      {/* Step 5: Distances */}
      <Card>
        <CardHeader
          tag="Step 5"
          tagColor="text-amber-200/90"
          title="Distances & Closeness Coefficients"
          description="Euclidean distance from ideal/anti-ideal and final CC score"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-2 py-1.5 text-left text-[var(--muted)]">
                  Alternative
                </th>
                <th className="px-2 py-1.5 text-center text-[var(--muted)]">
                  D⁺ (from ideal)
                </th>
                <th className="px-2 py-1.5 text-center text-[var(--muted)]">
                  D⁻ (from anti-ideal)
                </th>
                <th className="px-2 py-1.5 text-center text-[var(--muted)]">
                  CC (closeness)
                </th>
                <th className="px-2 py-1.5 text-center text-[var(--muted)]">
                  Rank
                </th>
              </tr>
            </thead>
            <tbody>
              {inputAlternatives.map((name, i) => {
                const ranked = rankings.find(
                  (r) => r.alternative.name === name
                );
                return (
                  <tr key={name} className="border-b border-white/5">
                    <td className="px-2 py-1.5 font-medium text-[var(--muted)]">
                      {name}
                    </td>
                    <td className="px-2 py-1.5 text-center font-mono text-white/80">
                      {steps.distancesFromIdeal[i]?.toFixed(4)}
                    </td>
                    <td className="px-2 py-1.5 text-center font-mono text-white/80">
                      {steps.distancesFromAntiIdeal[i]?.toFixed(4)}
                    </td>
                    <td className="px-2 py-1.5 text-center font-mono text-cyan-300">
                      {steps.closenessCoefficients[i]?.toFixed(4)}
                    </td>
                    <td className="px-2 py-1.5 text-center font-bold text-lime-300">
                      #{ranked?.rank}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

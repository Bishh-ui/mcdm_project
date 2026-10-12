"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFirestoreState } from "@/lib/hooks/use-firestore-state";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import { generateId } from "@/lib/id";
import { runTopsis } from "@/lib/topsis/engine";
import type {
  Criterion,
  TopsisPolicy,
  Alternative,
  TopsisResult,
} from "@/lib/topsis";
import { ResultsView } from "./results-view";
import { StepsView } from "./steps-view";

export function TopsisRunner() {
  const [criteria] = useFirestoreState<Criterion[]>(COLLECTIONS.CRITERIA, []);
  const [policies] = useFirestoreState<TopsisPolicy[]>(COLLECTIONS.POLICIES, []);
  const [activeId] = useFirestoreState<string | null>("mcdm:active-policy", null);

  const policy = policies.find((p) => p.id === activeId) ?? policies[0] ?? null;

  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [result, setResult] = useState<TopsisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(false);

  const addAlternative = () => {
    setAlternatives([
      ...alternatives,
      {
        id: generateId(),
        name: `Alternative ${alternatives.length + 1}`,
        values: new Array(criteria.length).fill(0),
      },
    ]);
    setResult(null);
  };

  const removeAlternative = (id: string) => {
    setAlternatives(alternatives.filter((a) => a.id !== id));
    setResult(null);
  };

  const updateAlternativeName = (id: string, name: string) => {
    setAlternatives(
      alternatives.map((a) => (a.id === id ? { ...a, name } : a))
    );
  };

  const updateAlternativeValue = (
    altId: string,
    criterionIndex: number,
    value: number
  ) => {
    setAlternatives(
      alternatives.map((a) => {
        if (a.id !== altId) return a;
        const newValues = [...a.values];
        newValues[criterionIndex] = value;
        return { ...a, values: newValues };
      })
    );
    setResult(null);
  };

  const handleRun = () => {
    if (!policy) {
      setError("No TOPSIS policy configured. Create one in TOPSIS Config.");
      return;
    }
    if (criteria.length === 0) {
      setError("No criteria defined. Add criteria in the Criteria page.");
      return;
    }
    if (alternatives.length < 2) {
      setError("At least 2 alternatives are required for ranking.");
      return;
    }

    setError(null);
    try {
      const output = runTopsis({ criteria, alternatives, policy });
      setResult(output);
    } catch (e) {
      setError(e instanceof Error ? e.message : "TOPSIS computation failed");
    }
  };

  const handleExport = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `topsis-result-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadSampleData = () => {
    if (criteria.length === 0) return;
    const sampleAlts: Alternative[] = [
      "Product Alpha",
      "Product Beta",
      "Product Gamma",
      "Product Delta",
      "Product Epsilon",
    ].map((name) => ({
      id: generateId(),
      name,
      values: criteria.map(() =>
        Math.round((Math.random() * 9 + 1) * 10) / 10
      ),
    }));
    setAlternatives(sampleAlts);
    setResult(null);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        // Support two formats:
        // 1. Array of { name, values } objects
        // 2. { alternatives: [...] } wrapper
        const raw: Array<{ name: string; values: number[] }> =
          Array.isArray(data) ? data : data.alternatives;
        if (!Array.isArray(raw) || raw.length === 0) {
          setError("JSON must be an array of { name, values } objects.");
          return;
        }
        const imported: Alternative[] = raw.map((item) => ({
          id: generateId(),
          name: item.name || "Unnamed",
          values:
            item.values?.length === criteria.length
              ? item.values
              : new Array(criteria.length).fill(0),
        }));
        setAlternatives(imported);
        setResult(null);
        setError(null);
      } catch {
        setError("Invalid JSON file. Expected array of { name, values }.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleExportCsv = () => {
    if (!result) return;
    const header = [
      "Rank",
      "Alternative",
      "Closeness Coefficient",
      "Distance from Ideal",
      "Distance from Anti-Ideal",
      ...criteria.map((c) => c.name),
    ].join(",");

    const rows = result.rankings.map((r) => {
      const altValues = r.alternative.values.join(",");
      return [
        r.rank,
        `"${r.alternative.name}"`,
        r.closenessCoefficient.toFixed(6),
        r.distanceFromIdeal.toFixed(6),
        r.distanceFromAntiIdeal.toFixed(6),
        altValues,
      ].join(",");
    });

    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `topsis-result-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Pre-flight checks
  if (criteria.length === 0) {
    return (
      <Card className="py-16 text-center">
        <p className="text-lg text-[var(--muted)]">No criteria defined</p>
        <p className="mt-2 text-sm text-[var(--muted)]/60">
          Go to the Criteria page to define your decision criteria first.
        </p>
      </Card>
    );
  }

  if (!policy) {
    return (
      <Card className="py-16 text-center">
        <p className="text-lg text-[var(--muted)]">
          No TOPSIS policy configured
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]/60">
          Go to TOPSIS Config to create a policy pack first.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active policy info */}
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-[var(--muted)]">
            Active Policy:
          </span>
          <Badge variant="cyan">{policy.name}</Badge>
          <Badge variant="neutral">{policy.normalization}</Badge>
          <Badge variant="neutral">{policy.tieBreak}</Badge>
          <span className="text-xs text-[var(--muted)]">
            {criteria.length} criteria
          </span>
        </div>
      </Card>

      {/* Alternatives input */}
      <Card>
        <CardHeader
          title="Decision Matrix"
          description="Score each alternative against every criterion"
          actions={
            <div className="flex gap-2">
              <label className="cursor-pointer">
                <span className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:-translate-y-px hover:bg-white/10">
                  Import JSON
                </span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportJson}
                />
              </label>
              <Button size="sm" variant="secondary" onClick={loadSampleData}>
                Load Sample
              </Button>
              <Button size="sm" onClick={addAlternative}>
                + Alternative
              </Button>
            </div>
          }
        />

        {alternatives.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-3 py-2 text-left text-xs font-medium text-[var(--muted)]">
                    Alternative
                  </th>
                  {criteria.map((c) => (
                    <th
                      key={c.id}
                      className="px-3 py-2 text-center text-xs font-medium text-[var(--muted)]"
                    >
                      <div>{c.name}</div>
                      <div className="mt-0.5 font-normal opacity-60">
                        {c.type === "benefit" ? "↑" : "↓"} w=
                        {c.weight.toFixed(2)}
                      </div>
                    </th>
                  ))}
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {alternatives.map((alt) => (
                  <tr key={alt.id} className="border-b border-white/5">
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={alt.name}
                        onChange={(e) =>
                          updateAlternativeName(alt.id, e.target.value)
                        }
                        className="w-full rounded border border-white/10 bg-transparent px-2 py-1 text-sm text-white outline-none focus:border-cyan-400/50"
                      />
                    </td>
                    {criteria.map((c, ci) => (
                      <td key={c.id} className="px-3 py-2">
                        <input
                          type="number"
                          step="0.1"
                          value={alt.values[ci]}
                          onChange={(e) =>
                            updateAlternativeValue(
                              alt.id,
                              ci,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full rounded border border-white/10 bg-transparent px-2 py-1 text-center text-sm text-white outline-none focus:border-cyan-400/50"
                        />
                      </td>
                    ))}
                    <td className="px-1 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAlternative(alt.id)}
                      >
                        ✕
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-[var(--muted)]">
            Add alternatives to build the decision matrix.
          </p>
        )}
      </Card>

      {/* Run button */}
      {alternatives.length >= 2 && (
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg" onClick={handleRun}>
            ▷ Run TOPSIS Analysis
          </Button>
          {result && (
            <>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setShowSteps(!showSteps)}
              >
                {showSteps ? "Hide" : "Show"} Calculation Steps
              </Button>
              <Button variant="secondary" size="lg" onClick={handleExport}>
                Export JSON
              </Button>
              <Button variant="secondary" size="lg" onClick={handleExportCsv}>
                Export CSV
              </Button>
            </>
          )}
        </div>
      )}

      {error && (
        <Card className="border-red-400/30">
          <p className="text-sm text-red-300">{error}</p>
        </Card>
      )}

      {/* Results */}
      {result && <ResultsView result={result} />}

      {/* Step-by-step breakdown */}
      {result && showSteps && <StepsView result={result} />}
    </div>
  );
}

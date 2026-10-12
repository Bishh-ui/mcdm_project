"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useFirestoreState } from "@/lib/hooks/use-firestore-state";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import { generateId } from "@/lib/id";
import { useAudit } from "@/lib/hooks/use-audit";
import type {
  TopsisPolicy,
  NormalizationMethod,
  TieBreakPolicy,
} from "@/lib/topsis";

const normalizationOptions = [
  { value: "vector", label: "Vector Normalization (L2 norm)" },
  { value: "min-max", label: "Min-Max Normalization (0-1 scaling)" },
  { value: "max", label: "Max Normalization (divide by max)" },
];

const tieBreakOptions = [
  { value: "favor-first", label: "Favor first alternative" },
  { value: "favor-last", label: "Favor last alternative" },
  { value: "average-rank", label: "Average rank (stable sort)" },
];

const emptyPolicy = (): Omit<TopsisPolicy, "id" | "createdAt" | "updatedAt"> => ({
  name: "",
  normalization: "vector",
  tieBreak: "favor-first",
  rankStabilityThreshold: 0.05,
});

export function PolicyManager() {
  const [policies, setPolicies] = useFirestoreState<TopsisPolicy[]>(
    COLLECTIONS.POLICIES,
    []
  );
  const [activeId, setActiveId] = useFirestoreState<string | null>(
    "mcdm:active-policy",
    null
  );
  const [editing, setEditing] = useState<Omit<
    TopsisPolicy,
    "id" | "createdAt" | "updatedAt"
  > | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const audit = useAudit();

  const handleSave = () => {
    if (!editing || !editing.name.trim()) return;
    const now = new Date().toISOString();

    if (editingId) {
      const prev = policies.find((p) => p.id === editingId);
      const updated = { ...editing, id: editingId, createdAt: prev?.createdAt ?? now, updatedAt: now };
      setPolicies(policies.map((p) => (p.id === editingId ? updated : p)));
      audit("update", "topsis_policy", editingId, prev as unknown as Record<string, unknown> | null, updated);
    } else {
      const newPolicy: TopsisPolicy = {
        ...editing,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      setPolicies([...policies, newPolicy]);
      if (policies.length === 0) setActiveId(newPolicy.id);
      audit("create", "topsis_policy", newPolicy.id, null, newPolicy as unknown as Record<string, unknown>);
    }
    setEditing(null);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    const prev = policies.find((p) => p.id === id);
    const updated = policies.filter((p) => p.id !== id);
    setPolicies(updated);
    if (activeId === id) {
      setActiveId(updated[0]?.id ?? null);
    }
    audit("delete", "topsis_policy", id, prev as unknown as Record<string, unknown> | null, null);
  };

  const handleEdit = (policy: TopsisPolicy) => {
    setEditingId(policy.id);
    setEditing({
      name: policy.name,
      normalization: policy.normalization,
      tieBreak: policy.tieBreak,
      rankStabilityThreshold: policy.rankStabilityThreshold,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => {
            setEditing(emptyPolicy());
            setEditingId(null);
          }}
        >
          + New Policy
        </Button>
      </div>

      {/* Editor */}
      {editing && (
        <Card>
          <CardHeader
            title={editingId ? "Edit Policy" : "New Policy Pack"}
            actions={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setEditingId(null);
                }}
              >
                Cancel
              </Button>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="policy-name"
              label="Policy Name"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              placeholder="e.g. Default Vector Policy"
            />
            <Select
              id="policy-normalization"
              label="Normalization Method"
              value={editing.normalization}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  normalization: e.target.value as NormalizationMethod,
                })
              }
              options={normalizationOptions}
            />
            <Select
              id="policy-tiebreak"
              label="Tie-Break Policy"
              value={editing.tieBreak}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  tieBreak: e.target.value as TieBreakPolicy,
                })
              }
              options={tieBreakOptions}
            />
            <Input
              id="policy-threshold"
              label="Rank Stability Threshold"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={editing.rankStabilityThreshold}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  rankStabilityThreshold: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
          <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-medium text-[var(--muted)]">
              Policy Explanation
            </p>
            <p className="mt-1 text-sm text-[#d7def0]">
              {editing.normalization === "vector" &&
                "Vector normalization divides each value by the L2 norm (√Σx²) of its column. Best for heterogeneous scales."}
              {editing.normalization === "min-max" &&
                "Min-max scales each column to [0, 1] range. Best when you want uniform scaling across criteria."}
              {editing.normalization === "max" &&
                "Max normalization divides each value by the column maximum. Simple and interpretable."}
            </p>
          </div>
          <div className="mt-5">
            <Button onClick={handleSave}>
              {editingId ? "Update" : "Create"} Policy
            </Button>
          </div>
        </Card>
      )}

      {/* Policy list */}
      {policies.length > 0 ? (
        <div className="space-y-3">
          {policies.map((policy) => (
            <Card key={policy.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">
                      {policy.name}
                    </h3>
                    {activeId === policy.id && (
                      <Badge variant="lime">Active</Badge>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="cyan">{policy.normalization}</Badge>
                    <Badge variant="purple">{policy.tieBreak}</Badge>
                    <Badge variant="amber">
                      threshold: {policy.rankStabilityThreshold}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Updated {new Date(policy.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1">
                  {activeId !== policy.id && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setActiveId(policy.id)}
                    >
                      Set Active
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(policy)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(policy.id)}
                  >
                    ✕
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        !editing && (
          <Card className="py-16 text-center">
            <p className="text-lg text-[var(--muted)]">
              No policies configured
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]/60">
              Create a TOPSIS policy pack to define how rankings are computed.
            </p>
          </Card>
        )
      )}
    </div>
  );
}

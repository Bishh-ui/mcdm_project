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
import {
  CRITERION_CATEGORIES,
  type Criterion,
  type CriterionCategory,
  type CriterionType,
} from "@/lib/topsis";

const categoryOptions = Object.entries(CRITERION_CATEGORIES).map(
  ([value, { label }]) => ({ value, label })
);

const typeOptions = [
  { value: "benefit", label: "Benefit (higher is better)" },
  { value: "cost", label: "Cost (lower is better)" },
];

const categoryBadgeVariant: Record<
  CriterionCategory,
  "cyan" | "lime" | "amber" | "pink" | "purple"
> = {
  "business-impact": "cyan",
  "ux-quality": "lime",
  performance: "amber",
  "trust-compliance": "pink",
  "personalization-fit": "purple",
};

const emptyCriterion = (): Omit<Criterion, "id"> => ({
  name: "",
  category: "business-impact",
  type: "benefit",
  weight: 0,
  description: "",
});

export function CriteriaManager() {
  const [criteria, setCriteria] = useFirestoreState<Criterion[]>(
    COLLECTIONS.CRITERIA,
    []
  );
  const [editing, setEditing] = useState<Omit<Criterion, "id"> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const audit = useAudit();

  const handleSave = () => {
    if (!editing || !editing.name.trim()) return;

    if (editingId) {
      const prev = criteria.find((c) => c.id === editingId);
      setCriteria(
        criteria.map((c) =>
          c.id === editingId ? { ...editing, id: editingId } : c
        )
      );
      audit("update", "criterion", editingId, prev as unknown as Record<string, unknown> | null, { ...editing, id: editingId });
    } else {
      const newId = generateId();
      setCriteria([...criteria, { ...editing, id: newId }]);
      audit("create", "criterion", newId, null, { ...editing, id: newId });
    }
    setEditing(null);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    const prev = criteria.find((c) => c.id === id);
    setCriteria(criteria.filter((c) => c.id !== id));
    audit("delete", "criterion", id, prev as unknown as Record<string, unknown> | null, null);
  };

  const handleEdit = (criterion: Criterion) => {
    setEditingId(criterion.id);
    setEditing({
      name: criterion.name,
      category: criterion.category,
      type: criterion.type,
      weight: criterion.weight,
      description: criterion.description,
    });
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(criteria, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "criteria-taxonomy.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string) as Criterion[];
        setCriteria(imported);
      } catch {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const weightSum = criteria.reduce((s, c) => s + c.weight, 0);
  const grouped = Object.entries(CRITERION_CATEGORIES).map(
    ([key, { label }]) => ({
      key: key as CriterionCategory,
      label,
      items: criteria.filter((c) => c.category === key),
    })
  );

  return (
    <div className="space-y-6">
      {/* Actions bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={() => {
            setEditing(emptyCriterion());
            setEditingId(null);
          }}
        >
          + Add Criterion
        </Button>
        <Button
          variant="secondary"
          onClick={handleExport}
          disabled={criteria.length === 0}
        >
          Export JSON
        </Button>
        <label className="cursor-pointer">
          <span className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:-translate-y-px hover:bg-white/10">
            Import JSON
          </span>
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </label>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-[var(--muted)]">Weight sum:</span>
          <Badge variant={Math.abs(weightSum - 1) < 0.01 ? "lime" : "amber"}>
            {weightSum.toFixed(3)}
          </Badge>
        </div>
      </div>

      {/* Editor form */}
      {editing && (
        <Card>
          <CardHeader
            title={editingId ? "Edit Criterion" : "New Criterion"}
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              id="criterion-name"
              label="Name"
              value={editing.name}
              onChange={(e) =>
                setEditing({ ...editing, name: e.target.value })
              }
              placeholder="e.g. Conversion Rate"
            />
            <Select
              id="criterion-category"
              label="Category"
              value={editing.category}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  category: e.target.value as CriterionCategory,
                })
              }
              options={categoryOptions}
            />
            <Select
              id="criterion-type"
              label="Type"
              value={editing.type}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  type: e.target.value as CriterionType,
                })
              }
              options={typeOptions}
            />
            <Input
              id="criterion-weight"
              label="Weight (0-1)"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={editing.weight}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  weight: parseFloat(e.target.value) || 0,
                })
              }
            />
            <div className="sm:col-span-2">
              <Input
                id="criterion-description"
                label="Description"
                value={editing.description}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
                placeholder="What does this criterion measure?"
              />
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <Button onClick={handleSave}>
              {editingId ? "Update" : "Add"} Criterion
            </Button>
          </div>
        </Card>
      )}

      {/* Criteria by category */}
      {grouped.map(
        (group) =>
          group.items.length > 0 && (
            <Card key={group.key}>
              <CardHeader
                tag={group.label}
                tagColor={`text-${categoryBadgeVariant[group.key]}-200/90`}
                title={`${group.items.length} ${group.items.length === 1 ? "criterion" : "criteria"}`}
              />
              <div className="space-y-2">
                {group.items.map((criterion) => (
                  <div
                    key={criterion.id}
                    className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">
                          {criterion.name}
                        </span>
                        <Badge
                          variant={
                            criterion.type === "benefit" ? "lime" : "amber"
                          }
                        >
                          {criterion.type}
                        </Badge>
                      </div>
                      {criterion.description && (
                        <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                          {criterion.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono text-cyan-300">
                        {criterion.weight.toFixed(3)}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(criterion)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(criterion.id)}
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )
      )}

      {criteria.length === 0 && !editing && (
        <Card className="py-16 text-center">
          <p className="text-lg text-[var(--muted)]">No criteria defined yet</p>
          <p className="mt-2 text-sm text-[var(--muted)]/60">
            Add your first criterion to start building the decision taxonomy.
          </p>
        </Card>
      )}
    </div>
  );
}

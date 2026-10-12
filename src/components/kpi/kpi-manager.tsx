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
  KPI_CATEGORIES,
  KPI_STATUS_CONFIG,
  type Kpi,
  type KpiCategory,
  type KpiStatus,
} from "@/lib/types/kpi";

const categoryOptions = Object.entries(KPI_CATEGORIES).map(([value, { label }]) => ({
  value,
  label,
}));

const statusOptions = Object.entries(KPI_STATUS_CONFIG).map(([value, { label }]) => ({
  value,
  label,
}));

type SortField = "name" | "category" | "status" | "baseline" | "target";

const emptyKpi = (): Omit<Kpi, "id" | "createdAt" | "updatedAt"> => ({
  name: "",
  formula: "",
  owner: "",
  baseline: 0,
  target: 0,
  category: "conversion-uplift",
  status: "draft",
});

export function KpiManager() {
  const [kpis, setKpis] = useFirestoreState<Kpi[]>(COLLECTIONS.KPIS, []);
  const [editing, setEditing] = useState<Omit<Kpi, "id" | "createdAt" | "updatedAt"> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("name");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const audit = useAudit();

  const handleSave = () => {
    if (!editing || !editing.name.trim()) return;
    const now = new Date().toISOString();

    if (editingId) {
      const prev = kpis.find((k) => k.id === editingId);
      const updated = { ...editing, id: editingId, createdAt: prev?.createdAt ?? now, updatedAt: now };
      setKpis(kpis.map((k) => (k.id === editingId ? updated : k)));
      audit("update", "kpi", editingId, prev as unknown as Record<string, unknown> | null, updated);
    } else {
      const newId = generateId();
      const created = { ...editing, id: newId, createdAt: now, updatedAt: now };
      setKpis([...kpis, created]);
      audit("create", "kpi", newId, null, created);
    }
    setEditing(null);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    const prev = kpis.find((k) => k.id === id);
    setKpis(kpis.filter((k) => k.id !== id));
    audit("delete", "kpi", id, prev as unknown as Record<string, unknown> | null, null);
  };

  const handleEdit = (kpi: Kpi) => {
    setEditingId(kpi.id);
    setEditing({
      name: kpi.name,
      formula: kpi.formula,
      owner: kpi.owner,
      baseline: kpi.baseline,
      target: kpi.target,
      category: kpi.category,
      status: kpi.status,
    });
  };

  const cycleStatus = (kpi: Kpi) => {
    const order: KpiStatus[] = ["draft", "review", "approved"];
    const next = order[(order.indexOf(kpi.status) + 1) % order.length];
    setKpis(
      kpis.map((k) =>
        k.id === kpi.id ? { ...k, status: next, updatedAt: new Date().toISOString() } : k
      )
    );
    audit("update", "kpi", kpi.id, { status: kpi.status }, { status: next });
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(kpis, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kpi-dictionary.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter and sort
  let filtered = kpis;
  if (filterCategory !== "all") filtered = filtered.filter((k) => k.category === filterCategory);
  if (filterStatus !== "all") filtered = filtered.filter((k) => k.status === filterStatus);

  const sorted = [...filtered].sort((a, b) => {
    switch (sortField) {
      case "name": return a.name.localeCompare(b.name);
      case "category": return a.category.localeCompare(b.category);
      case "status": return a.status.localeCompare(b.status);
      case "baseline": return b.baseline - a.baseline;
      case "target": return b.target - a.target;
      default: return 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => { setEditing(emptyKpi()); setEditingId(null); }}>
          + Add KPI
        </Button>
        <Button variant="secondary" onClick={handleExport} disabled={kpis.length === 0}>
          Export JSON
        </Button>
        <div className="ml-auto flex flex-wrap gap-2">
          <Select
            id="filter-category"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            options={[{ value: "all", label: "All Categories" }, ...categoryOptions]}
          />
          <Select
            id="filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[{ value: "all", label: "All Statuses" }, ...statusOptions]}
          />
          <Select
            id="sort-field"
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            options={[
              { value: "name", label: "Sort: Name" },
              { value: "category", label: "Sort: Category" },
              { value: "status", label: "Sort: Status" },
              { value: "baseline", label: "Sort: Baseline" },
              { value: "target", label: "Sort: Target" },
            ]}
          />
        </div>
      </div>

      {/* Editor */}
      {editing && (
        <Card>
          <CardHeader
            title={editingId ? "Edit KPI" : "New KPI"}
            actions={
              <Button variant="ghost" size="sm" onClick={() => { setEditing(null); setEditingId(null); }}>
                Cancel
              </Button>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input id="kpi-name" label="KPI Name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Cart Conversion Rate" />
            <Input id="kpi-formula" label="Formula" value={editing.formula} onChange={(e) => setEditing({ ...editing, formula: e.target.value })} placeholder="e.g. orders / sessions × 100" />
            <Input id="kpi-owner" label="Owner" value={editing.owner} onChange={(e) => setEditing({ ...editing, owner: e.target.value })} placeholder="e.g. Product Team" />
            <Select id="kpi-category" label="Category" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value as KpiCategory })} options={categoryOptions} />
            <Input id="kpi-baseline" label="Baseline" type="number" step="0.01" value={editing.baseline} onChange={(e) => setEditing({ ...editing, baseline: parseFloat(e.target.value) || 0 })} />
            <Input id="kpi-target" label="Target" type="number" step="0.01" value={editing.target} onChange={(e) => setEditing({ ...editing, target: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="mt-5">
            <Button onClick={handleSave}>{editingId ? "Update" : "Add"} KPI</Button>
          </div>
        </Card>
      )}

      {/* KPI Table */}
      {sorted.length > 0 ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)]">KPI</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)]">Formula</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)]">Owner</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[var(--muted)]">Baseline</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[var(--muted)]">Target</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[var(--muted)]">Status</th>
                  <th className="w-24" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((kpi) => {
                  const catConfig = KPI_CATEGORIES[kpi.category];
                  const statusConfig = KPI_STATUS_CONFIG[kpi.status];
                  return (
                    <tr key={kpi.id} className="border-b border-white/5">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{kpi.name}</div>
                        <div className="mt-0.5 text-xs" style={{ color: catConfig.color }}>{catConfig.label}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--muted)]">{kpi.formula || "—"}</td>
                      <td className="px-4 py-3 text-xs text-[var(--muted)]">{kpi.owner || "—"}</td>
                      <td className="px-4 py-3 text-center font-mono text-white/80">{kpi.baseline}</td>
                      <td className="px-4 py-3 text-center font-mono text-cyan-300">{kpi.target}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => cycleStatus(kpi)} className="cursor-pointer">
                          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                        </button>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(kpi)}>Edit</Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(kpi.id)}>✕</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        !editing && (
          <Card className="py-16 text-center">
            <p className="text-lg text-[var(--muted)]">No KPIs defined yet</p>
            <p className="mt-2 text-sm text-[var(--muted)]/60">
              Define your north-star KPIs with formulas, owners, and targets.
            </p>
          </Card>
        )
      )}
    </div>
  );
}

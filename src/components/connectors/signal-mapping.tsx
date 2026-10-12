"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useFirestoreState } from "@/lib/hooks/use-firestore-state";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import { generateId } from "@/lib/id";
import type { Criterion } from "@/lib/topsis";
import {
  AGGREGATION_OPTIONS,
  REFRESH_OPTIONS,
  SOURCE_OPTIONS,
  SIGNAL_FIELDS,
  type SignalMapping as SignalMappingType,
} from "@/lib/types/signal-mapping";

export function SignalMapping() {
  const [criteria] = useFirestoreState<Criterion[]>(COLLECTIONS.CRITERIA, []);
  const [mappings, setMappings] = useFirestoreState<SignalMappingType[]>(
    "mcdm:signal-mappings",
    []
  );
  const [editing, setEditing] = useState<Omit<SignalMappingType, "id"> | null>(null);

  const handleSave = () => {
    if (!editing) return;
    setMappings([...mappings, { ...editing, id: generateId() }]);
    setEditing(null);
  };

  const toggleMapping = (id: string) => {
    setMappings(
      mappings.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    );
  };

  const deleteMapping = (id: string) => {
    setMappings(mappings.filter((m) => m.id !== id));
  };

  const selectedSource = editing?.source ?? "shopify";
  const fieldOptions = SIGNAL_FIELDS[selectedSource] ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() =>
            setEditing({
              criterionId: criteria[0]?.id ?? "",
              criterionName: criteria[0]?.name ?? "",
              source: "shopify",
              signalField: "",
              aggregation: "average",
              refreshFrequency: "daily",
              description: "",
              enabled: true,
            })
          }
          disabled={criteria.length === 0}
        >
          + New Mapping
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-[var(--muted)]">
            {mappings.filter((m) => m.enabled).length} active mappings
          </span>
        </div>
      </div>

      {/* Editor */}
      {editing && (
        <Card>
          <CardHeader
            title="Map Signal to Criterion"
            description="Define how a data signal from a connected platform feeds into a TOPSIS criterion"
            actions={
              <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                Cancel
              </Button>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Select
              id="mapping-criterion"
              label="Target Criterion"
              value={editing.criterionId}
              onChange={(e) => {
                const c = criteria.find((cr) => cr.id === e.target.value);
                setEditing({
                  ...editing,
                  criterionId: e.target.value,
                  criterionName: c?.name ?? "",
                });
              }}
              options={criteria.map((c) => ({ value: c.id, label: c.name }))}
            />
            <Select
              id="mapping-source"
              label="Data Source"
              value={editing.source}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  source: e.target.value as SignalMappingType["source"],
                  signalField: "",
                })
              }
              options={SOURCE_OPTIONS}
            />
            <Select
              id="mapping-field"
              label="Signal Field"
              value={editing.signalField}
              onChange={(e) =>
                setEditing({ ...editing, signalField: e.target.value })
              }
              options={[
                { value: "", label: "Select field…" },
                ...fieldOptions,
              ]}
            />
            <Select
              id="mapping-aggregation"
              label="Aggregation"
              value={editing.aggregation}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  aggregation: e.target.value as SignalMappingType["aggregation"],
                })
              }
              options={AGGREGATION_OPTIONS}
            />
            <Select
              id="mapping-refresh"
              label="Refresh Frequency"
              value={editing.refreshFrequency}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  refreshFrequency: e.target.value as SignalMappingType["refreshFrequency"],
                })
              }
              options={REFRESH_OPTIONS}
            />
            <Input
              id="mapping-desc"
              label="Description"
              value={editing.description}
              onChange={(e) =>
                setEditing({ ...editing, description: e.target.value })
              }
              placeholder="e.g. Shopify revenue feeds business impact"
            />
          </div>
          <div className="mt-4">
            <Button onClick={handleSave} disabled={!editing.signalField || !editing.criterionId}>
              Create Mapping
            </Button>
          </div>
        </Card>
      )}

      {/* Mappings list */}
      {mappings.length > 0 ? (
        <Card>
          <CardHeader tag="Active Mappings" title="Signal → Criterion Pipeline" />
          <div className="space-y-2">
            {mappings.map((m) => (
              <div
                key={m.id}
                className={`flex items-center gap-4 rounded-lg border px-4 py-3 ${
                  m.enabled
                    ? "border-white/10 bg-white/5"
                    : "border-white/5 bg-white/[0.02] opacity-50"
                }`}
              >
                <button
                  onClick={() => toggleMapping(m.id)}
                  className={`h-4 w-4 shrink-0 rounded border ${
                    m.enabled
                      ? "border-lime-400 bg-lime-400"
                      : "border-white/30 bg-transparent"
                  }`}
                  aria-label={m.enabled ? "Disable mapping" : "Enable mapping"}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={m.source === "shopify" ? "lime" : m.source === "ga4" ? "amber" : "neutral"}>
                      {m.source}
                    </Badge>
                    <span className="text-xs text-[var(--muted)]">{m.signalField}</span>
                    <span className="text-xs text-[var(--muted)]">→</span>
                    <span className="text-sm font-medium text-white">{m.criterionName}</span>
                    <Badge variant="neutral">{m.aggregation}</Badge>
                    <Badge variant="cyan">{m.refreshFrequency}</Badge>
                  </div>
                  {m.description && (
                    <p className="mt-0.5 text-xs text-[var(--muted)]">{m.description}</p>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteMapping(m.id)}>
                  ✕
                </Button>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        !editing && (
          <Card className="py-16 text-center">
            <p className="text-lg text-[var(--muted)]">No signal mappings configured</p>
            <p className="mt-2 text-sm text-[var(--muted)]/60">
              Map data signals from Shopify and GA4 to TOPSIS criteria for automated scoring.
            </p>
          </Card>
        )
      )}

      {criteria.length === 0 && (
        <Card className="border-amber-400/30">
          <p className="text-sm text-amber-300">
            Define criteria in the Criteria page first before creating signal mappings.
          </p>
        </Card>
      )}
    </div>
  );
}

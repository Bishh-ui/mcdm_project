"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useFirestoreState } from "@/lib/hooks/use-firestore-state";
import { useAudit } from "@/lib/hooks/use-audit";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import { generateId } from "@/lib/id";
import type {
  PositioningData,
  DifferentiationClaim,
  DecisionLogEntry,
} from "@/lib/types/positioning";

const defaultData: PositioningData = {
  thesis: "",
  claims: [],
  decisionLog: [],
  updatedAt: new Date().toISOString(),
};

export function PositioningEditor() {
  const [data, setData] = useFirestoreState<PositioningData>(
    COLLECTIONS.POSITIONING,
    defaultData
  );
  const logAudit = useAudit();
  const [editingClaim, setEditingClaim] = useState<Omit<DifferentiationClaim, "id"> | null>(null);
  const [editingClaimId, setEditingClaimId] = useState<string | null>(null);
  const [editingLog, setEditingLog] = useState<Omit<DecisionLogEntry, "id" | "createdAt"> | null>(null);

  // Thesis
  const updateThesis = (thesis: string) => {
    const previous = data.thesis;
    setData({ ...data, thesis, updatedAt: new Date().toISOString() });
    if (previous !== thesis) {
      logAudit("update", "positioning_thesis", "thesis", { thesis: previous }, { thesis });
    }
  };

  // Claims
  const saveClaim = () => {
    if (!editingClaim || !editingClaim.claim.trim()) return;
    const updated = editingClaimId
      ? data.claims.map((c) => (c.id === editingClaimId ? { ...editingClaim, id: editingClaimId } : c))
      : [...data.claims, { ...editingClaim, id: generateId() }];
    setData({ ...data, claims: updated, updatedAt: new Date().toISOString() });
    
    if (editingClaimId) {
      const previous = data.claims.find((c) => c.id === editingClaimId);
      logAudit("update", "differentiation_claim", editingClaimId, previous as unknown as Record<string, unknown> | null, editingClaim as unknown as Record<string, unknown>);
    } else {
      logAudit("create", "differentiation_claim", "new", null, editingClaim as unknown as Record<string, unknown>);
    }
    
    setEditingClaim(null);
    setEditingClaimId(null);
  };

  const deleteClaim = (id: string) => {
    const claim = data.claims.find((c) => c.id === id);
    setData({ ...data, claims: data.claims.filter((c) => c.id !== id), updatedAt: new Date().toISOString() });
    logAudit("delete", "differentiation_claim", id, claim as unknown as Record<string, unknown> | null, null);
  };

  // Decision log
  const saveLogEntry = () => {
    if (!editingLog || !editingLog.decision.trim()) return;
    const entry: DecisionLogEntry = {
      ...editingLog,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setData({ ...data, decisionLog: [...data.decisionLog, entry], updatedAt: new Date().toISOString() });
    logAudit("create", "decision_log_entry", entry.id, null, editingLog as unknown as Record<string, unknown>);
    setEditingLog(null);
  };

  const deleteLogEntry = (id: string) => {
    const entry = data.decisionLog.find((e) => e.id === id);
    setData({ ...data, decisionLog: data.decisionLog.filter((e) => e.id !== id), updatedAt: new Date().toISOString() });
    logAudit("delete", "decision_log_entry", id, entry as unknown as Record<string, unknown> | null, null);
  };

  return (
    <div className="space-y-6">
      {/* Thesis */}
      <Card>
        <CardHeader
          tag="Core Thesis"
          title="Differentiation Statement"
          description="The single paragraph that explains why this product exists and what makes it different"
        />
        <textarea
          value={data.thesis}
          onChange={(e) => updateThesis(e.target.value)}
          placeholder="e.g. The only e-commerce optimization platform that combines deterministic multi-criteria ranking (TOPSIS) with full decision explainability and governance workflows, built India-first for DPDP compliance..."
          rows={4}
          className="w-full rounded-lg border border-white/15 bg-[var(--surface)] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-cyan-400/50"
        />
      </Card>

      {/* Claims */}
      <Card>
        <CardHeader
          tag="Proof Points"
          title="Differentiation Claims"
          description="Each claim must have supporting evidence"
          actions={
            <Button
              size="sm"
              onClick={() => {
                setEditingClaim({ claim: "", evidence: "", category: "Decision Engine" });
                setEditingClaimId(null);
              }}
            >
              + Add Claim
            </Button>
          }
        />

        {editingClaim && (
          <div className="mb-4 space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
            <Input
              id="claim-text"
              label="Claim"
              value={editingClaim.claim}
              onChange={(e) => setEditingClaim({ ...editingClaim, claim: e.target.value })}
              placeholder="e.g. Only platform with deterministic multi-criteria ranking"
            />
            <Input
              id="claim-evidence"
              label="Evidence"
              value={editingClaim.evidence}
              onChange={(e) => setEditingClaim({ ...editingClaim, evidence: e.target.value })}
              placeholder="e.g. TOPSIS engine produces reproducible rankings; competitors use black-box ML"
            />
            <Input
              id="claim-category"
              label="Category"
              value={editingClaim.category}
              onChange={(e) => setEditingClaim({ ...editingClaim, category: e.target.value })}
              placeholder="e.g. Decision Engine"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={saveClaim}>{editingClaimId ? "Update" : "Add"}</Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditingClaim(null); setEditingClaimId(null); }}>Cancel</Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {data.claims.map((claim) => (
            <div key={claim.id} className="flex items-start gap-4 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{claim.claim}</span>
                  <Badge variant="cyan">{claim.category}</Badge>
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">Evidence: {claim.evidence}</p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingClaimId(claim.id);
                    setEditingClaim({ claim: claim.claim, evidence: claim.evidence, category: claim.category });
                  }}
                >
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteClaim(claim.id)}>✕</Button>
              </div>
            </div>
          ))}
          {data.claims.length === 0 && !editingClaim && (
            <p className="py-4 text-center text-sm text-[var(--muted)]">No claims added yet.</p>
          )}
        </div>
      </Card>

      {/* Decision Log */}
      <Card>
        <CardHeader
          tag="Scope Decisions"
          title="Decision Log"
          description="Record scope inclusions, exclusions, and trade-offs with rationale"
          actions={
            <Button
              size="sm"
              onClick={() => setEditingLog({ decision: "", rationale: "", type: "inclusion" })}
            >
              + Add Entry
            </Button>
          }
        />

        {editingLog && (
          <div className="mb-4 space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
            <Input
              id="log-decision"
              label="Decision"
              value={editingLog.decision}
              onChange={(e) => setEditingLog({ ...editingLog, decision: e.target.value })}
              placeholder="e.g. Include Shopify connector in Phase 4"
            />
            <Input
              id="log-rationale"
              label="Rationale"
              value={editingLog.rationale}
              onChange={(e) => setEditingLog({ ...editingLog, rationale: e.target.value })}
              placeholder="e.g. Largest market share among target D2C brands"
            />
            <Select
              id="log-type"
              label="Type"
              value={editingLog.type}
              onChange={(e) => setEditingLog({ ...editingLog, type: e.target.value as "inclusion" | "exclusion" | "trade-off" })}
              options={[
                { value: "inclusion", label: "Inclusion" },
                { value: "exclusion", label: "Exclusion" },
                { value: "trade-off", label: "Trade-off" },
              ]}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={saveLogEntry}>Add Entry</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingLog(null)}>Cancel</Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {data.decisionLog.map((entry) => (
            <div key={entry.id} className="flex items-start gap-4 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{entry.decision}</span>
                  <Badge
                    variant={entry.type === "inclusion" ? "lime" : entry.type === "exclusion" ? "pink" : "amber"}
                  >
                    {entry.type}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">{entry.rationale}</p>
                <p className="mt-0.5 text-[10px] text-[var(--muted)]/60">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => deleteLogEntry(entry.id)}>✕</Button>
            </div>
          ))}
          {data.decisionLog.length === 0 && !editingLog && (
            <p className="py-4 text-center text-sm text-[var(--muted)]">No decisions logged yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

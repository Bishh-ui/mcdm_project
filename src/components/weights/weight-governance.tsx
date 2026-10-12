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
import type { Criterion } from "@/lib/topsis";
import {
  WEIGHT_STATUS_CONFIG,
  type WeightProposal,
  type WeightSnapshot,
} from "@/lib/types/weights";

export function WeightGovernance() {
  const [criteria] = useFirestoreState<Criterion[]>(COLLECTIONS.CRITERIA, []);
  const [proposals, setProposals] = useFirestoreState<WeightProposal[]>(
    COLLECTIONS.WEIGHT_PROPOSALS,
    []
  );
  const [snapshots, setSnapshots] = useFirestoreState<WeightSnapshot[]>(
    COLLECTIONS.WEIGHT_SNAPSHOTS,
    []
  );
  const [newProposal, setNewProposal] = useState<{
    criterionId: string;
    proposedWeight: number;
    reason: string;
    proposedBy: string;
  } | null>(null);
  const audit = useAudit();

  // Save current weights as a snapshot
  const saveSnapshot = (name: string, source: "manual" | "ahp") => {
    const weights: Record<string, number> = {};
    criteria.forEach((c) => { weights[c.id] = c.weight; });
    const snap: WeightSnapshot = {
      id: generateId(),
      name,
      weights,
      source,
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    setSnapshots([
      ...snapshots.map((s) => ({ ...s, isActive: false })),
      snap,
    ]);
    audit("create", "weight_snapshot", snap.id, null, snap as unknown as Record<string, unknown>);
  };

  // Submit a weight change proposal
  const submitProposal = () => {
    if (!newProposal || !newProposal.criterionId) return;
    const criterion = criteria.find((c) => c.id === newProposal.criterionId);
    if (!criterion) return;

    const proposal: WeightProposal = {
      id: generateId(),
      criterionId: newProposal.criterionId,
      criterionName: criterion.name,
      previousWeight: criterion.weight,
      proposedWeight: newProposal.proposedWeight,
      reason: newProposal.reason,
      proposedBy: newProposal.proposedBy || "Analyst",
      status: "proposed",
      reviewedBy: null,
      reviewNote: null,
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    };
    setProposals([proposal, ...proposals]);
    audit("create", "weight_proposal", proposal.id, null, proposal as unknown as Record<string, unknown>);
    setNewProposal(null);
  };

  // Approve or reject a proposal
  const resolveProposal = (id: string, status: "approved" | "rejected", note: string) => {
    const prev = proposals.find((p) => p.id === id);
    setProposals(
      proposals.map((p) =>
        p.id === id
          ? {
              ...p,
              status,
              reviewedBy: "Reviewer",
              reviewNote: note,
              resolvedAt: new Date().toISOString(),
            }
          : p
      )
    );
    audit(
      status === "approved" ? "approve" : "reject",
      "weight_proposal",
      id,
      prev as unknown as Record<string, unknown> | null,
      { status, reviewNote: note }
    );
  };

  const pendingCount = proposals.filter((p) => p.status === "proposed").length;

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() =>
            setNewProposal({
              criterionId: criteria[0]?.id ?? "",
              proposedWeight: 0,
              reason: "",
              proposedBy: "",
            })
          }
          disabled={criteria.length === 0}
        >
          + Propose Weight Change
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            const name = `Snapshot ${new Date().toLocaleDateString()}`;
            saveSnapshot(name, "manual");
          }}
          disabled={criteria.length === 0}
        >
          Save Current Weights
        </Button>
        {pendingCount > 0 && (
          <Badge variant="amber">{pendingCount} pending</Badge>
        )}
      </div>

      {/* Current weights overview */}
      <Card>
        <CardHeader
          tag="Current Weights"
          title="Active Weight Configuration"
          description="Weights from the criteria taxonomy. Propose changes through the governance workflow."
        />
        {criteria.length > 0 ? (
          <div className="space-y-2">
            {criteria.map((c) => (
              <div key={c.id} className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                <span className="min-w-0 flex-1 text-sm text-white">{c.name}</span>
                <div className="h-2 w-32 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-cyan-400"
                    style={{ width: `${c.weight * 100}%` }}
                  />
                </div>
                <span className="w-16 text-right font-mono text-sm text-cyan-300">
                  {c.weight.toFixed(3)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-[var(--muted)]">
            No criteria defined. Add criteria first.
          </p>
        )}
      </Card>

      {/* New proposal form */}
      {newProposal && (
        <Card>
          <CardHeader
            title="New Weight Proposal"
            actions={
              <Button variant="ghost" size="sm" onClick={() => setNewProposal(null)}>
                Cancel
              </Button>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="proposal-criterion"
              label="Criterion"
              value={newProposal.criterionId}
              onChange={(e) => setNewProposal({ ...newProposal, criterionId: e.target.value })}
              options={criteria.map((c) => ({ value: c.id, label: `${c.name} (current: ${c.weight.toFixed(3)})` }))}
            />
            <Input
              id="proposal-weight"
              label="Proposed Weight"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={newProposal.proposedWeight}
              onChange={(e) => setNewProposal({ ...newProposal, proposedWeight: parseFloat(e.target.value) || 0 })}
            />
            <Input
              id="proposal-reason"
              label="Reason for Change"
              value={newProposal.reason}
              onChange={(e) => setNewProposal({ ...newProposal, reason: e.target.value })}
              placeholder="e.g. Pilot data shows conversion has 2x impact"
            />
            <Input
              id="proposal-by"
              label="Proposed By"
              value={newProposal.proposedBy}
              onChange={(e) => setNewProposal({ ...newProposal, proposedBy: e.target.value })}
              placeholder="e.g. Data Analyst"
            />
          </div>
          <div className="mt-4">
            <Button onClick={submitProposal}>Submit Proposal</Button>
          </div>
        </Card>
      )}

      {/* Proposals list */}
      {proposals.length > 0 && (
        <Card>
          <CardHeader tag="Audit Trail" title="Weight Change Proposals" />
          <div className="space-y-2">
            {proposals.map((p) => {
              const config = WEIGHT_STATUS_CONFIG[p.status];
              return (
                <div key={p.id} className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{p.criterionName}</span>
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </div>
                      <div className="mt-1 flex gap-3 text-xs text-[var(--muted)]">
                        <span>
                          {p.previousWeight.toFixed(3)} → <span className="text-cyan-300">{p.proposedWeight.toFixed(3)}</span>
                        </span>
                        <span>by {p.proposedBy}</span>
                        <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                      </div>
                      {p.reason && <p className="mt-1 text-xs text-[var(--muted)]">Reason: {p.reason}</p>}
                      {p.reviewNote && (
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          Review: {p.reviewNote} — {p.reviewedBy}
                        </p>
                      )}
                    </div>
                    {p.status === "proposed" && (
                      <div className="flex gap-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => resolveProposal(p.id, "approved", "Approved based on data")}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resolveProposal(p.id, "rejected", "Insufficient evidence")}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Snapshots */}
      {snapshots.length > 0 && (
        <Card>
          <CardHeader tag="Version History" title="Weight Snapshots" />
          <div className="space-y-2">
            {snapshots.map((snap) => (
              <div key={snap.id} className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{snap.name}</span>
                    {snap.isActive && <Badge variant="lime">Active</Badge>}
                    <Badge variant="neutral">{snap.source}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    {new Date(snap.createdAt).toLocaleString()} · {Object.keys(snap.weights).length} criteria
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

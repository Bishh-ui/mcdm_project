"use client";

import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFirestoreState } from "@/lib/hooks/use-firestore-state";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import type { Criterion, TopsisPolicy } from "@/lib/topsis";

export function DashboardOverview() {
  const [criteria] = useFirestoreState<Criterion[]>(COLLECTIONS.CRITERIA, []);
  const [policies] = useFirestoreState<TopsisPolicy[]>(COLLECTIONS.POLICIES, []);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Criteria Status */}
      <Link href="/dashboard/criteria" className="group">
        <Card className="transition group-hover:border-cyan-400/30">
          <CardHeader
            tag="Criteria"
            title="Taxonomy Builder"
            description="Define and manage decision criteria"
          />
          <div className="flex items-center gap-3">
            <span className="text-display text-3xl font-bold text-cyan-300">
              {criteria.length}
            </span>
            <span className="text-sm text-[var(--muted)]">
              criteria defined
            </span>
          </div>
          {criteria.length === 0 && (
            <p className="mt-3 text-xs text-amber-300/80">
              → Start by defining your criteria taxonomy
            </p>
          )}
        </Card>
      </Link>

      {/* TOPSIS Policy Status */}
      <Link href="/dashboard/topsis" className="group">
        <Card className="transition group-hover:border-lime-400/30">
          <CardHeader
            tag="TOPSIS"
            tagColor="text-lime-200/90"
            title="Policy Config"
            description="Normalization, tie-break, and stability"
          />
          <div className="flex items-center gap-3">
            <span className="text-display text-3xl font-bold text-lime-300">
              {policies.length}
            </span>
            <span className="text-sm text-[var(--muted)]">
              policies saved
            </span>
          </div>
          {policies.length === 0 && (
            <p className="mt-3 text-xs text-amber-300/80">
              → Configure your first TOPSIS policy
            </p>
          )}
        </Card>
      </Link>

      {/* Run Analysis */}
      <Link href="/dashboard/topsis/run" className="group">
        <Card className="transition group-hover:border-amber-400/30">
          <CardHeader
            tag="Analysis"
            tagColor="text-amber-200/90"
            title="Run TOPSIS"
            description="Input alternatives and get ranked results"
          />
          <div className="flex flex-wrap gap-2">
            <Badge variant="cyan">Step-by-step</Badge>
            <Badge variant="lime">Explainable</Badge>
            <Badge variant="amber">Deterministic</Badge>
          </div>
          {criteria.length === 0 && (
            <p className="mt-3 text-xs text-[var(--muted)]">
              Define criteria first to run analysis
            </p>
          )}
        </Card>
      </Link>

      {/* Phase Status */}
      <div className="md:col-span-2 lg:col-span-3">
        <Card>
          <CardHeader
            tag="Build Status"
            tagColor="text-purple-200/90"
            title="Phase 1 — Decision Science Core"
            description="Application shell, TOPSIS engine, criteria management, and policy configuration"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "App Shell & Routing", status: "done" },
              { label: "TOPSIS Engine", status: "done" },
              { label: "Criteria Taxonomy", status: "done" },
              { label: "Policy Config & Runner", status: "done" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3"
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    item.status === "done" ? "bg-lime-400" : "bg-amber-400"
                  }`}
                />
                <span className="text-sm text-[#d7def0]">{item.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

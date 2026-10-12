"use client";

import { useEffect, useReducer } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/auth-provider";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { AuditEntry } from "@/lib/firebase/firestore";

const actionVariant: Record<string, "lime" | "cyan" | "pink" | "amber" | "neutral"> = {
  create: "lime",
  update: "cyan",
  delete: "pink",
  approve: "lime",
  reject: "amber",
};

interface State {
  entries: AuditEntry[];
  loading: boolean;
}

type Action = { type: "loaded"; entries: AuditEntry[] } | { type: "loading" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "loaded": return { entries: action.entries, loading: false };
    case "loading": return { ...state, loading: true };
  }
}

export function AuditLogViewer() {
  const { isAuthenticated } = useAuth();
  const [state, dispatch] = useReducer(reducer, { entries: [], loading: true });

  useEffect(() => {
    if (!isAuthenticated) {
      dispatch({ type: "loaded", entries: [] });
      return;
    }

    dispatch({ type: "loading" });
    const q = query(collection(db, "audit_log"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const entries = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as AuditEntry[];
        dispatch({ type: "loaded", entries });
      },
      () => dispatch({ type: "loaded", entries: [] })
    );
    return unsubscribe;
  }, [isAuthenticated]);

  if (state.loading) {
    return (
      <div className="flex h-64 items-center justify-center text-[var(--muted)]">
        Loading audit log…
      </div>
    );
  }

  if (state.entries.length === 0) {
    return (
      <Card className="py-16 text-center">
        <p className="text-lg text-[var(--muted)]">No audit entries yet</p>
        <p className="mt-2 text-sm text-[var(--muted)]/60">
          Actions will be logged here as you create, update, and delete data.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        tag="Immutable Log"
        title={`${state.entries.length} Entries`}
        description="Every mutation is recorded with who, what, when, and previous values"
      />
      <div className="space-y-2">
        {state.entries.map((entry) => (
          <div
            key={entry.id}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <Badge variant={actionVariant[entry.action] ?? "neutral"}>
                {entry.action}
              </Badge>
              <span className="text-sm font-medium text-white">
                {entry.entity}
              </span>
              <span className="text-xs text-[var(--muted)]">
                {entry.entityId}
              </span>
            </div>
            <div className="mt-1 flex gap-3 text-xs text-[var(--muted)]">
              <span>by {entry.userName}</span>
              {entry.timestamp && (
                <span>{new Date(entry.timestamp).toLocaleString()}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

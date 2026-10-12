"use client";

import { useCallback } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { logAudit, type AuditEntry } from "@/lib/firebase/firestore";

/**
 * Hook that provides an audit logging function bound to the current user.
 * No-ops gracefully when not authenticated.
 */
export function useAudit() {
  const { user, profile } = useAuth();

  const log = useCallback(
    (
      action: AuditEntry["action"],
      entity: string,
      entityId: string,
      previousValue: Record<string, unknown> | null = null,
      newValue: Record<string, unknown> | null = null,
      metadata?: Record<string, unknown>
    ) => {
      if (!user) return;
      logAudit(
        user.uid,
        profile?.displayName ?? user.email ?? "Unknown",
        action,
        entity,
        entityId,
        previousValue,
        newValue,
        metadata
      ).catch(console.error);
    },
    [user, profile]
  );

  return log;
}

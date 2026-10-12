/**
 * localStorage wrapper with JSON serialization.
 * Phase 1: local persistence. Phase 3: replaced by AlloyDB.
 */

export function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — silently fail in Phase 1
  }
}

export function removeFromStorage(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}

// Storage keys
export const STORAGE_KEYS = {
  CRITERIA: "mcdm:criteria",
  POLICIES: "mcdm:policies",
  ACTIVE_POLICY: "mcdm:active-policy",
  DECISIONS: "mcdm:decisions",
  KPIS: "mcdm:kpis",
  COMPETITOR_MATRIX: "mcdm:competitor-matrix",
  POSITIONING: "mcdm:positioning",
  WEIGHT_PROPOSALS: "mcdm:weight-proposals",
  WEIGHT_SNAPSHOTS: "mcdm:weight-snapshots",
} as const;

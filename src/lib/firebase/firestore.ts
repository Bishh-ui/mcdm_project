import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "./config";

// ── Generic CRUD helpers ───────────────────────────────────────

/** Get all documents from a collection */
export async function getCollection<T>(
  path: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  const q = constraints.length > 0
    ? query(collection(db, path), ...constraints)
    : collection(db, path);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
}

/** Get a single document */
export async function getDocument<T>(fullPath: string): Promise<T | null> {
  const snap = await getDoc(doc(db, fullPath));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as T;
}

/** Create or overwrite a document */
export async function setDocument(
  fullPath: string,
  data: DocumentData
): Promise<void> {
  await setDoc(doc(db, fullPath), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/** Update specific fields */
export async function updateDocument(
  fullPath: string,
  data: Partial<DocumentData>
): Promise<void> {
  await updateDoc(doc(db, fullPath), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/** Delete a document */
export async function deleteDocument(fullPath: string): Promise<void> {
  await deleteDoc(doc(db, fullPath));
}

/** Subscribe to real-time updates on a collection */
export function subscribeToCollection<T>(
  path: string,
  callback: (items: T[]) => void,
  ...constraints: QueryConstraint[]
): () => void {
  const q = constraints.length > 0
    ? query(collection(db, path), ...constraints)
    : collection(db, path);
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
    callback(items);
  });
}

/** Subscribe to a single document */
export function subscribeToDocument<T>(
  fullPath: string,
  callback: (item: T | null) => void
): () => void {
  return onSnapshot(doc(db, fullPath), (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback({ id: snap.id, ...snap.data() } as T);
  });
}

// ── Audit log ──────────────────────────────────────────────────

export interface AuditEntry {
  id: string;
  userId: string;
  userName: string;
  action: "create" | "update" | "delete" | "approve" | "reject";
  entity: string;
  entityId: string;
  previousValue: DocumentData | null;
  newValue: DocumentData | null;
  timestamp: string;
  metadata?: Record<string, unknown>; // Additional context like decisionId, criterionName, reviewedBy, etc.
}

export async function logAudit(
  userId: string,
  userName: string,
  action: AuditEntry["action"],
  entity: string,
  entityId: string,
  previousValue: DocumentData | null,
  newValue: DocumentData | null,
  metadata?: Record<string, unknown>
): Promise<void> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await setDoc(doc(db, "audit_log", id), {
    userId,
    userName,
    action,
    entity,
    entityId,
    previousValue,
    newValue,
    timestamp: serverTimestamp(),
    ...(metadata && { metadata }),
  });
}

/** Get audit log entries, newest first */
export async function getAuditLog(): Promise<AuditEntry[]> {
  return getCollection<AuditEntry>("audit_log", orderBy("timestamp", "desc"));
}

// ── Collection paths (centralized) ─────────────────────────────

export const COLLECTIONS = {
  USERS: "users",
  CRITERIA: "criteria",
  POLICIES: "topsis_policies",
  ACTIVE_POLICY: "settings/active_policy",
  KPIS: "kpis",
  COMPETITOR_MATRIX: "settings/competitor_matrix",
  POSITIONING: "settings/positioning",
  WEIGHT_PROPOSALS: "weight_proposals",
  WEIGHT_SNAPSHOTS: "weight_snapshots",
  DECISIONS: "decisions",
  AUDIT_LOG: "audit_log",
  EXPERIMENTS: "mcdm:experiments",
  EXPERIMENT_ASSIGNMENTS: "mcdm:experiment_assignments",
  EXPERIMENT_RESULTS: "mcdm:experiment_results",
} as const;

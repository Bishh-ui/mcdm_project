"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Hook for state that persists to localStorage.
 * Hydration-safe: returns fallback during SSR, reads localStorage on client.
 *
 * Uses useSyncExternalStore with localStorage as the external store.
 */

// Module-level listener set for cross-component sync
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((cb) => cb());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function usePersistedState<T>(
  key: string,
  fallback: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const getSnapshot = useCallback((): string => {
    try {
      return localStorage.getItem(key) ?? JSON.stringify(fallback);
    } catch {
      return JSON.stringify(fallback);
    }
  }, [key, fallback]);

  const getServerSnapshot = useCallback(
    (): string => JSON.stringify(fallback),
    [fallback]
  );

  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  let value: T;
  try {
    value = JSON.parse(raw) as T;
  } catch {
    value = fallback;
  }

  const setValue = useCallback(
    (updater: T | ((prev: T) => T)) => {
      let current: T;
      try {
        const stored = localStorage.getItem(key);
        current = stored !== null ? (JSON.parse(stored) as T) : fallback;
      } catch {
        current = fallback;
      }

      const next =
        typeof updater === "function"
          ? (updater as (prev: T) => T)(current)
          : updater;

      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // storage full
      }
      emitChange();
    },
    [key, fallback]
  );

  return [value, setValue];
}

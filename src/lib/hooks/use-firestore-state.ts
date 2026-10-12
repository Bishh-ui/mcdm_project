"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { subscribeToCollection, setDocument, getCollection } from "@/lib/firebase/firestore";

/**
 * Hook for state that persists to Firestore with real-time sync.
 * Falls back to localStorage when not authenticated.
 * 
 * @param collectionPath - Firestore collection path (e.g., "mcdm:criteria")
 * @param fallback - Default value if no data exists
 */
export function useFirestoreState<T>(
  collectionPath: string,
  fallback: T
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const { user } = useAuth();
  
  // Initialize state from localStorage if available (client-side only)
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined" || user) return fallback;
    try {
      const stored = localStorage.getItem(collectionPath);
      return stored ? (JSON.parse(stored) as T) : fallback;
    } catch {
      return fallback;
    }
  });
  
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(true);

  // Load initial data
  useEffect(() => {
    let mounted = true;
    
    if (!user) {
      // Not authenticated - already loaded from localStorage in useState initializer
      loadingRef.current = false;
      return;
    }

    // Authenticated - load from Firestore
    let unsubscribe: (() => void) | undefined;

    async function loadData() {
      try {
        // For collections, subscribe to real-time updates
        if (Array.isArray(fallback)) {
          unsubscribe = subscribeToCollection<Record<string, unknown>>(collectionPath, (data) => {
            if (mounted) {
              setValue(data as T);
              loadingRef.current = false;
            }
          });
        } else {
          // For single documents, just load once
          const data = await getCollection<Record<string, unknown>>(collectionPath);
          if (mounted) {
            setValue((data.length > 0 ? data[0] : fallback) as T);
            loadingRef.current = false;
          }
        }
      } catch (error) {
        console.error("Failed to load from Firestore:", error);
        if (mounted) loadingRef.current = false;
      }
    }

    loadData();

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, collectionPath, fallback]);

  // Sync loading state
  useEffect(() => {
    if (!loadingRef.current && loading) {
      setLoading(false);
    }
  }, [loading]);

  const updateValue = useCallback(
    async (updater: T | ((prev: T) => T)) => {
      const newValue = typeof updater === "function" 
        ? (updater as (prev: T) => T)(value)
        : updater;

      setValue(newValue);

      if (!user) {
        // Not authenticated - save to localStorage
        try {
          localStorage.setItem(collectionPath, JSON.stringify(newValue));
        } catch (error) {
          console.error("Failed to save to localStorage:", error);
        }
        return;
      }

      // Authenticated - save to Firestore
      try {
        if (Array.isArray(newValue)) {
          // For arrays, save each item as a document
          const items = newValue as Record<string, unknown>[];
          for (const item of items) {
            if (item.id) {
              await setDocument(`${collectionPath}/${item.id as string}`, item);
            }
          }
        } else {
          // For single objects, save as one document
          const obj = newValue as Record<string, unknown>;
          if (obj.id) {
            await setDocument(`${collectionPath}/${obj.id as string}`, obj);
          }
        }
      } catch (error) {
        console.error("Failed to save to Firestore:", error);
      }
    },
    [user, collectionPath, value]
  );

  return [value, updateValue, loading];
}

import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import { api, ApiError, onStaysChanged, STALE_MS } from "@/lib/api";
import type { StayDetails } from "@/lib/stays";

// Stays already fetched this session, so Ask, Book, the Policies sheet (and
// reopening a stay) show at once. `null` means the slug matched no stay.
// Dropped when stays change in this app; refetched on focus once stale.
const cache = new Map<string, StayDetails | null>();
const fetchedAt = new Map<string, number>();
onStaysChanged(() => cache.clear());

// The server sorts the platform's policies and sizes the photos.
async function loadStay(slug: string, signal?: AbortSignal) {
  const stay = await api<StayDetails>(`/api/stays/${encodeURIComponent(slug)}`, { signal }).catch((error: Error) => {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  });
  cache.set(slug, stay);
  fetchedAt.set(slug, Date.now());
  return stay;
}

/**
 * `stay` is undefined while loading and after a failed load, `null` when not found.
 * A failed refresh keeps the stay and reports `refreshError` instead.
 */
export function useStay(slug: string) {
  // The loaded stay lives in state, not only in the module cache: the React
  // Compiler memoizes `cache.get(slug)` by slug and would never see it change.
  const [loaded, setLoaded] = useState<{ slug: string; stay: StayDetails | null }>();
  const [failed, setFailed] = useState<{ slug: string; error: Error } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState<{ slug: string; error: Error } | null>(null);

  useEffect(() => {
    if (cache.has(slug)) return;
    const controller = new AbortController();
    loadStay(slug, controller.signal)
      .then((stay) => {
        setLoaded({ slug, stay });
        setFailed(null);
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") setFailed({ slug, error });
      });
    return () => controller.abort();
  }, [slug, attempt]);

  const error = failed?.slug === slug ? failed.error : null;
  const retry = useCallback(() => {
    setFailed(null);
    setAttempt((n) => n + 1);
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshFailed(null);
    try {
      setLoaded({ slug, stay: await loadStay(slug) });
      setFailed(null);
    } catch (e) {
      // With nothing on screen, the error state shows it; otherwise the stay stays.
      if (cache.get(slug)) setRefreshFailed({ slug, error: e as Error });
      else setFailed({ slug, error: e as Error });
    } finally {
      setRefreshing(false);
    }
  }, [slug]);

  const clearRefreshError = useCallback(() => setRefreshFailed(null), []);

  // Back on screen with stale details: fetch quietly (an admin may have edited or removed it).
  useFocusEffect(
    useCallback(() => {
      if (!cache.has(slug) || Date.now() - (fetchedAt.get(slug) ?? 0) < STALE_MS) return;
      loadStay(slug)
        .then((stay) => setLoaded({ slug, stay }))
        .catch(() => {});
    }, [slug]),
  );

  return {
    stay: loaded?.slug === slug ? loaded.stay : cache.get(slug),
    error,
    retry,
    refresh,
    refreshing,
    refreshError: refreshFailed?.slug === slug ? refreshFailed.error : null,
    clearRefreshError,
  };
}

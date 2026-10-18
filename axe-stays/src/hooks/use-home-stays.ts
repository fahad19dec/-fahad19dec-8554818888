import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import type { Category } from "@/components/home/category-chips";
import { api, onStaysChanged, query, STALE_MS } from "@/lib/api";
import type { HomeStay } from "@/lib/stays";

// Lists already fetched this session, per category, so switching back to a
// chip is instant.
// Dropped when stays change in this app; refetched on focus once stale.
const cache = new Map<Category, HomeStay[]>();
const fetchedAt = new Map<Category, number>();
onStaysChanged(() => cache.clear());

// Home shows the top-rated 30, or one type when a category chip is selected.
async function loadStays(category: Category, signal?: AbortSignal) {
  const params = query({ view: "home", limit: 30, sort: "rating", types: category === "all" ? undefined : category });
  const { stays } = await api<{ stays: HomeStay[] }>(`/api/stays${params}`, { signal });
  cache.set(category, stays);
  fetchedAt.set(category, Date.now());
  return stays;
}

// While a new category loads, the list on screen stays until the new one
// arrives. `stays` is undefined before the first load and after a failed one.
// A failed refresh keeps the list and reports `refreshError` instead.
export function useHomeStays(category: Category) {
  // The latest list lives in state, not only in the module cache: the React
  // Compiler memoizes `cache.get(category)` by category and would miss a refresh.
  const [loaded, setLoaded] = useState<{ category: Category; stays: HomeStay[] }>();
  const [failed, setFailed] = useState<{ category: Category; error: Error } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState<{ category: Category; error: Error } | null>(null);

  useEffect(() => {
    if (cache.has(category)) return;
    const controller = new AbortController();
    loadStays(category, controller.signal)
      .then((stays) => {
        setLoaded({ category, stays });
        setFailed(null);
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") setFailed({ category, error });
      });
    return () => controller.abort();
  }, [category, attempt]);

  const error = failed?.category === category ? failed.error : null;
  const current = loaded?.category === category ? loaded.stays : cache.get(category);
  // The last list on screen, kept while the next category loads.
  const [shown, setShown] = useState(current);
  if (current && current !== shown) setShown(current);

  const retry = useCallback(() => {
    setFailed(null);
    setAttempt((n) => n + 1);
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshFailed(null);
    try {
      const stays = await loadStays(category);
      setLoaded({ category, stays });
      setFailed(null);
    } catch (e) {
      // With nothing on screen, the error state shows it; otherwise the list stays.
      if (cache.has(category)) setRefreshFailed({ category, error: e as Error });
      else setFailed({ category, error: e as Error });
    } finally {
      setRefreshing(false);
    }
  }, [category]);

  const clearRefreshError = useCallback(() => setRefreshFailed(null), []);

  // Back on screen with a stale list: fetch quietly, keeping the list showing.
  useFocusEffect(
    useCallback(() => {
      if (!cache.has(category) || Date.now() - (fetchedAt.get(category) ?? 0) < STALE_MS) return;
      loadStays(category)
        .then((stays) => setLoaded({ category, stays }))
        .catch(() => {});
    }, [category]),
  );

  return {
    stays: current ?? (error ? undefined : shown),
    error,
    retry,
    refresh,
    refreshing,
    refreshError: refreshFailed?.category === category ? refreshFailed.error : null,
    clearRefreshError,
  };
}

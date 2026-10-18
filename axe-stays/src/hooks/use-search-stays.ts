import { useCallback, useEffect, useState } from "react";

import { api, onStaysChanged, query } from "@/lib/api";
import { filtersToParams, type StayFilters } from "@/lib/search/filters";
import type { SearchStay } from "@/lib/stays";

/** `key` identifies the filters these results answer. */
export type SearchResult = { key: string; total: number; stays: SearchStay[] };

// Results already fetched this session, per filters. Dropped when the admin changes a stay.
const cache = new Map<string, SearchResult>();
onStaysChanged(() => cache.clear());

export const searchKey = (filters: StayFilters) => query(filtersToParams(filters));

async function fetchResults(key: string, signal?: AbortSignal): Promise<SearchResult> {
  const body = await api<Omit<SearchResult, "key">>(`/api/stays${key}`, { signal });
  const next = { key, ...body };
  cache.set(key, next);
  return next;
}

/** How many stays match, for the filter panel's button. Undefined while counting. */
export function useStayCount(filters: StayFilters | undefined) {
  const key = filters ? searchKey(filters) : undefined;
  const [counted, setCounted] = useState<{ key: string; total: number }>();
  useEffect(() => {
    if (key === undefined) return;
    const controller = new AbortController();
    // Short pause, so dragging through steppers sends one request.
    const timer = setTimeout(() => {
      const sep = key ? "&" : "?";
      api<{ total: number }>(`/api/stays${key}${sep}limit=0`, { signal: controller.signal })
        .then(({ total }) => setCounted({ key, total }))
        .catch(() => {});
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key]);
  return key !== undefined && counted?.key === key ? counted.total : undefined;
}

// Like Home: the results on screen stay until the next ones arrive, and
// `pending` says newer ones are on the way. `result` is undefined before the
// first load and after a failed one. A failed refresh keeps the results and
// reports `refreshError` instead.
export function useSearchStays(filters: StayFilters | undefined) {
  const key = filters ? searchKey(filters) : undefined;
  // The latest result lives in state, not only in the module cache: the React
  // Compiler memoizes `cache.get(key)` by key and would miss a refresh.
  const [loaded, setLoaded] = useState<SearchResult>();
  const [failed, setFailed] = useState<{ key: string; error: Error } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState<{ key: string; error: Error } | null>(null);

  useEffect(() => {
    if (key === undefined || cache.has(key)) return;
    const controller = new AbortController();
    fetchResults(key, controller.signal)
      .then((next) => {
        setLoaded(next);
        setFailed(null);
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") setFailed({ key, error });
      });
    return () => controller.abort();
  }, [key, attempt]);

  const error = failed && failed.key === key ? failed.error : null;
  const current = key !== undefined && loaded?.key === key ? loaded : key !== undefined ? cache.get(key) : undefined;
  // The last results on screen, kept while the next request loads.
  const [shown, setShown] = useState(current);
  if (current && current !== shown) setShown(current);

  const retry = useCallback(() => {
    setFailed(null);
    setAttempt((n) => n + 1);
  }, []);

  const refresh = useCallback(async () => {
    if (key === undefined) return;
    setRefreshing(true);
    setRefreshFailed(null);
    try {
      setLoaded(await fetchResults(key));
      setFailed(null);
    } catch (e) {
      // With nothing on screen, the error state shows it; otherwise the results stay.
      if (cache.has(key)) setRefreshFailed({ key, error: e as Error });
      else setFailed({ key, error: e as Error });
    } finally {
      setRefreshing(false);
    }
  }, [key]);

  const clearRefreshError = useCallback(() => setRefreshFailed(null), []);

  return {
    result: current ?? (error ? undefined : shown),
    pending: key !== undefined && !current && !error,
    error,
    retry,
    refresh,
    refreshing,
    refreshError: refreshFailed && refreshFailed.key === key ? refreshFailed.error : null,
    clearRefreshError,
  };
}

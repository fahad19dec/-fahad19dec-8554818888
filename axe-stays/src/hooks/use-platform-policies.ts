import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { PlatformPolicy } from "@/lib/stays";

// Cancellation tiers from most to least flexible, then the rest in the order
// stays list them. Anything new goes last.
const order = [
  "flexible-cancellation",
  "moderate-cancellation",
  "strict-cancellation",
  "check-in-and-check-out",
  "pets",
  "booking-and-payment",
  "damage-and-security-deposit",
  "guest-refund",
];
const rank = (slug: string) => {
  const i = order.indexOf(slug);
  return i === -1 ? order.length : i;
};

// Fetched once per session; Profile and the policies sheet share it.
let cache: PlatformPolicy[] | undefined;

async function loadPolicies(signal?: AbortSignal) {
  const rows = await api<PlatformPolicy[]>("/api/policies", { signal });
  cache = [...rows].sort((a, b) => rank(a.slug) - rank(b.slug));
  return cache;
}

/** `policies` is undefined while loading and after a failed load. */
export function usePlatformPolicies() {
  // The list lives in state, not only in the module cache: the React Compiler
  // memoizes reads of mutable module state.
  const [loaded, setLoaded] = useState(cache);
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (cache) return;
    const controller = new AbortController();
    loadPolicies(controller.signal)
      .then((policies) => {
        setLoaded(policies);
        setError(null);
      })
      .catch((e: Error) => {
        if (e.name !== "AbortError") setError(e);
      });
    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => {
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  return { policies: loaded, error, retry };
}

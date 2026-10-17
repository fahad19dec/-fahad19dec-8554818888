import { useEffect, useState } from "react";

import { api, onStaysChanged } from "@/lib/api";

export type PlaceOption = { value: string; label: string; count: number };

/** What the filter panel offers (GET /api/meta). */
export type SearchMeta = {
  /** Every place name stays have, lowercase: reads places out of typed sentences. */
  places: string[];
  cities: PlaceOption[];
  countries: PlaceOption[];
  price: { min: number; max: number };
  total: number;
};

// Fetched once per session, again after the admin changes a stay.
let cache: Promise<SearchMeta> | undefined;
onStaysChanged(() => {
  cache = undefined;
});

export const loadSearchMeta = () => {
  cache ??= api<SearchMeta>("/api/meta").catch((error) => {
    cache = undefined;
    throw error;
  });
  return cache;
};

/** `meta` is undefined while loading or if it failed; Search works without it. */
export function useSearchMeta() {
  const [meta, setMeta] = useState<SearchMeta>();
  useEffect(() => {
    let live = true;
    loadSearchMeta()
      .then((m) => live && setMeta(m))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return meta;
}

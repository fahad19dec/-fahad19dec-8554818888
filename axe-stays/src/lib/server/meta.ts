import { knownPlaces } from "./stay-search";
import type { Db } from "./store";

// What the filter panel offers (GET /api/meta). `places` are every place name
// stays have (lowercase, for reading a typed sentence); `cities` and
// `countries` are the place pickers, with how many stays each has.
export function buildMeta(db: Db) {
  const tally = (names: string[]) =>
    Object.entries(names.reduce<Record<string, number>>((acc, name) => ({ ...acc, [name]: (acc[name] ?? 0) + 1 }), {}))
      .map(([name, count]) => ({ value: name.toLowerCase(), label: name, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  const prices = db.stays.map((s) => s.pricePerNight);
  return {
    places: knownPlaces(db),
    cities: tally(db.stays.map((s) => s.city)),
    countries: tally(db.stays.map((s) => s.country)),
    price: { min: prices.length ? Math.min(...prices) : 0, max: prices.length ? Math.max(...prices) : 0 },
    total: db.stays.length,
  };
}

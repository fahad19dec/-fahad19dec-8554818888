import { filterCount, type StayFilters } from "../search/filters";
import { placeValues, typeLabels } from "../search/parse";
import type { StayRecord } from "../stays";

import type { Catalog as Db } from "../db/catalog";

// Server only. Search in code: every filter is an exact check on a typed
// field. Keywords rank: "Best match" orders by how many keywords and vibes a
// stay matches, then by rating. A search that is only keywords ("treehouse")
// keeps just the stays matching at least one of them; once any filter is set,
// keywords ("quiet" in "quiet beach house in Oregon") only rank.

const words = (text: string) =>
  text
    .toLowerCase()
    .replace(/[’']/g, "")
    .split(/[^a-z0-9-]+/)
    .filter((w) => w.length > 1);

function haystack(s: StayRecord) {
  return [
    s.title,
    typeLabels[s.type],
    s.city,
    s.region,
    s.country,
    s.neighborhood,
    s.summary,
    s.description,
    ...(s.highlights ?? []),
    ...(s.facts ?? []),
    ...(s.vibes ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[’']/g, "");
}

// A keyword matches at the start of a word, so "lake" finds "lakeside".
const matches = (text: string, word: string) => new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(text);

function passes(s: StayRecord, f: StayFilters, superhosts: Set<string>, place: string[]) {
  const rules = s.houseRules;
  if (f.types.length && !f.types.includes(s.type)) return false;
  if (f.minPrice !== undefined && s.pricePerNight < f.minPrice) return false;
  if (f.maxPrice !== undefined && s.pricePerNight > f.maxPrice) return false;
  if (f.guests !== undefined && s.maxGuests < f.guests) return false;
  if (f.bedrooms !== undefined && s.bedrooms < f.bedrooms) return false;
  if (f.beds !== undefined && s.beds < f.beds) return false;
  if (f.bathrooms !== undefined && s.bathrooms < f.bathrooms) return false;
  if (f.amenities.some((a) => !s.amenities.includes(a))) return false;
  if (f.pets !== undefined && (rules.petsAllowed === true) !== f.pets) return false;
  if (f.smoking !== undefined && (rules.smokingAllowed === true) !== f.smoking) return false;
  if (f.parties !== undefined && (rules.partiesAllowed === true) !== f.parties) return false;
  if (f.minRating !== undefined && s.rating < f.minRating) return false;
  if (f.superhost && !superhosts.has(s.hostSlug)) return false;
  if (f.cancellation.length && !f.cancellation.includes(s.cancellationPolicySlug)) return false;
  if (f.vibes.length && !f.vibes.some((v) => s.vibes?.includes(v))) return false;
  if (place.length) {
    const names = [s.city, s.region, s.country, s.neighborhood].filter(Boolean).map((n) => n!.toLowerCase());
    if (!names.some((n) => place.includes(n))) return false;
  }
  return true;
}

const byRating = (a: StayRecord, b: StayRecord) => b.rating - a.rating || b.reviewCount - a.reviewCount;

const sorters: Record<Exclude<StayFilters["sort"], "best">, (a: StayRecord, b: StayRecord) => number> = {
  priceAsc: (a, b) => a.pricePerNight - b.pricePerNight || byRating(a, b),
  priceDesc: (a, b) => b.pricePerNight - a.pricePerNight || byRating(a, b),
  rating: byRating,
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt) || byRating(a, b),
};

export function searchStays(db: Db, filters: StayFilters): StayRecord[] {
  const superhosts = new Set(db.hosts.filter((h) => h.isSuperhost).map((h) => h.slug));
  const place = filters.place ? placeValues(filters.place) : [];
  const keywords = filters.text ? [...new Set(words(filters.text))] : [];
  const keywordsFilter = keywords.length > 0 && filterCount(filters) === 0;

  const scored = db.stays
    .filter((s) => passes(s, filters, superhosts, place))
    .map((stay) => {
      const text = keywords.length ? haystack(stay) : "";
      const hits = keywords.filter((w) => matches(text, w)).length;
      const title = keywords.filter((w) => matches(stay.title.toLowerCase(), w)).length;
      const vibes = filters.vibes.filter((v) => stay.vibes?.includes(v)).length;
      return { stay, hits, score: hits * 2 + title + vibes };
    })
    .filter((r) => !keywordsFilter || r.hits > 0);

  if (filters.sort !== "best") return scored.map((r) => r.stay).sort(sorters[filters.sort]);
  return scored.sort((a, b) => b.score - a.score || byRating(a.stay, b.stay)).map((r) => r.stay);
}

/** Every place name stays have, lowercased, for reading places out of a sentence. */
export const knownPlaces = (db: Db) => [
  ...new Set(
    db.stays.flatMap((s) => [s.city, s.region, s.country, s.neighborhood]).filter(Boolean).map((n) => n!.toLowerCase()),
  ),
];

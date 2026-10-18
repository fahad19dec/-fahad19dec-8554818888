import type { Amenity, CancellationTier, PropertyType } from "../stays";

import { amenityLabels, parseQuery, typeLabels } from "./parse";

// Every filter Search offers, shared by the app (filter panel, chips, URL) and
// the server (src/lib/server/stay-search.ts). The app sends filters as query
// params; `filtersFromParams` reads them back and drops anything not on a list
// or out of range, so the server never trusts what it's sent.

export const PROPERTY_TYPES = ["cabin", "beach", "city", "villa"] as const satisfies readonly PropertyType[];

export const AMENITIES = [
  "hotTub", "pool", "fireplace", "firePit", "sauna", "wifi", "kitchen", "workspace", "parking",
  "washer", "ac", "oceanView", "lakeView", "mountainView", "beachAccess", "bbq", "evCharger",
] as const satisfies readonly Amenity[];

// Vibe words stays are tagged with (`vibes` on the stay).
export const VIBES = [
  "quiet", "cozy", "secluded", "romantic", "peaceful", "luxury", "family", "lively",
  "walkable", "rustic", "modern", "views", "nature", "minimal", "design", "laid-back",
] as const;
export type Vibe = (typeof VIBES)[number];

export const CANCELLATION_TIERS = [
  "flexible-cancellation",
  "moderate-cancellation",
  "strict-cancellation",
] as const satisfies readonly CancellationTier[];

export const cancellationLabels: Record<CancellationTier, string> = {
  "flexible-cancellation": "Flexible",
  "moderate-cancellation": "Moderate",
  "strict-cancellation": "Strict",
};

export type SortOption = "best" | "priceAsc" | "priceDesc" | "rating" | "newest";

export const SORTS = ["best", "priceAsc", "priceDesc", "rating", "newest"] as const satisfies readonly SortOption[];

export const sortLabels: Record<SortOption, string> = {
  best: "Best match",
  priceAsc: "Price: low to high",
  priceDesc: "Price: high to low",
  rating: "Top rated",
  newest: "Newest",
};

export const RATING_STEPS = [4, 4.5, 4.8] as const;

/** Longest keyword text the server reads. */
export const MAX_TEXT = 200;
export const MAX_PRICE = 100000;

export type StayFilters = {
  /** Keywords matched against each stay's title, place, copy and vibes. */
  text?: string;
  /** A lowercase place name: city, region, country or neighborhood (US states by name or code). */
  place?: string;
  /** Any of these types. */
  types: PropertyType[];
  minPrice?: number;
  maxPrice?: number;
  guests?: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  /** Every one of these amenities. */
  amenities: Amenity[];
  pets?: boolean;
  smoking?: boolean;
  parties?: boolean;
  minRating?: number;
  superhost?: boolean;
  /** Any of these cancellation tiers. */
  cancellation: CancellationTier[];
  /** Any of these vibes. */
  vibes: Vibe[];
  sort: SortOption;
};

export const emptyFilters = (): StayFilters => ({ types: [], amenities: [], cancellation: [], vibes: [], sort: "best" });

/**
 * A typed sentence, read in code: "quiet pet friendly cabin with a hot tub
 * under $300" becomes type, amenity, pets and price filters. Leftover words
 * ("quiet") stay as keywords, which rank rather than filter whenever the
 * sentence also set a filter (src/lib/server/stay-search.ts). Vibes are only
 * filters when picked in the filter sheet. `knownPlaces` are lowercase.
 */
export function filtersFromSentence(sentence: string, knownPlaces: string[], base = emptyFilters()): StayFilters {
  const parsed = parseQuery(sentence, knownPlaces);
  return {
    ...base,
    text: parsed.terms.length ? parsed.terms.join(" ") : undefined,
    place: parsed.place?.values[0] ?? base.place,
    types: parsed.type ? [parsed.type] : base.types,
    maxPrice: parsed.maxPrice ?? base.maxPrice,
    guests: parsed.guests ?? base.guests,
    amenities: [...new Set([...base.amenities, ...parsed.amenities])],
    pets: parsed.pets ? true : base.pets,
  };
}

// ---- URL params -------------------------------------------------------------

const list = (values: readonly string[]) => (values.length ? values.join(",") : undefined);
const flag = (value: boolean | undefined) => (value === undefined ? undefined : value ? "1" : "0");

/** Filters as flat string params, for the API and the Search screen's URL. Empty values are left out. */
export function filtersToParams(filters: StayFilters): Record<string, string> {
  const params: Record<string, string | undefined> = {
    text: filters.text?.trim() || undefined,
    place: filters.place,
    types: list(filters.types),
    minPrice: filters.minPrice?.toString(),
    maxPrice: filters.maxPrice?.toString(),
    guests: filters.guests?.toString(),
    bedrooms: filters.bedrooms?.toString(),
    beds: filters.beds?.toString(),
    bathrooms: filters.bathrooms?.toString(),
    amenities: list(filters.amenities),
    pets: flag(filters.pets),
    smoking: flag(filters.smoking),
    parties: flag(filters.parties),
    minRating: filters.minRating?.toString(),
    superhost: filters.superhost ? "1" : undefined,
    cancellation: list(filters.cancellation),
    vibes: list(filters.vibes),
    sort: filters.sort === "best" ? undefined : filters.sort,
  };
  return Object.fromEntries(Object.entries(params).filter((e): e is [string, string] => !!e[1]));
}

const pick = <T extends string>(raw: string | undefined, allowed: readonly T[]): T[] =>
  [...new Set((raw ?? "").split(",").filter((v): v is T => (allowed as readonly string[]).includes(v)))];

function int(raw: string | undefined, min: number, max: number) {
  if (!raw || !/^\d+$/.test(raw)) return undefined;
  const n = Number(raw);
  return n >= min && n <= max ? n : undefined;
}

function num(raw: string | undefined, min: number, max: number) {
  if (!raw || !/^\d+(\.\d+)?$/.test(raw)) return undefined;
  const n = Number(raw);
  return n >= min && n <= max ? n : undefined;
}

const bool = (raw: string | undefined) => (raw === "1" ? true : raw === "0" ? false : undefined);

/** Reads params written by `filtersToParams`. Unknown or out-of-range values are dropped. */
export function filtersFromParams(get: (name: string) => string | null | undefined): StayFilters {
  const v = (name: string) => get(name) ?? undefined;
  const text = v("text")?.trim().slice(0, MAX_TEXT);
  const place = v("place")?.trim().toLowerCase().slice(0, 80);
  const sort = v("sort");
  return {
    text: text || undefined,
    place: place || undefined,
    types: pick(v("types"), PROPERTY_TYPES),
    minPrice: int(v("minPrice"), 0, MAX_PRICE),
    maxPrice: int(v("maxPrice"), 1, MAX_PRICE),
    guests: int(v("guests"), 1, 50),
    bedrooms: int(v("bedrooms"), 1, 20),
    beds: int(v("beds"), 1, 30),
    bathrooms: int(v("bathrooms"), 1, 20),
    amenities: pick(v("amenities"), AMENITIES),
    pets: bool(v("pets")),
    smoking: bool(v("smoking")),
    parties: bool(v("parties")),
    minRating: num(v("minRating"), 0, 5),
    superhost: v("superhost") === "1" || undefined,
    cancellation: pick(v("cancellation"), CANCELLATION_TIERS),
    vibes: pick(v("vibes"), VIBES),
    sort: (SORTS as readonly string[]).includes(sort ?? "") ? (sort as SortOption) : "best",
  };
}

// ---- Words --------------------------------------------------------------------

const titleCase = (s: string) => s.replace(/\b[a-z]/g, (c) => c.toUpperCase());
const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1);

export const vibeLabel = (vibe: Vibe) => capitalize(vibe);

/** A place filter as shown: "lisbon" → "Lisbon", "ca" → "CA". */
export const placeLabel = (place: string) => (place.length === 2 ? place.toUpperCase() : titleCase(place));

export function priceLabel(min?: number, max?: number) {
  if (min !== undefined && max !== undefined) return `$${min}–$${max}`;
  if (max !== undefined) return `Under $${max}`;
  if (min !== undefined) return `From $${min}`;
  return "Any price";
}

/** One removable chip per active filter. `clear` returns the filters without it. */
export type ActiveFilter = { key: string; label: string; clear: (f: StayFilters) => StayFilters };

export function activeFilters(filters: StayFilters): ActiveFilter[] {
  const chips: ActiveFilter[] = [];
  const add = (key: string, label: string, clear: (f: StayFilters) => StayFilters) => chips.push({ key, label, clear });

  if (filters.text) add("text", `“${filters.text}”`, (f) => ({ ...f, text: undefined }));
  if (filters.place) add("place", placeLabel(filters.place), (f) => ({ ...f, place: undefined }));
  for (const t of filters.types) add(`type:${t}`, typeLabels[t], (f) => ({ ...f, types: f.types.filter((x) => x !== t) }));
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    add("price", priceLabel(filters.minPrice, filters.maxPrice), (f) => ({ ...f, minPrice: undefined, maxPrice: undefined }));
  }
  if (filters.guests) add("guests", `${filters.guests}+ guests`, (f) => ({ ...f, guests: undefined }));
  if (filters.bedrooms) add("bedrooms", `${filters.bedrooms}+ bedrooms`, (f) => ({ ...f, bedrooms: undefined }));
  if (filters.beds) add("beds", `${filters.beds}+ beds`, (f) => ({ ...f, beds: undefined }));
  if (filters.bathrooms) add("bathrooms", `${filters.bathrooms}+ baths`, (f) => ({ ...f, bathrooms: undefined }));
  for (const a of filters.amenities) {
    add(`amenity:${a}`, amenityLabels[a], (f) => ({ ...f, amenities: f.amenities.filter((x) => x !== a) }));
  }
  if (filters.pets !== undefined) add("pets", filters.pets ? "Pet Friendly" : "No Pets", (f) => ({ ...f, pets: undefined }));
  if (filters.smoking !== undefined) {
    add("smoking", filters.smoking ? "Smoking OK" : "No Smoking", (f) => ({ ...f, smoking: undefined }));
  }
  if (filters.parties !== undefined) {
    add("parties", filters.parties ? "Parties OK" : "No Parties", (f) => ({ ...f, parties: undefined }));
  }
  if (filters.minRating) add("rating", `${filters.minRating}+ rating`, (f) => ({ ...f, minRating: undefined }));
  if (filters.superhost) add("superhost", "Superhost", (f) => ({ ...f, superhost: undefined }));
  for (const c of filters.cancellation) {
    add(`cancel:${c}`, `${cancellationLabels[c]} cancellation`, (f) => ({
      ...f,
      cancellation: f.cancellation.filter((x) => x !== c),
    }));
  }
  for (const v of filters.vibes) add(`vibe:${v}`, vibeLabel(v), (f) => ({ ...f, vibes: f.vibes.filter((x) => x !== v) }));
  return chips;
}

/** How many filters are set, not counting keywords or sort (the filter button's badge). */
export const filterCount = (filters: StayFilters) => activeFilters(filters).filter((c) => c.key !== "text").length;

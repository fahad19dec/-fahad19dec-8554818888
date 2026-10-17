import type { Amenity, PropertyType } from "@/lib/stays";

// Turns one sentence into exact constraints (which become GROQ filters) and
// soft terms (which only rank). Values are only ever parsed in code.

export type ParsedQuery = {
  maxPrice?: number;
  guests?: number;
  type?: PropertyType;
  amenities: Amenity[];
  pets?: boolean;
  /** Where the stay is. `values` are lowercase names any place field may equal. */
  place?: { label: string; values: string[] };
  /** Leftover words that rank but don't filter, e.g. "quiet". */
  terms: string[];
};

const typeWords: [RegExp, PropertyType][] = [
  [/\b(cabins?|chalets?|a-?frames?|lodges?|log homes?)\b/, "cabin"],
  [/\b(beach( houses?)?|beachfront|seaside|oceanfront|bungalows?)\b/, "beach"],
  [/\b(villas?|mansions?)\b/, "villa"],
  [/\b(city|apartments?|apts?|lofts?|flats?|studios?|downtown|condos?)\b/, "city"],
];

const amenityWords: [RegExp, Amenity][] = [
  [/\b(hot ?tubs?|jacuzzis?|spa)\b/, "hotTub"],
  [/\b(pools?|swimming)\b/, "pool"],
  [/\b(fireplaces?|wood ?stoves?)\b/, "fireplace"],
  [/\b(fire ?pits?|campfires?)\b/, "firePit"],
  [/\bsaunas?\b/, "sauna"],
  [/\b(wi-?fi|internet)\b/, "wifi"],
  [/\bkitchens?\b/, "kitchen"],
  [/\b(workspace|desk|work from (home|here))\b/, "workspace"],
  [/\b(parking|garage)\b/, "parking"],
  [/\b(washer|laundry)\b/, "washer"],
  [/\b(air ?con(ditioning)?|a\/c|ac)\b/, "ac"],
  [/\b(ocean|sea) ?views?\b/, "oceanView"],
  [/\b(lake ?views?|lakefront|lakeside|on the lake)\b/, "lakeView"],
  [/\bmountain ?views?\b/, "mountainView"],
  [/\bbeach access\b/, "beachAccess"],
  [/\b(bbq|barbecue|grill)\b/, "bbq"],
  [/\b(ev|electric car|tesla) ?charg(er|ing)\b/, "evCharger"],
];

const petWords = /\b(pet[- ]?friendly|pets?( (allowed|ok|welcome))?|dogs?|cats?|puppy)\b/;

const pricePatterns = [
  /\b(?:under|below|less than|max(?:imum)?|up to|at most|cheaper than)\s*\$?\s*(\d[\d,]*)/,
  /\$\s*(\d[\d,]*)/,
  /\b(\d[\d,]*)\s*(?:dollars|bucks|usd)\b/,
];

const guestPatterns = [
  /\b(\d+)\s*(?:guests?|people|persons|adults|of us)\b/,
  /\b(?:for|sleeps|sleeping|fits)\s+(\d+)\b/,
];

// US stays store the state code as `region` ("CA"); guests type either form.
const usStates: Record<string, string> = {
  alabama: "al", alaska: "ak", arizona: "az", arkansas: "ar", california: "ca", colorado: "co",
  connecticut: "ct", delaware: "de", florida: "fl", georgia: "ga", hawaii: "hi", idaho: "id",
  illinois: "il", indiana: "in", iowa: "ia", kansas: "ks", kentucky: "ky", louisiana: "la",
  maine: "me", maryland: "md", massachusetts: "ma", michigan: "mi", minnesota: "mn",
  mississippi: "ms", missouri: "mo", montana: "mt", nebraska: "ne", nevada: "nv",
  "new hampshire": "nh", "new jersey": "nj", "new mexico": "nm", "new york": "ny",
  "north carolina": "nc", "north dakota": "nd", ohio: "oh", oklahoma: "ok", oregon: "or",
  pennsylvania: "pa", "rhode island": "ri", "south carolina": "sc", "south dakota": "sd",
  tennessee: "tn", texas: "tx", utah: "ut", vermont: "vt", virginia: "va", washington: "wa",
  "west virginia": "wv", wisconsin: "wi", wyoming: "wy",
};
const stateNames = Object.fromEntries(Object.entries(usStates).map(([name, code]) => [code, name]));
const placeAliases: Record<string, string> = {
  usa: "united states",
  us: "united states",
  america: "united states",
  "the us": "united states",
  "the usa": "united states",
};

// Map common synonyms onto the vibe words stays are tagged with.
const synonyms: Record<string, string> = {
  calm: "quiet",
  silent: "quiet",
  tranquil: "peaceful",
  serene: "peaceful",
  relaxing: "peaceful",
  cosy: "cozy",
  snug: "cozy",
  remote: "secluded",
  private: "secluded",
  isolated: "secluded",
  hidden: "secluded",
  luxurious: "luxury",
  fancy: "luxury",
  upscale: "luxury",
  view: "views",
  scenic: "views",
  kids: "family",
  families: "family",
  central: "walkable",
  busy: "lively",
  nightlife: "lively",
};

const stopwords = new Set(
  "a an the and or with without in near on of to at by from for my our me we us i want need looking something somewhere place places stay stays home house night nights per weekend week trip that has have is are be it this some any very really nice good great can could would like find show give get about around up who where what which please"
    .split(" "),
);

function take(text: string, pattern: RegExp): [RegExpMatchArray | null, string] {
  const match = text.match(pattern);
  return [match, match ? text.replace(match[0], " ") : text];
}

const toNumber = (raw: string) => Number(raw.replace(/,/g, ""));
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const titleCase = (s: string) => s.replace(/\b[a-z]/g, (c) => c.toUpperCase());

// The longest known place name in the text wins ("mexico city" over "mexico").
// Two-letter codes only count after "in"/"near", so "or" and "hi" stay words.
function takePlace(text: string, knownPlaces: string[]): [ParsedQuery["place"], string] {
  const names = [...new Set([...knownPlaces, ...Object.keys(usStates), ...Object.keys(placeAliases)])]
    .filter((name) => name.length > 2)
    .sort((a, b) => b.length - a.length);
  const codes = Object.keys(stateNames);

  let found: string | undefined;
  let rest = text;
  for (const name of names) {
    const [match, after] = take(rest, new RegExp(`\\b(?:(?:in|near)\\s+)?${escape(name)}\\b`));
    if (match) {
      found = name;
      rest = after;
      break;
    }
  }
  if (!found) {
    const [match, after] = take(rest, new RegExp(`\\b(?:in|near)\\s+(${codes.join("|")})\\b`));
    if (match) {
      found = match[1];
      rest = after;
    }
  }
  if (!found) return [undefined, text];

  const name = placeAliases[found] ?? found;
  const values = [name, usStates[name], stateNames[name]].filter((v): v is string => !!v);
  const label = stateNames[name] ? name.toUpperCase() : titleCase(name);
  return [{ label, values }, rest];
}

// Lowercased, apostrophes dropped, per-night phrasing removed, padded with spaces.
const normalize = (input: string) =>
  ` ${input.toLowerCase().replace(/[’']/g, "")} `.replace(/\b(a|per|\/)\s*night\b|\/night|\bnightly\b/g, " ");

/** The place a sentence names, if any (used on the server, where Jev reads the rest). */
export const findPlace = (input: string, knownPlaces: string[]) => takePlace(normalize(input), knownPlaces)[0];

/** The names one place goes by: "california" → ["california", "ca"], "usa" → ["united states"]. */
export function placeValues(place: string): string[] {
  const name = placeAliases[place] ?? place;
  return [name, usStates[name], stateNames[name]].filter((v): v is string => !!v);
}

/** Every value a place filter may hold: stay place names, US states and codes, aliases. */
export function placeValueSet(knownPlaces: string[]): Set<string> {
  return new Set([
    ...knownPlaces,
    ...Object.keys(usStates),
    ...Object.values(usStates),
    ...Object.values(placeAliases),
  ]);
}

/** `knownPlaces`: lowercase city, region, country and neighborhood names of every stay. */
export function parseQuery(input: string, knownPlaces: string[] = []): ParsedQuery {
  let text = normalize(input);
  const query: ParsedQuery = { amenities: [], terms: [] };

  for (const pattern of pricePatterns) {
    const [match, rest] = take(text, pattern);
    if (match) {
      query.maxPrice = toNumber(match[1]);
      text = rest;
      break;
    }
  }

  for (const pattern of guestPatterns) {
    const [match, rest] = take(text, pattern);
    if (match) {
      query.guests = toNumber(match[1]);
      text = rest;
      break;
    }
  }

  // Places before types and amenities, so "Mexico City" and "Cannon Beach"
  // aren't read as the city or beach type.
  const [place, afterPlace] = takePlace(text, knownPlaces);
  if (place) {
    query.place = place;
    text = afterPlace;
  }

  // Amenities before types, so "beach access" isn't read as the beach type.
  for (const [pattern, amenity] of amenityWords) {
    const [match, rest] = take(text, pattern);
    if (match) {
      query.amenities.push(amenity);
      text = rest;
    }
  }

  for (const [pattern, type] of typeWords) {
    const [match, rest] = take(text, pattern);
    if (match) {
      query.type ??= type;
      text = rest;
    }
  }

  const [pets, rest] = take(text, petWords);
  if (pets) {
    query.pets = true;
    text = rest;
  }

  query.terms = [
    ...new Set(
      text
        .split(/[^a-z-]+/)
        .filter((w) => w.length > 2 && !stopwords.has(w))
        .map((w) => synonyms[w] ?? w),
    ),
  ];

  return query;
}

export const amenityLabels: Record<Amenity, string> = {
  hotTub: "Hot Tub",
  pool: "Pool",
  fireplace: "Fireplace",
  firePit: "Fire Pit",
  sauna: "Sauna",
  wifi: "Wi-Fi",
  kitchen: "Kitchen",
  workspace: "Workspace",
  parking: "Parking",
  washer: "Washer",
  ac: "A/C",
  oceanView: "Ocean View",
  lakeView: "Lake View",
  mountainView: "Mountain View",
  beachAccess: "Beach Access",
  bbq: "BBQ Grill",
  evCharger: "EV Charger",
};

export const typeLabels: Record<PropertyType, string> = {
  cabin: "Cabins",
  beach: "Beach",
  city: "City",
  villa: "Villas",
};

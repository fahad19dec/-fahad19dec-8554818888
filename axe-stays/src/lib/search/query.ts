import type { IconName } from "@/components/ui";
import type { Amenity, SearchStay } from "@/lib/stays";

import { amenityLabels } from "./parse";

// "Why it matched" tags on Search result cards. Filtering and ranking happen on
// the server (src/lib/server/stay-search.ts).

/** What the guest asked for, for card tags. */
export const askedFor = (filters: { amenities: Amenity[]; pets?: boolean }) => ({
  amenities: filters.amenities,
  pets: filters.pets === true,
});

// ---- Card tags ("why it matched") -------------------------------------------

export type StayTag = { key: string; label: string; icon: IconName };

const amenityIcons: Partial<Record<Amenity, IconName>> = {
  hotTub: "hotTub",
  pool: "pool",
  sauna: "sauna",
  fireplace: "fireplace",
  oceanView: "water",
  lakeView: "water",
  mountainView: "mountain",
  beachAccess: "beachAccess",
  firePit: "firePit",
};
// Standout amenities, best first.
const tagOrder = Object.keys(amenityIcons) as Amenity[];
// Everyday amenities only fill a card that has nothing standout.
const everydayIcons: Partial<Record<Amenity, IconName>> = {
  workspace: "workspace",
  wifi: "wifi",
  kitchen: "kitchen",
  ac: "ac",
};

const amenityTag = (a: Amenity): StayTag => ({
  key: a,
  label: amenityLabels[a],
  icon: amenityIcons[a] ?? everydayIcons[a] ?? "success",
});
const petsTag: StayTag = { key: "pets", label: "Pet Friendly", icon: "pets" };

/**
 * Two tags per card: what the guest asked for first, then the stay's best
 * amenity, Pet Friendly when pets are allowed, then its next amenity, then an
 * everyday one.
 */
export function stayTags(
  stay: Pick<SearchStay, "amenities" | "petsAllowed">,
  asked: { amenities: Amenity[]; pets: boolean },
  max = 2,
): StayTag[] {
  const tags: StayTag[] = [
    ...asked.amenities.filter((a) => stay.amenities?.includes(a)).map(amenityTag),
    ...(asked.pets && stay.petsAllowed ? [petsTag] : []),
  ];
  const standout = tagOrder.filter((a) => stay.amenities?.includes(a));
  const fill = [
    ...standout.slice(0, 1).map(amenityTag),
    ...(stay.petsAllowed ? [petsTag] : []),
    ...standout.slice(1).map(amenityTag),
    ...(Object.keys(everydayIcons) as Amenity[]).filter((a) => stay.amenities?.includes(a)).map(amenityTag),
  ];
  for (const tag of fill) {
    if (tags.length >= max) break;
    if (!tags.some((t) => t.key === tag.key || t.label === tag.label)) tags.push(tag);
  }
  return tags.slice(0, max);
}

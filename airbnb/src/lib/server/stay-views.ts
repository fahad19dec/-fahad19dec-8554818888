import type { HomeStay, RoamPolicy, SearchStay, StayDetails, StayRecord } from "@/lib/stays";

import type { Db } from "./store";

// Server only. What each screen reads from a stored stay. Sanity CDN photos
// (the seed's) are sized here. Uploaded photos are stored as "/api/uploads/…"
// and made absolute with the request's origin, since native apps can't load a
// relative image URL.

export function sizedImage(url: string | undefined, width: number, origin: string) {
  if (!url) return "";
  if (url.startsWith("/")) return `${origin}${url}`;
  return url.startsWith("https://cdn.sanity.io/") ? `${url}?w=${width}&auto=format&q=80` : url;
}

export const homeView = (s: StayRecord, origin: string): HomeStay => ({
  id: s.id,
  slug: s.slug,
  title: s.title,
  type: s.type,
  city: s.city,
  region: s.region ?? null,
  country: s.country,
  rating: s.rating,
  pricePerNight: s.pricePerNight,
  imageUrl: sizedImage(s.photos[0]?.url, 1200, origin),
  imageAlt: s.photos[0]?.alt ?? null,
});

export const searchView = (s: StayRecord, origin: string): SearchStay => ({
  ...homeView(s, origin),
  imageUrl: sizedImage(s.photos[0]?.url, 600, origin),
  reviewCount: s.reviewCount,
  amenities: s.amenities,
  petsAllowed: s.houseRules.petsAllowed === true,
});

// Roam's policies read in this order on a stay; anything new goes last.
const policyOrder = ["checkIn", "pets", "payment", "damage", "guestRefund"];
const rank = (kind: string) => {
  const i = policyOrder.indexOf(kind);
  return i === -1 ? policyOrder.length : i;
};

const policyView = ({ kind, title, summary, body }: RoamPolicy) => ({ kind, title, summary, body });

export function detailsView(s: StayRecord, db: Db, origin: string): StayDetails {
  const host = db.hosts.find((h) => h.slug === s.hostSlug);
  const cancellation = db.policies.find((p) => p.slug === s.cancellationPolicySlug);
  return {
    id: s.id,
    slug: s.slug,
    title: s.title,
    type: s.type,
    city: s.city,
    region: s.region ?? null,
    country: s.country,
    rating: s.rating,
    reviewCount: s.reviewCount,
    pricePerNight: s.pricePerNight,
    cleaningFee: s.cleaningFee ?? null,
    minNights: s.minNights ?? null,
    maxGuests: s.maxGuests,
    amenities: s.amenities,
    photos: s.photos.map((p) => ({ url: sizedImage(p.url, 1200, origin), alt: p.alt })),
    houseRules: s.houseRules,
    host: host
      ? {
          name: host.name,
          photoUrl: host.photoUrl ? sizedImage(host.photoUrl, 200, origin) : null,
          bio: host.bio ?? null,
          isSuperhost: host.isSuperhost ?? null,
          hostingSince: host.hostingSince ?? null,
          responseTime: host.responseTime ?? null,
          languages: host.languages ?? null,
        }
      : null,
    cancellationPolicy: cancellation ? policyView(cancellation) : null,
    policies: db.policies
      .filter((p) => p.kind !== "cancellation")
      .map(policyView)
      .sort((a, b) => rank(a.kind) - rank(b.kind)),
  };
}

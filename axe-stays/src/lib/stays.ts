// The listing model. Stays are stored as `StayRecord`s in the local database
// (src/lib/server/store.ts); screens read the smaller views below.
export type PropertyType = "cabin" | "beach" | "city" | "villa";

export type Amenity =
  | "hotTub"
  | "pool"
  | "fireplace"
  | "firePit"
  | "sauna"
  | "wifi"
  | "kitchen"
  | "workspace"
  | "parking"
  | "washer"
  | "ac"
  | "oceanView"
  | "lakeView"
  | "beachAccess"
  | "mountainView"
  | "bbq"
  | "evCharger";

// What Home's photo card needs.
export type StayCardData = {
  id: string;
  title: string;
  city: string;
  region?: string | null;
  country?: string | null;
  rating: number;
  pricePerNight: number;
  imageUrl: string;
  imageAlt?: string | null;
};

export type HomeStay = StayCardData & { slug: string; type: PropertyType };

// "Lake Arrowhead, CA" when a region is set, otherwise "Lisbon, Portugal".
export const placeLabel = (stay: Pick<StayCardData, "city" | "region" | "country">) =>
  [stay.city, stay.region || stay.country].filter(Boolean).join(", ");

/** "4.9", or "New" for a stay with no ratings yet (new listings from the admin). */
export const ratingLabel = (rating: number) => (rating > 0 ? rating.toFixed(1) : "New");

// A Search result row (src/lib/server/stay-views.ts projects exactly this).
export type SearchStay = StayCardData & {
  slug: string;
  type: PropertyType;
  reviewCount: number;
  amenities: Amenity[] | null;
  petsAllowed: boolean;
};

// ---- Stay details (src/lib/server/stay-views.ts projects exactly this)

export type HouseRules = {
  checkInTime: string;
  checkOutTime: string;
  quietHoursFrom?: string | null;
  quietHoursTo?: string | null;
  petsAllowed: boolean;
  maxPets?: number | null;
  petFee?: number | null;
  smokingAllowed?: boolean | null;
  partiesAllowed?: boolean | null;
  additionalRules?: string[] | null;
};

// The Portable Text the policy schema allows: paragraphs, h3, bullets, strong.
export type PolicySpan = { _key: string; text: string; marks?: string[] };
export type PolicyBlock = {
  _key: string;
  _type: string;
  style?: string;
  listItem?: string;
  children?: PolicySpan[];
};

export type Policy = { kind: string; title: string; summary?: string | null; body: PolicyBlock[] };

/** A platform policy on its own; cancellation has one per tier. */
export type PlatformPolicy = Policy & { slug: string };

export type ResponseTime = "withinHour" | "withinFewHours" | "withinDay";

export type StayHost = {
  name: string;
  photoUrl?: string | null;
  bio?: string | null;
  isSuperhost?: boolean | null;
  hostingSince?: string | null;
  responseTime?: ResponseTime | null;
  languages?: string[] | null;
};

export type StayDetails = {
  id: string;
  slug: string;
  title: string;
  type: PropertyType;
  city: string;
  region?: string | null;
  country?: string | null;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  cleaningFee?: number | null;
  minNights?: number | null;
  maxGuests?: number | null;
  amenities: Amenity[] | null;
  photos: { url: string; alt?: string | null }[];
  houseRules: HouseRules;
  host: StayHost | null;
  cancellationPolicy: Policy | null;
  /** The platform's policies that apply to every stay. */
  policies: Policy[];
  weeklyDiscountPercent?: number | null;
  /** Nights already booked, as [checkIn, checkOut) ranges. */
  booked?: { checkIn: string; checkOut: string }[];
};

// ---- Stored records (data/seed.json, data/db.json)

export type Photo = { url: string; alt: string };

export type CancellationTier = "flexible-cancellation" | "moderate-cancellation" | "strict-cancellation";

/** A stay as the database and the admin hold it. */
export type StayRecord = {
  id: string;
  slug: string;
  title: string;
  type: PropertyType;
  hostSlug: string;
  rating: number;
  reviewCount: number;
  city: string;
  region?: string;
  country: string;
  neighborhood?: string;
  location?: { lat: number; lng: number };
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: Amenity[];
  pricePerNight: number;
  cleaningFee?: number;
  minNights?: number;
  weeklyDiscountPercent?: number;
  houseRules: HouseRules;
  cancellationPolicySlug: CancellationTier;
  facts?: string[];
  vibes?: string[];
  summary?: string;
  description?: string;
  highlights?: string[];
  photos: Photo[];
  createdAt: string;
  updatedAt: string;
};

export type HostRecord = StayHost & { slug: string };

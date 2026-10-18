import { z } from "zod";

import { AMENITIES, CANCELLATION_TIERS, PROPERTY_TYPES, VIBES } from "@/lib/search/filters";
import type { HostRecord, StayRecord } from "@/lib/stays";

import { HttpError } from "./http";
import type { Db } from "./store";

// Server only. What the admin form sends to create or update a stay. Every
// field is checked here, whatever the form already checked. Mirrors the
// StayRecord type; ids, slugs and timestamps are set by the server.

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour HH:MM");
const text = (max: number) => z.string().trim().max(max);
const required = (max: number) => text(max).min(1, "Required");
const optionalText = (max: number) => text(max).optional().transform((v) => v || undefined);
const lines = (maxItems: number, maxLength: number) =>
  z.array(text(maxLength)).max(maxItems).default([]).transform((list) => list.filter(Boolean));
const count = (min: number, max: number) => z.number().int("Whole number").min(min, `At least ${min}`).max(max, `At most ${max}`);

// Uploaded photos are served by this app; others must be web URLs.
const photoUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((url) => /^https?:\/\/\S+$/.test(url) || /^\/api\/uploads\/[a-z0-9_]+\.(jpg|png|webp|gif)$/.test(url), "Use an image URL starting with https:// or upload a photo");

export const stayInputSchema = z
  .object({
    title: required(60),
    type: z.enum(PROPERTY_TYPES),
    hostSlug: optionalText(96),
    newHostName: optionalText(60),
    rating: z.number().min(0).max(5).default(0),
    reviewCount: count(0, 100000).default(0),

    city: required(60),
    region: optionalText(60),
    country: required(60),
    neighborhood: optionalText(60),

    maxGuests: count(1, 50),
    bedrooms: count(0, 20),
    beds: count(1, 30),
    bathrooms: z.number().min(0.5, "At least 0.5").max(20).multipleOf(0.5, "Use halves, e.g. 1.5"),
    amenities: z.array(z.enum(AMENITIES)).max(AMENITIES.length).transform((a) => [...new Set(a)]),

    pricePerNight: count(1, 100000),
    cleaningFee: count(0, 100000).optional(),
    minNights: count(1, 365).default(1),
    weeklyDiscountPercent: count(0, 50).optional(),

    houseRules: z.object({
      checkInTime: time,
      checkOutTime: time,
      quietHoursFrom: time.optional(),
      quietHoursTo: time.optional(),
      petsAllowed: z.boolean(),
      maxPets: count(1, 10).optional(),
      petFee: count(0, 10000).optional(),
      smokingAllowed: z.boolean().default(false),
      partiesAllowed: z.boolean().default(false),
      additionalRules: lines(10, 200),
    }),
    cancellationPolicySlug: z.enum(CANCELLATION_TIERS),

    facts: lines(20, 200),
    vibes: z.array(z.enum(VIBES)).max(VIBES.length).default([]),
    summary: optionalText(90),
    description: optionalText(2000),
    highlights: lines(4, 120),
    photos: z
      .array(z.object({ url: photoUrl, alt: required(200) }))
      .min(1, "Add at least one photo")
      .max(20),
  })
  .refine((s) => s.hostSlug || s.newHostName, { path: ["hostSlug"], message: "Pick a host or add a new one" })
  .refine((s) => !s.houseRules.quietHoursFrom === !s.houseRules.quietHoursTo, {
    path: ["houseRules", "quietHoursTo"],
    message: "Set both quiet-hour times, or neither",
  });

export type StayInput = z.infer<typeof stayInputSchema>;

/** The parsed body, or a 400 with one message per bad field. */
export function parseStayInput(body: unknown): StayInput {
  const result = stayInputSchema.safeParse(body);
  if (result.success) return result.data;
  const fields: Record<string, string> = {};
  for (const issue of result.error.issues) fields[issue.path.join(".") || "form"] ??= issue.message;
  throw new HttpError(400, "invalid_stay", fields);
}

const slugify = (title: string) =>
  title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "stay";

/** A slug no other stay (or host) has: "lake-cabin", then "lake-cabin-2"… */
export function uniqueSlug(title: string, taken: Iterable<string>) {
  const used = new Set(taken);
  const base = slugify(title);
  let slug = base;
  for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}

/** Resolves the host (creating it when `newHostName` is set) and returns the stay's stored fields. */
export function stayFields(input: StayInput, db: Db): Omit<StayRecord, "id" | "slug" | "createdAt" | "updatedAt"> {
  let hostSlug = input.hostSlug;
  if (input.newHostName) {
    const host: HostRecord = {
      slug: uniqueSlug(input.newHostName, db.hosts.map((h) => h.slug)),
      name: input.newHostName,
      isSuperhost: false,
      hostingSince: new Date().toISOString().slice(0, 10),
    };
    db.hosts.push(host);
    hostSlug = host.slug;
  } else if (!db.hosts.some((h) => h.slug === hostSlug)) {
    throw new HttpError(400, "invalid_stay", { hostSlug: "That host doesn’t exist" });
  }

  const { newHostName: _new, hostSlug: _host, houseRules, ...rest } = input;
  return {
    ...rest,
    hostSlug: hostSlug!,
    houseRules: {
      ...houseRules,
      // Pet details only mean something when pets are allowed.
      maxPets: houseRules.petsAllowed ? houseRules.maxPets : undefined,
      petFee: houseRules.petsAllowed ? houseRules.petFee : undefined,
    },
  };
}

// Web Crypto, so the browser demo (src/lib/demo/server.ts) can use this file too.
export const newStayId = () =>
  `stay_${Array.from(globalThis.crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, "0")).join("")}`;

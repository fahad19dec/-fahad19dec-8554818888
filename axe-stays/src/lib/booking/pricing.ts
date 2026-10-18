import type { CancellationTier, StayRecord } from "../stays";

// Prices and refunds, exactly as the sample policies describe them
// (data/seed.json: "Booking and payment" and the three cancellation tiers).
// The server is the only place that charges or refunds; the app calls the
// same functions just to show a preview. Money is integer US cents.
//
// Relative imports only: the admin dashboard imports this file too.

export const SERVICE_FEE_RATE = 0.12;
export const WEEKLY_NIGHTS = 7;
export const MAX_NIGHTS = 90;

export type QuoteInput = { checkIn: string; checkOut: string; guests: number; pets: number };

export type Quote = {
  nights: number;
  /** Before the weekly discount. */
  nightlyTotalCents: number;
  discountCents: number;
  cleaningCents: number;
  petFeeCents: number;
  /** 12% of the nightly total after the discount. */
  serviceFeeCents: number;
  totalCents: number;
};

export type PricedStay = Pick<
  StayRecord,
  "pricePerNight" | "cleaningFee" | "minNights" | "weeklyDiscountPercent" | "maxGuests" | "houseRules"
>;

const DAY = 86_400_000;
const isDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
const dayNumber = (date: string) => Math.round(Date.parse(`${date}T00:00:00Z`) / DAY);

/** "2026-10-18" for today in UTC. */
export const todayIso = (at = new Date()) => at.toISOString().slice(0, 10);

/** `date` plus `days`, as YYYY-MM-DD. */
export const addDays = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);

export const nightsBetween = (checkIn: string, checkOut: string) => dayNumber(checkOut) - dayNumber(checkIn);

/** Why these dates or guests can't be booked, or null when they can. Field keys match QuoteInput. */
export function quoteProblems(stay: PricedStay, input: QuoteInput, today = todayIso()): Record<string, string> | null {
  const problems: Record<string, string> = {};
  if (!isDate(input.checkIn)) problems.checkIn = "Pick a check-in date";
  if (!isDate(input.checkOut)) problems.checkOut = "Pick a check-out date";
  if (!problems.checkIn && input.checkIn < today) problems.checkIn = "Check-in can’t be in the past";
  if (!problems.checkIn && !problems.checkOut) {
    const nights = nightsBetween(input.checkIn, input.checkOut);
    const min = stay.minNights ?? 1;
    if (nights < 1) problems.checkOut = "Check-out must be after check-in";
    else if (nights < min) problems.checkOut = `This stay needs at least ${min} nights`;
    else if (nights > MAX_NIGHTS) problems.checkOut = `Stays can be at most ${MAX_NIGHTS} nights`;
  }
  if (!Number.isInteger(input.guests) || input.guests < 1) problems.guests = "Add at least 1 guest";
  else if (input.guests > stay.maxGuests) problems.guests = `This stay sleeps up to ${stay.maxGuests}`;
  if (!Number.isInteger(input.pets) || input.pets < 0) problems.pets = "Pets must be 0 or more";
  else if (input.pets > 0 && !stay.houseRules.petsAllowed) problems.pets = "This stay doesn’t allow pets";
  else if (input.pets > 0 && stay.houseRules.maxPets && input.pets > stay.houseRules.maxPets) {
    problems.pets = `Up to ${stay.houseRules.maxPets} pets`;
  }
  return Object.keys(problems).length ? problems : null;
}

/** The price of a valid request. Call quoteProblems first. */
export function quote(stay: PricedStay, input: QuoteInput): Quote {
  const nights = nightsBetween(input.checkIn, input.checkOut);
  const nightlyTotalCents = stay.pricePerNight * 100 * nights;
  const discountCents =
    nights >= WEEKLY_NIGHTS ? Math.round((nightlyTotalCents * (stay.weeklyDiscountPercent ?? 0)) / 100) : 0;
  const cleaningCents = (stay.cleaningFee ?? 0) * 100;
  const petFeeCents = input.pets > 0 ? (stay.houseRules.petFee ?? 0) * 100 : 0;
  const serviceFeeCents = Math.round((nightlyTotalCents - discountCents) * SERVICE_FEE_RATE);
  return {
    nights,
    nightlyTotalCents,
    discountCents,
    cleaningCents,
    petFeeCents,
    serviceFeeCents,
    totalCents: nightlyTotalCents - discountCents + cleaningCents + petFeeCents + serviceFeeCents,
  };
}

// ---- Refunds ------------------------------------------------------------------

export type RefundedBooking = Quote & { checkIn: string; createdAt: string };
export type Refund = { refundCents: number; serviceRefundCents: number; rule: string };

const HOUR = 3_600_000;

/**
 * What a guest gets back for cancelling `at`, under the stay's cancellation
 * tier. Check-in time comes from the house rules and is read as UTC (stays
 * don't store a time zone yet). The pet fee is refunded with the cleaning fee.
 */
export function guestRefund(
  booking: RefundedBooking,
  tier: CancellationTier,
  checkInTime = "15:00",
  at = new Date(),
): Refund {
  const checkInAt = Date.parse(`${booking.checkIn}T${checkInTime}:00Z`);
  const hoursBefore = (checkInAt - at.getTime()) / HOUR;
  const nightsCents = booking.nightlyTotalCents - booking.discountCents;
  const perNight = nightsCents / booking.nights;
  const fees = booking.cleaningCents + booking.petFeeCents;
  // Nights that start at least `leadHours` from now (after check-in).
  const futureNights = (leadHours: number) => {
    let count = 0;
    for (let n = 0; n < booking.nights; n++) if (checkInAt + n * 24 * HOUR - at.getTime() >= leadHours * HOUR) count++;
    return count;
  };
  const full: Refund = { refundCents: booking.totalCents, serviceRefundCents: booking.serviceFeeCents, rule: "Full refund" };
  const make = (cents: number, rule: string): Refund => ({ refundCents: Math.round(cents), serviceRefundCents: 0, rule });

  if (tier === "flexible-cancellation") {
    if (hoursBefore >= 24) return full;
    if (hoursBefore > 0) return make(nightsCents - perNight + fees, "First night not refunded");
    return make(perNight * futureNights(24), "Unstayed nights at least 24 hours away");
  }
  if (tier === "moderate-cancellation") {
    if (hoursBefore >= 5 * 24) return full;
    if (hoursBefore > 0) return make(nightsCents * 0.5 + fees, "50% of nights, fees in full");
    return make(perNight * futureNights(0) * 0.5, "50% of unstayed nights");
  }
  // Strict
  const hoursSinceBooking = (at.getTime() - Date.parse(booking.createdAt)) / HOUR;
  if (hoursSinceBooking <= 48 && hoursBefore >= 14 * 24) return full;
  if (hoursBefore >= 7 * 24) return make(nightsCents * 0.5 + fees, "50% of nights, fees in full");
  if (hoursBefore > 0) return make(fees, "Cleaning and pet fees only");
  return make(0, "No refund after check-in");
}

export const formatCents = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

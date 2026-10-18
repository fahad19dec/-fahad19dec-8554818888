import { todayIso } from "@/lib/booking/pricing";

import type { Trip } from "@/hooks/use-trips";

export type TripGroup = "upcoming" | "past" | "cancelled";

export const tripGroup = (trip: Pick<Trip, "status" | "checkOut">, today = todayIso()): TripGroup =>
  trip.status === "cancelled" ? "cancelled" : trip.checkOut > today ? "upcoming" : "past";

/** "Dec 10 – 17, 2026" or "Dec 28, 2026 – Jan 2, 2027". */
export function tripDates(checkIn: string, checkOut: string) {
  const a = new Date(`${checkIn}T00:00:00Z`);
  const b = new Date(`${checkOut}T00:00:00Z`);
  const md = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  if (a.getUTCFullYear() !== b.getUTCFullYear()) return `${md(a)}, ${a.getUTCFullYear()} – ${md(b)}, ${b.getUTCFullYear()}`;
  if (a.getUTCMonth() === b.getUTCMonth()) return `${md(a)} – ${b.getUTCDate()}, ${b.getUTCFullYear()}`;
  return `${md(a)} – ${md(b)}, ${b.getUTCFullYear()}`;
}

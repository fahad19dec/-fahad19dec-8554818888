import { all, get } from "./database";
import { addDays, todayIso } from "../booking/pricing";

// The admin overview: totals and one value per day for the last `days` days.
// GMV is what guests paid minus refunds; revenue is the service fees kept.

export type DayPoint = { date: string; signups: number; bookings: number; gmvCents: number; revenueCents: number };

export type Overview = {
  days: number;
  totals: {
    users: number;
    signups: number;
    bookings: number;
    cancellations: number;
    gmvCents: number;
    revenueCents: number;
    refundsCents: number;
    upcomingStays: number;
  };
  series: DayPoint[];
};

export function overview(days = 30): Overview {
  const today = todayIso();
  const from = addDays(today, -(days - 1));
  const range = { from: `${from}T00:00:00.000Z` };

  const signups = new Map(
    all<{ day: string; n: number }>(
      "SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS n FROM users WHERE created_at >= $from GROUP BY day",
      range,
    ).map((r) => [r.day, r.n]),
  );
  const booked = new Map(
    all<{ day: string; n: number; gmv: number; revenue: number }>(
      `SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS n,
         SUM(total_cents - refund_cents) AS gmv, SUM(service_fee_cents - refund_service_cents) AS revenue
       FROM bookings WHERE created_at >= $from GROUP BY day`,
      range,
    ).map((r) => [r.day, r]),
  );

  const series: DayPoint[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(from, i);
    const b = booked.get(date);
    series.push({ date, signups: signups.get(date) ?? 0, bookings: b?.n ?? 0, gmvCents: b?.gmv ?? 0, revenueCents: b?.revenue ?? 0 });
  }

  const sums = get<{ n: number; cancelled: number; refunds: number }>(
    `SELECT COUNT(*) AS n, SUM(status = 'cancelled') AS cancelled, COALESCE(SUM(refund_cents), 0) AS refunds
     FROM bookings WHERE created_at >= $from`,
    range,
  )!;
  return {
    days,
    totals: {
      users: get<{ n: number }>("SELECT COUNT(*) AS n FROM users")!.n,
      signups: series.reduce((t, d) => t + d.signups, 0),
      bookings: sums.n,
      cancellations: sums.cancelled ?? 0,
      gmvCents: series.reduce((t, d) => t + d.gmvCents, 0),
      revenueCents: series.reduce((t, d) => t + d.revenueCents, 0),
      refundsCents: sums.refunds,
      upcomingStays: get<{ n: number }>("SELECT COUNT(*) AS n FROM bookings WHERE status = 'confirmed' AND check_in >= $today", { today })!.n,
    },
    series,
  };
}

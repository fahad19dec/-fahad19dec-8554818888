import type { DatabaseSync } from "node:sqlite";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { addDays, quote, todayIso } from "../booking/pricing";
import type { HostRecord, PlatformPolicy, StayRecord } from "../stays";

import seed from "../../../data/seed.json";

// Fills a brand-new database once: hosts, policies and stays from
// data/seed.json (or from data/db.json, the old JSON store, if it exists, so
// listings edited before the move to SQLite carry over).
//
// Outside production it also adds clearly marked sample activity (guests,
// bookings, reports and one listing awaiting review) so the admin dashboard
// has something to show. Set SEED_SAMPLE_ACTIVITY=0 to skip it.
//
// Uses the connection it's given: db() isn't ready until this returns.

type SeedData = { hosts: HostRecord[]; policies: PlatformPolicy[]; stays: StayRecord[] };

export function seedIfEmpty(conn: DatabaseSync, dataDir: string) {
  const { n } = conn.prepare("SELECT COUNT(*) AS n FROM stays").get() as { n: number };
  if (n > 0) return;

  const legacy = path.join(dataDir, "db.json");
  const data = (existsSync(legacy) ? JSON.parse(readFileSync(legacy, "utf8")) : seed) as SeedData;

  conn.exec("BEGIN IMMEDIATE");
  try {
    // Another process may have seeded while this one waited for the lock.
    if ((conn.prepare("SELECT COUNT(*) AS n FROM stays").get() as { n: number }).n > 0) {
      conn.exec("COMMIT");
      return;
    }
    const host = conn.prepare("INSERT OR IGNORE INTO hosts (slug, data) VALUES ($slug, $data)");
    for (const h of data.hosts) host.run({ slug: h.slug, data: JSON.stringify(h) });
    const policy = conn.prepare("INSERT OR IGNORE INTO policies (slug, data) VALUES ($slug, $data)");
    for (const p of data.policies) policy.run({ slug: p.slug, data: JSON.stringify(p) });
    const stay = conn.prepare(
      `INSERT INTO stays (id, slug, status, data, created_at, updated_at)
       VALUES ($id, $slug, $status, $data, $created, $updated)`,
    );
    for (const s of data.stays) {
      stay.run({ id: s.id, slug: s.slug, status: "approved", data: JSON.stringify(s), created: s.createdAt, updated: s.updatedAt });
    }
    if (process.env.NODE_ENV !== "production" && process.env.SEED_SAMPLE_ACTIVITY !== "0") sampleActivity(conn, data.stays);
    conn.exec("COMMIT");
  } catch (error) {
    conn.exec("ROLLBACK");
    throw error;
  }
}

// ---- Sample activity (development only) ------------------------------------------

const SAMPLE_GUESTS = [
  "Priya Shah", "Marcus Lee", "Elena García", "Tom Becker", "Aisha Bello", "Kenji Sato",
  "Nora Lind", "Diego Rossi", "Hannah Cole", "Omar Haddad", "Lucy Park", "Sam Okafor",
];

// A small deterministic random, so every new database gets the same samples.
function random(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

function sampleActivity(conn: DatabaseSync, stays: StayRecord[]) {
  const rand = random(42);
  const today = todayIso();
  const stamp = (date: string, hour: number) => `${date}T${String(hour).padStart(2, "0")}:15:00.000Z`;

  const user = conn.prepare(
    `INSERT INTO users (id, email, name, role, created_at, last_seen_at)
     VALUES ($id, $email, $name, 'guest', $at, $at)`,
  );
  const guests = SAMPLE_GUESTS.map((name, i) => {
    const id = `sample_user_${i + 1}`;
    const joined = stamp(addDays(today, -Math.floor(rand() * 29)), 9 + (i % 9));
    user.run({ id, email: `${name.split(" ")[0].toLowerCase()}@example.com`, name: `${name} (sample)`, at: joined });
    return { id, joined };
  });

  const booking = conn.prepare(
    `INSERT INTO bookings (id, stay_id, user_id, check_in, check_out, guests, pets, nights,
       nightly_total_cents, discount_cents, cleaning_cents, pet_fee_cents, service_fee_cents, total_cents,
       status, refund_cents, refund_service_cents, cancelled_by, cancel_reason, payment_ref, created_at, cancelled_at)
     VALUES ($id, $stay, $user, $checkIn, $checkOut, $guests, 0, $nights, $nightly, $discount, $cleaning, 0,
       $service, $total, $status, $refund, $refundService, $by, $reason, $payment, $created, $cancelledAt)`,
  );
  // One booking per stay keeps the samples from overlapping.
  for (let i = 0; i < 22; i++) {
    const stay = stays[(i * 7) % stays.length];
    const guest = guests[i % guests.length];
    const created = addDays(today, -Math.floor(rand() * 28));
    const checkIn = addDays(created, 3 + Math.floor(rand() * 40));
    const nights = Math.max(stay.minNights ?? 1, 2 + Math.floor(rand() * 5));
    const input = { checkIn, checkOut: addDays(checkIn, nights), guests: Math.min(2, stay.maxGuests), pets: 0 };
    const price = quote(stay, input);
    const cancelled = i % 6 === 5;
    const refund = cancelled ? price.totalCents : 0;
    booking.run({
      id: `sample_bkg_${i + 1}`,
      stay: stay.id,
      user: guest.id,
      checkIn,
      checkOut: input.checkOut,
      guests: input.guests,
      nights: price.nights,
      nightly: price.nightlyTotalCents,
      discount: price.discountCents,
      cleaning: price.cleaningCents,
      service: price.serviceFeeCents,
      total: price.totalCents,
      status: cancelled ? "cancelled" : "confirmed",
      refund,
      refundService: cancelled ? price.serviceFeeCents : 0,
      by: cancelled ? "guest" : null,
      reason: cancelled ? "Plans changed (sample)" : null,
      payment: `sim_sample_${i + 1}`,
      created: stamp(created, 10 + (i % 10)),
      cancelledAt: cancelled ? stamp(addDays(created, 1), 12) : null,
    });
  }

  const report = conn.prepare(
    `INSERT INTO reports (id, reporter_id, stay_id, reason, details, created_at)
     VALUES ($id, $user, $stay, $reason, $details, $at)`,
  );
  const reports: [string, string][] = [
    ["inaccurate", "The photos show a hot tub, but the host says it’s been removed. (sample)"],
    ["scam", "Host asked me to pay outside the app by bank transfer. (sample)"],
    ["unsafe", "No smoke detector in the loft bedroom. (sample)"],
  ];
  reports.forEach(([reason, details], i) =>
    report.run({
      id: `sample_rpt_${i + 1}`,
      user: guests[i + 2].id,
      stay: stays[(i * 5 + 3) % stays.length].id,
      reason,
      details,
      at: stamp(addDays(today, -i - 1), 14),
    }),
  );

  // One listing waiting for review, built from a real stay's details.
  const base = stays[1];
  const at = new Date().toISOString();
  const pending: StayRecord = {
    ...base,
    id: "sample_stay_pending",
    slug: "sample-pinecone-yurt",
    title: "Pinecone Yurt (sample)",
    summary: "A canvas yurt under the pines, waiting for review.",
    rating: 0,
    reviewCount: 0,
    createdAt: at,
    updatedAt: at,
  };
  conn
    .prepare(
      `INSERT INTO stays (id, slug, status, review_note, data, created_at, updated_at)
       VALUES ($id, $slug, 'pending', NULL, $data, $at, $at)`,
    )
    .run({ id: pending.id, slug: pending.slug, data: JSON.stringify(pending), at });
}

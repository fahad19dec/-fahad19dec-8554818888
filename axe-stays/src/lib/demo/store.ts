import { addDays, quote, todayIso, type Quote } from "../booking/pricing";
import type { ReportReason } from "../report-reasons";
import type { StayRecord } from "../stays";

// Browser demo only. The data the demo guest app (server.ts) and the demo
// admin page (scripts/demo-admin) share through localStorage, standing in for
// the SQLite database: both pages live on one origin, so an admin change shows
// up in the app on its next request. Relative imports only, because the demo
// build also compiles this file into the admin page.

export const DEMO_ADMIN_EMAIL = "admin@axestays.dev";

export type DemoUser = {
  email: string;
  name: string;
  role: "guest" | "admin";
  status: "active" | "banned";
  banReason: string | null;
  createdAt: string;
};

export type DemoBooking = Quote & {
  id: string;
  stayId: string;
  email: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  pets: number;
  status: "confirmed" | "cancelled";
  refundCents: number;
  cancelledBy: "guest" | "admin" | null;
  cancelReason: string | null;
  paymentRef: string;
  createdAt: string;
  cancelledAt: string | null;
};

export type DemoReport = {
  id: string;
  email: string;
  stayId: string;
  reason: ReportReason;
  details: string;
  status: "open" | "resolved" | "dismissed";
  resolution: string | null;
  createdAt: string;
  closedAt: string | null;
};

/** What the admin changed on a seed stay. */
export type StayEdit = Partial<Pick<StayRecord, "title" | "summary" | "pricePerNight" | "cleaningFee" | "maxGuests">> & {
  status?: "approved" | "rejected";
  note?: string | null;
  updatedAt?: string;
};

export type DemoStore = {
  users: Record<string, DemoUser>;
  bookings: DemoBooking[];
  reports: DemoReport[];
  stays: Record<string, StayEdit>;
  audit: { at: string; actor: string; action: string; target: string }[];
  sampled?: boolean;
};

export const demoStoreKey = (slug: string) => `${slug}.demo.v3`;

let memory: DemoStore | undefined;

/** Read fresh on every call, so a change made on the other page is seen. */
export function loadStore(key: string): DemoStore {
  try {
    const saved = window.localStorage.getItem(key);
    if (saved) return (memory = JSON.parse(saved) as DemoStore);
  } catch {}
  return (memory ??= { users: {}, bookings: [], reports: [], stays: {}, audit: [] });
}

export function saveStore(key: string, store: DemoStore) {
  memory = store;
  try {
    window.localStorage.setItem(key, JSON.stringify(store));
  } catch {}
}

/** The account behind an email, created as a guest on first sight. */
export function ensureUser(store: DemoStore, email: string): DemoUser {
  return (store.users[email] ??= {
    email,
    name: email.split("@")[0],
    role: email === DEMO_ADMIN_EMAIL ? "admin" : "guest",
    status: "active",
    banReason: null,
    createdAt: new Date().toISOString(),
  });
}

/** Seed stays with the admin's edits applied, each with its status. */
export function applyStayEdits<T extends StayRecord>(stays: T[], store: DemoStore): (T & { status: "approved" | "rejected" })[] {
  return stays.map((stay) => {
    const { status = "approved", note: _note, updatedAt, ...fields } = store.stays[stay.id] ?? {};
    return { ...stay, ...fields, updatedAt: updatedAt ?? stay.updatedAt, status };
  });
}

const SAMPLE_GUESTS = ["Priya Shah", "Marcus Lee", "Elena García", "Tom Becker", "Aisha Bello", "Kenji Sato", "Nora Lind", "Diego Rossi"];

/** Clearly marked sample guests, bookings and reports, so the admin has something to show. Runs once. */
export function addSampleActivity(store: DemoStore, stays: StayRecord[]) {
  if (store.sampled) return;
  store.sampled = true;
  let s = 7;
  const random = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const today = todayIso();
  const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

  const emails = SAMPLE_GUESTS.map((name, i) => {
    const email = `${name.split(" ")[0].toLowerCase()}@example.com`;
    store.users[email] ??= { email, name: `${name} (sample)`, role: "guest", status: "active", banReason: null, createdAt: daysAgo(3 + i * 3) };
    return email;
  });
  store.users[DEMO_ADMIN_EMAIL] ??= { email: DEMO_ADMIN_EMAIL, name: "admin", role: "admin", status: "active", banReason: null, createdAt: daysAgo(40) };

  // One booking per stay keeps the samples from overlapping.
  for (let i = 0; i < 14; i++) {
    const stay = stays[i * 2];
    if (!stay) break;
    const checkIn = addDays(today, Math.round(random() * 50) - 20);
    const nights = Math.max(stay.minNights ?? 1, 2 + Math.round(random() * 4));
    const input = { checkIn, checkOut: addDays(checkIn, nights), guests: Math.min(stay.maxGuests, 2), pets: 0 };
    const cancelled = i % 5 === 4;
    const created = daysAgo(1 + Math.round(random() * 27));
    store.bookings.push({
      ...quote(stay, input),
      ...input,
      id: `sample_bkg_${i + 1}`,
      stayId: stay.id,
      email: emails[i % emails.length],
      status: cancelled ? "cancelled" : "confirmed",
      refundCents: 0,
      cancelledBy: cancelled ? "guest" : null,
      cancelReason: cancelled ? "Plans changed (sample)" : null,
      paymentRef: `sim_sample_${i + 1}`,
      createdAt: created,
      cancelledAt: cancelled ? created : null,
    });
    if (cancelled) store.bookings[store.bookings.length - 1].refundCents = store.bookings[store.bookings.length - 1].totalCents;
  }

  const reports: [ReportReason, string][] = [
    ["inaccurate", "The photos show a hot tub, but the host says it’s been removed. (sample)"],
    ["scam", "Host asked me to pay outside the app by bank transfer. (sample)"],
    ["unsafe", "No smoke detector in the loft bedroom. (sample)"],
  ];
  reports.forEach(([reason, details], i) => {
    store.reports.push({
      id: `sample_rpt_${i + 1}`,
      email: emails[i + 1],
      stayId: stays[i * 5 + 3].id,
      reason,
      details,
      status: "open",
      resolution: null,
      createdAt: daysAgo(i + 1),
      closedAt: null,
    });
  });
}

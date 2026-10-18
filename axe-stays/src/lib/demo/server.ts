import { guestRefund, quote, quoteProblems, todayIso, type QuoteInput } from "@/lib/booking/pricing";
import { brand } from "@/brand";
import type { Catalog } from "@/lib/db/catalog";
import { REPORT_REASONS } from "@/lib/report-reasons";
import { filtersFromParams } from "@/lib/search/filters";
import { HttpError } from "@/lib/server/http";
import { buildMeta } from "@/lib/server/meta";
import { searchStays } from "@/lib/server/stay-search";
import { detailsView, homeView, policyView, searchView, sizedImage } from "@/lib/server/stay-views";

import seed from "../../../data/seed.json";

// The browser demo (EXPO_PUBLIC_DEMO=1): the guest app's API routes, answered
// in the page with the same search, views, pricing and refund code the server
// uses. Sign-in takes any email; bookings and reports are kept in this
// browser's localStorage (memory if it's blocked). The admin dashboard is a
// separate server app and isn't part of the demo. Photos ship next to the
// page under photos/.

const STORE_KEY = `${brand.slug}.demo.v2`;

declare global {
  // Set by the demo page before the app loads: the URL its files live under.
  var __ROAM_BASE__: string | undefined;
}

type DemoBooking = ReturnType<typeof quote> & {
  id: string;
  stayId: string;
  email: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  pets: number;
  status: "confirmed" | "cancelled";
  refundCents: number;
  cancelledBy: "guest" | null;
  cancelReason: null;
  paymentRef: string;
  createdAt: string;
  cancelledAt: string | null;
};
type Store = { bookings: DemoBooking[]; reports: { email: string; stayId: string }[]; users: Record<string, string> };

const base = () => globalThis.__ROAM_BASE__ ?? "/";

// "https://cdn.sanity.io/images/<project>/<dataset>/<file>.jpg" → "<base>photos/<file>.jpg"
const localPhoto = (url: string | undefined) => {
  const file = url?.match(/^https:\/\/cdn\.sanity\.io\/images\/[^/]+\/[^/]+\/([^/?]+)$/)?.[1];
  return file ? `${base()}photos/${file.replace(/\.\w+$/, ".jpg")}` : url;
};

let catalog: Catalog | undefined;
function readCatalog(): Catalog {
  if (catalog) return catalog;
  const data = structuredClone(seed) as unknown as Catalog;
  for (const stay of data.stays) stay.photos = stay.photos.map((p) => ({ ...p, url: localPhoto(p.url)! }));
  for (const host of data.hosts) host.photoUrl = localPhoto(host.photoUrl ?? undefined);
  return (catalog = data);
}

let memory: Store | undefined;
function readStore(): Store {
  if (memory) return memory;
  try {
    const saved = window.localStorage.getItem(STORE_KEY);
    if (saved) return (memory = JSON.parse(saved) as Store);
  } catch {}
  return (memory = { bookings: [], reports: [], users: {} });
}
function writeStore(store: Store) {
  memory = store;
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {}
}

const json = (body: unknown, status = 200) => Response.json(body, { status });

const parseBody = (init: RequestInit) => {
  try {
    return JSON.parse(String(init.body ?? "null"));
  } catch {
    return null;
  }
};

/** The demo account behind "dev:<email>", created on first sign-in. */
function requireEmail(init: RequestInit): string {
  const token = new Headers(init.headers).get("authorization")?.match(/^Bearer dev:(.+)$/)?.[1]?.trim().toLowerCase();
  if (!token || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(token)) throw new HttpError(401, "unauthorized");
  const store = readStore();
  if (!store.users[token]) {
    store.users[token] = new Date().toISOString();
    writeStore(store);
  }
  return token;
}

const account = (email: string) => ({
  id: `demo_${email}`,
  email,
  name: email.split("@")[0],
  imageUrl: null,
  role: "guest",
  status: "active",
  banReason: null,
  createdAt: readStore().users[email],
});

const booked = (stayId: string) =>
  readStore()
    .bookings.filter((b) => b.stayId === stayId && b.status === "confirmed" && b.checkOut > todayIso())
    .map(({ checkIn, checkOut }) => ({ checkIn, checkOut }));

function summary(b: DemoBooking) {
  const stay = readCatalog().stays.find((s) => s.id === b.stayId)!;
  return {
    ...b,
    stay: {
      slug: stay.slug,
      title: stay.title,
      city: stay.city,
      region: stay.region ?? null,
      country: stay.country,
      photoUrl: sizedImage(stay.photos[0]?.url, 600, ""),
      cancellationPolicySlug: stay.cancellationPolicySlug,
      checkInTime: stay.houseRules.checkInTime,
    },
  };
}

function route(path: string, init: RequestInit): Response {
  const url = new URL(path, "https://app.demo");
  const method = (init.method ?? "GET").toUpperCase();
  const parts = url.pathname.split("/").filter(Boolean).slice(1); // after "api"
  const data = readCatalog();

  if (method === "GET" && parts[0] === "stays" && parts.length === 1) {
    const filters = filtersFromParams((name) => url.searchParams.get(name));
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 100) || 0, 100);
    const view = url.searchParams.get("view") === "home" ? homeView : searchView;
    const matched = searchStays(data, filters);
    return json({ total: matched.length, stays: matched.slice(0, limit).map((s) => view(s, "")) });
  }
  if (method === "GET" && parts[0] === "stays" && parts.length === 2) {
    const stay = data.stays.find((s) => s.slug === decodeURIComponent(parts[1]));
    if (!stay) throw new HttpError(404, "not_found");
    return json({ ...detailsView(stay, data, ""), booked: booked(stay.id) });
  }
  if (method === "GET" && parts[0] === "meta") return json(buildMeta(data));
  if (method === "GET" && parts[0] === "policies") return json(data.policies.map(policyView));

  if (method === "GET" && parts[0] === "me") return json(account(requireEmail(init)));

  if (parts[0] === "bookings" && parts.length === 1) {
    const email = requireEmail(init);
    const store = readStore();
    if (method === "GET") {
      const mine = store.bookings.filter((b) => b.email === email).sort((a, b) => b.checkIn.localeCompare(a.checkIn));
      return json({ bookings: mine.map(summary) });
    }
    if (method === "POST") {
      const body = parseBody(init) ?? {};
      const stay = data.stays.find((s) => s.slug === body.slug);
      if (!stay) throw new HttpError(404, "not_found");
      const input: QuoteInput = { checkIn: body.checkIn, checkOut: body.checkOut, guests: body.guests, pets: body.pets ?? 0 };
      const problems = quoteProblems(stay, input);
      if (problems) throw new HttpError(400, "invalid_booking", problems);
      if (booked(stay.id).some((r) => r.checkIn < input.checkOut && r.checkOut > input.checkIn)) {
        throw new HttpError(409, "dates_unavailable", { checkIn: "Those dates are already booked" });
      }
      const id = `bkg_demo${Date.now().toString(16)}`;
      const booking: DemoBooking = {
        ...quote(stay, input),
        id,
        stayId: stay.id,
        email,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        guests: input.guests,
        pets: input.pets,
        status: "confirmed",
        refundCents: 0,
        cancelledBy: null,
        cancelReason: null,
        paymentRef: `sim_${id.slice(4)}`,
        createdAt: new Date().toISOString(),
        cancelledAt: null,
      };
      store.bookings.push(booking);
      writeStore(store);
      return json(booking, 201);
    }
  }
  if (parts[0] === "bookings" && parts.length === 2) {
    const email = requireEmail(init);
    const store = readStore();
    const booking = store.bookings.find((b) => b.id === decodeURIComponent(parts[1]) && b.email === email);
    if (!booking) throw new HttpError(404, "not_found");
    const full = summary(booking);
    const refund = () => guestRefund(full, full.stay.cancellationPolicySlug, full.stay.checkInTime);
    if (method === "GET") return json({ booking: full, refund: booking.status === "confirmed" ? refund() : null });
    if (method === "DELETE") {
      if (booking.status !== "confirmed") throw new HttpError(409, "already_cancelled");
      Object.assign(booking, { status: "cancelled", refundCents: refund().refundCents, cancelledBy: "guest", cancelledAt: new Date().toISOString() });
      writeStore(store);
      return json({ booking: summary(booking) });
    }
  }
  if (method === "POST" && parts[0] === "reports") {
    const email = requireEmail(init);
    const body = parseBody(init) ?? {};
    const stay = data.stays.find((s) => s.slug === body.slug);
    if (!stay) throw new HttpError(404, "not_found");
    if (!(body.reason in REPORT_REASONS)) throw new HttpError(400, "invalid_report");
    const store = readStore();
    if (store.reports.some((r) => r.email === email && r.stayId === stay.id)) throw new HttpError(409, "already_reported");
    store.reports.push({ email, stayId: stay.id });
    writeStore(store);
    return json({ id: `rpt_demo${Date.now().toString(16)}` }, 201);
  }
  throw new HttpError(404, "not_found");
}

/** Answers one /api request the way the server would. */
export async function demoFetch(path: string, init: RequestInit = {}): Promise<Response> {
  try {
    return route(path, init);
  } catch (error) {
    if (error instanceof HttpError) {
      return json({ error: error.code, ...(error.fields ? { fields: error.fields } : {}) }, error.status);
    }
    return json({ error: "server_error" }, 500);
  }
}

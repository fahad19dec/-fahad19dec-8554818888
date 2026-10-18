import { brand } from "@/brand";
import { filtersFromParams } from "@/lib/search/filters";
import { HttpError } from "@/lib/server/http";
import { buildMeta } from "@/lib/server/meta";
import { newStayId, parseStayInput, stayFields, uniqueSlug } from "@/lib/server/stay-input";
import { searchStays } from "@/lib/server/stay-search";
import { detailsView, homeView, policyView, searchView } from "@/lib/server/stay-views";
import type { Db } from "@/lib/server/store";
import type { StayRecord } from "@/lib/stays";

import { DEMO_PASSWORD } from "./password";

import seed from "../../../data/seed.json";

// The browser demo (EXPO_PUBLIC_DEMO=1): the app's API routes, answered in the
// page with the same search, views and validation the server uses. Listings
// live in this browser's localStorage (memory if it's blocked), so admin
// changes stay on this device. Photos ship next to the page under photos/.

const DB_KEY = `${brand.slug}.demoDb.v1`;
const TOKEN = "demo-admin";

declare global {
  // Set by the demo page before the app loads: the URL its files live under.
  var __ROAM_BASE__: string | undefined;
}

const base = () => globalThis.__ROAM_BASE__ ?? "/";

// "https://cdn.sanity.io/images/<project>/<dataset>/<file>.jpg" → "<base>photos/<file>.jpg"
const localPhoto = (url: string | undefined) => {
  const file = url?.match(/^https:\/\/cdn\.sanity\.io\/images\/[^/]+\/[^/]+\/([^/?]+)$/)?.[1];
  return file ? `${base()}photos/${file.replace(/\.\w+$/, ".jpg")}` : url;
};

function seedDb(): Db {
  const db = structuredClone(seed) as unknown as Db;
  for (const stay of db.stays) stay.photos = stay.photos.map((p) => ({ ...p, url: localPhoto(p.url)! }));
  for (const host of db.hosts) host.photoUrl = localPhoto(host.photoUrl ?? undefined);
  return db;
}

let memory: Db | undefined;

function readDb(): Db {
  if (memory) return memory;
  try {
    const saved = window.localStorage.getItem(DB_KEY);
    if (saved) return (memory = JSON.parse(saved) as Db);
  } catch {}
  return (memory = seedDb());
}

function writeDb(db: Db) {
  memory = db;
  try {
    window.localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {}
}

const json = (body: unknown, status = 200) => Response.json(body, { status });

function requireAdmin(init: RequestInit) {
  const auth = new Headers(init.headers).get("authorization");
  if (auth !== `Bearer ${TOKEN}`) throw new HttpError(401, "unauthorized");
}

const body = (init: RequestInit) => {
  try {
    return JSON.parse(String(init.body ?? "null"));
  } catch {
    return null;
  }
};

function route(path: string, init: RequestInit): Response {
  const url = new URL(path, "https://app.demo");
  const method = (init.method ?? "GET").toUpperCase();
  const parts = url.pathname.split("/").filter(Boolean).slice(1); // after "api"
  const db = readDb();
  const origin = "";

  if (method === "GET" && parts[0] === "stays" && parts.length === 1) {
    const filters = filtersFromParams((name) => url.searchParams.get(name));
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 100) || 0, 100);
    const view = url.searchParams.get("view") === "home" ? homeView : searchView;
    const matched = searchStays(db, filters);
    return json({ total: matched.length, stays: matched.slice(0, limit).map((s) => view(s, origin)) });
  }
  if (method === "GET" && parts[0] === "stays" && parts.length === 2) {
    const stay = db.stays.find((s) => s.slug === decodeURIComponent(parts[1]));
    if (!stay) throw new HttpError(404, "not_found");
    return json(detailsView(stay, db, origin));
  }
  if (method === "GET" && parts[0] === "meta") return json(buildMeta(db));
  if (method === "GET" && parts[0] === "policies") {
    return json(db.policies.map(policyView));
  }

  if (parts[0] === "admin" && parts[1] === "login" && method === "POST") {
    if (body(init)?.password !== DEMO_PASSWORD) throw new HttpError(401, "wrong_password");
    return json({ token: TOKEN, expiresAt: Date.now() + 7 * 864e5 });
  }
  if (parts[0] === "admin" && parts[1] === "stays") {
    requireAdmin(init);
    const id = parts[2];
    if (!id && method === "GET") {
      return json({
        stays: [...db.stays].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        hosts: db.hosts.map(({ slug, name, isSuperhost }) => ({ slug, name, isSuperhost })),
      });
    }
    if (!id && method === "POST") {
      const input = parseStayInput(body(init));
      const now = new Date().toISOString();
      const created: StayRecord = {
        id: newStayId(),
        slug: uniqueSlug(input.title, db.stays.map((s) => s.slug)),
        ...stayFields(input, db),
        createdAt: now,
        updatedAt: now,
      };
      db.stays.push(created);
      writeDb(db);
      return json(created, 201);
    }
    const index = db.stays.findIndex((s) => s.id === id);
    if (index === -1) throw new HttpError(404, "not_found");
    if (method === "GET") return json(db.stays[index]);
    if (method === "PUT") {
      const input = parseStayInput(body(init));
      const { slug, createdAt, location } = db.stays[index];
      db.stays[index] = { id, slug, ...stayFields(input, db), location, createdAt, updatedAt: new Date().toISOString() };
      writeDb(db);
      return json(db.stays[index]);
    }
    if (method === "DELETE") {
      db.stays.splice(index, 1);
      writeDb(db);
      return new Response(null, { status: 204 });
    }
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

/** Puts the sample listings back. */
export function resetDemo() {
  try {
    window.localStorage.removeItem(DB_KEY);
  } catch {}
  memory = undefined;
}

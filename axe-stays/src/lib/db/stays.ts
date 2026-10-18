import { AccessError } from "./access";
import type { Catalog } from "./catalog";
import { all, get, now, run, transaction } from "./database";
import { logAction } from "./audit";
import { assertAdmin, type User } from "./users";
import type { HostRecord, PlatformPolicy, StayRecord } from "../stays";
import { newStayId, stayFields, uniqueSlug, type StayInput } from "../server/stay-input";

// Listings, hosts and policies. Guests only ever see approved stays; the
// admin dashboard sees every status. A stay's record lives as JSON in
// `stays.data`; status and review notes are columns so they can be queried.

export type ListingStatus = "pending" | "approved" | "rejected";
export const LISTING_STATUSES = ["pending", "approved", "rejected"] as const satisfies readonly ListingStatus[];

export type AdminStay = StayRecord & { status: ListingStatus; reviewNote: string | null; bookingCount: number };

type StayRow = { id: string; slug: string; status: ListingStatus; review_note: string | null; data: string; created_at: string; updated_at: string };

const toRecord = (row: StayRow): StayRecord => ({
  ...(JSON.parse(row.data) as StayRecord),
  id: row.id,
  slug: row.slug,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const hosts = () => all<{ data: string }>("SELECT data FROM hosts ORDER BY slug").map((r) => JSON.parse(r.data) as HostRecord);
const policies = () => all<{ data: string }>("SELECT data FROM policies").map((r) => JSON.parse(r.data) as PlatformPolicy);

/** What guests can see: approved stays, every host and policy. */
export function loadCatalog(): Catalog {
  const stays = all<StayRow>("SELECT * FROM stays WHERE status = 'approved'").map(toRecord);
  return { hosts: hosts(), policies: policies(), stays };
}

/** One approved stay for guests, or undefined. */
export function approvedStayBySlug(slug: string): StayRecord | undefined {
  const row = get<StayRow>("SELECT * FROM stays WHERE slug = $slug AND status = 'approved'", { slug });
  return row && toRecord(row);
}

export function approvedStayById(id: string): StayRecord | undefined {
  const row = get<StayRow>("SELECT * FROM stays WHERE id = $id AND status = 'approved'", { id });
  return row && toRecord(row);
}

// ---- Admin ----------------------------------------------------------------------

export function listStaysForAdmin(filter: { status?: ListingStatus; q?: string } = {}): AdminStay[] {
  const rows = all<StayRow & { booking_count: number }>(
    `SELECT s.*, (SELECT COUNT(*) FROM bookings b WHERE b.stay_id = s.id) AS booking_count
     FROM stays s
     WHERE ($status IS NULL OR s.status = $status)
     ORDER BY CASE s.status WHEN 'pending' THEN 0 WHEN 'rejected' THEN 2 ELSE 1 END, s.updated_at DESC`,
    { status: filter.status ?? null },
  );
  const words = (filter.q ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  return rows
    .map((row) => ({ ...toRecord(row), status: row.status, reviewNote: row.review_note, bookingCount: row.booking_count }))
    .filter((s) => {
      const text = `${s.title} ${s.city} ${s.region ?? ""} ${s.country} ${s.hostSlug}`.toLowerCase();
      return words.every((w) => text.includes(w));
    });
}

export function stayForAdmin(id: string): AdminStay | undefined {
  return listStaysForAdmin().find((s) => s.id === id);
}

export const listHosts = () => hosts();

export function statusCounts(): Record<ListingStatus, number> {
  const counts = { pending: 0, approved: 0, rejected: 0 };
  for (const row of all<{ status: ListingStatus; n: number }>("SELECT status, COUNT(*) AS n FROM stays GROUP BY status")) {
    counts[row.status] = row.n;
  }
  return counts;
}

/** Validated input → a new stay. New stays wait for approval unless `publish` is set. */
export function createStay(input: StayInput, by: User, publish: boolean): StayRecord {
  return transaction(() => {
    const actorId = assertAdmin(by).id;
    const catalog = { hosts: hosts(), policies: [], stays: [] };
    const hostCount = catalog.hosts.length;
    const fields = stayFields(input, catalog);
    saveNewHosts(catalog.hosts.slice(hostCount));
    const slugs = all<{ slug: string }>("SELECT slug FROM stays").map((r) => r.slug);
    const at = now();
    const record: StayRecord = { id: newStayId(), slug: uniqueSlug(input.title, slugs), ...fields, createdAt: at, updatedAt: at };
    run(
      "INSERT INTO stays (id, slug, status, data, created_at, updated_at) VALUES ($id, $slug, $status, $data, $at, $at)",
      { id: record.id, slug: record.slug, status: publish ? "approved" : "pending", data: JSON.stringify(record), at },
    );
    logAction(actorId, "listing.create", "stay", record.id, { title: record.title, published: publish });
    return record;
  });
}

/** Saves an edit. The slug never changes, so links keep working; map location carries over. */
export function updateStay(id: string, input: StayInput, by: User): StayRecord {
  return transaction(() => {
    const actorId = assertAdmin(by).id;
    const row = get<StayRow>("SELECT * FROM stays WHERE id = $id", { id });
    if (!row) throw new AccessError(404, "not_found");
    const current = toRecord(row);
    const catalog = { hosts: hosts(), policies: [], stays: [] };
    const hostCount = catalog.hosts.length;
    const fields = stayFields(input, catalog);
    saveNewHosts(catalog.hosts.slice(hostCount));
    const record: StayRecord = { ...fields, id, slug: current.slug, location: current.location, createdAt: current.createdAt, updatedAt: now() };
    run("UPDATE stays SET data = $data, updated_at = $at WHERE id = $id", { id, data: JSON.stringify(record), at: record.updatedAt });
    logAction(actorId, "listing.update", "stay", id, { title: record.title });
    return record;
  });
}

/** Approve (visible to guests) or reject (hidden), with an optional note for the record. */
export function setListingStatus(id: string, status: ListingStatus, note: string | null, by: User) {
  const actorId = assertAdmin(by).id;
  if (!LISTING_STATUSES.includes(status)) throw new AccessError(400, "invalid_status");
  const result = run("UPDATE stays SET status = $status, review_note = $note, updated_at = $at WHERE id = $id", {
    id,
    status,
    note,
    at: now(),
  });
  if (!result.changes) throw new AccessError(404, "not_found");
  logAction(actorId, `listing.${status === "approved" ? "approve" : status === "rejected" ? "reject" : "unpublish"}`, "stay", id, { note });
}

/** Deletes a stay that has never been booked; booked stays can only be rejected. */
export function deleteStay(id: string, by: User) {
  transaction(() => {
    const actorId = assertAdmin(by).id;
    const booked = get<{ n: number }>("SELECT COUNT(*) AS n FROM bookings WHERE stay_id = $id", { id })!.n;
    if (booked) throw new AccessError(409, "stay_has_bookings");
    run("DELETE FROM reports WHERE stay_id = $id", { id });
    if (!run("DELETE FROM stays WHERE id = $id", { id }).changes) throw new AccessError(404, "not_found");
    logAction(actorId, "listing.delete", "stay", id);
  });
}

function saveNewHosts(added: HostRecord[]) {
  for (const host of added) run("INSERT INTO hosts (slug, data) VALUES ($slug, $data)", { slug: host.slug, data: JSON.stringify(host) });
}

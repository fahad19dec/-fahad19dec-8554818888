import { AccessError } from "./access";
import { logAction } from "./audit";
import { all, get, now, run, transaction } from "./database";

// Accounts. Sign-in is Clerk's job (or dev sign-in locally); this table is
// the source of truth for what a signed-in person may do: their role and
// whether they're banned. Every protected request reads it, so a ban or a
// role change takes effect on the very next request in both apps.

export type Role = "guest" | "host" | "admin";
export const ROLES = ["guest", "host", "admin"] as const satisfies readonly Role[];
export type UserStatus = "active" | "banned";

export type User = {
  id: string;
  email: string | null;
  name: string | null;
  imageUrl: string | null;
  role: Role;
  status: UserStatus;
  banReason: string | null;
  bannedAt: string | null;
  createdAt: string;
  lastSeenAt: string | null;
};

export type AdminUser = User & { bookingCount: number; spentCents: number };

type Row = {
  id: string;
  email: string | null;
  name: string | null;
  image_url: string | null;
  role: Role;
  status: UserStatus;
  ban_reason: string | null;
  banned_at: string | null;
  created_at: string;
  last_seen_at: string | null;
};

const toUser = (r: Row): User => ({
  id: r.id,
  email: r.email,
  name: r.name,
  imageUrl: r.image_url,
  role: r.role,
  status: r.status,
  banReason: r.ban_reason,
  bannedAt: r.banned_at,
  createdAt: r.created_at,
  lastSeenAt: r.last_seen_at,
});

/** Emails that become admins the first time they sign in (ADMIN_EMAILS, comma separated). */
const bootstrapAdmins = () =>
  new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );

export const getUser = (id: string) => {
  const row = get<Row>("SELECT * FROM users WHERE id = $id", { id });
  return row && toUser(row);
};

/**
 * Creates the account on first sign-in and refreshes the profile after that.
 * Never changes role or ban status, except promoting an ADMIN_EMAILS address.
 */
export function upsertUser(profile: { id: string; email?: string | null; name?: string | null; imageUrl?: string | null }): User {
  return transaction(() => {
    const at = now();
    const email = profile.email?.trim().toLowerCase() || null;
    run(
      `INSERT INTO users (id, email, name, image_url, created_at, last_seen_at)
       VALUES ($id, $email, $name, $image, $at, $at)
       ON CONFLICT (id) DO UPDATE SET
         email = COALESCE($email, email), name = COALESCE($name, name),
         image_url = COALESCE($image, image_url), last_seen_at = $at`,
      { id: profile.id, email, name: profile.name ?? null, image: profile.imageUrl ?? null, at },
    );
    const user = getUser(profile.id)!;
    if (email && user.role !== "admin" && bootstrapAdmins().has(email)) {
      run("UPDATE users SET role = 'admin' WHERE id = $id", { id: user.id });
      logAction(null, "user.promote_bootstrap", "user", user.id, { email });
      return { ...user, role: "admin" };
    }
    return user;
  });
}

/** Throws unless the user exists, isn't banned, and has one of `roles`. */
export function assertAccess(user: User | undefined, roles: readonly Role[] = ROLES): User {
  if (!user) throw new AccessError(401, "unauthorized");
  if (user.status === "banned") throw new AccessError(403, "account_suspended");
  if (!roles.includes(user.role)) throw new AccessError(403, "forbidden");
  return user;
}

/**
 * For every admin change: re-reads the actor from the database, so a role or
 * ban made a moment ago (in either app) applies, and a caller can't pass in a
 * role it doesn't have.
 */
export function assertAdmin(actor: Pick<User, "id">): User {
  return assertAccess(getUser(actor.id), ["admin"]);
}

export function listUsers(filter: { q?: string; role?: Role; status?: UserStatus } = {}): AdminUser[] {
  const q = filter.q?.trim().toLowerCase();
  return all<Row & { booking_count: number; spent_cents: number }>(
    `SELECT u.*,
       (SELECT COUNT(*) FROM bookings b WHERE b.user_id = u.id) AS booking_count,
       (SELECT COALESCE(SUM(b.total_cents - b.refund_cents), 0) FROM bookings b WHERE b.user_id = u.id) AS spent_cents
     FROM users u
     WHERE ($role IS NULL OR u.role = $role) AND ($status IS NULL OR u.status = $status)
       AND ($q IS NULL OR LOWER(COALESCE(u.email, '') || ' ' || COALESCE(u.name, '')) LIKE '%' || $q || '%')
     ORDER BY u.created_at DESC`,
    { role: filter.role ?? null, status: filter.status ?? null, q: q || null },
  ).map((r) => ({ ...toUser(r), bookingCount: r.booking_count, spentCents: r.spent_cents }));
}

const adminCount = () => get<{ n: number }>("SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND status = 'active'")!.n;

export function banUser(id: string, reason: string, by: User) {
  transaction(() => {
    const actor = assertAdmin(by);
    const target = getUser(id);
    if (!target) throw new AccessError(404, "not_found");
    if (target.id === actor.id) throw new AccessError(409, "cannot_ban_self");
    if (target.role === "admin" && adminCount() <= 1) throw new AccessError(409, "last_admin");
    run("UPDATE users SET status = 'banned', ban_reason = $reason, banned_at = $at WHERE id = $id", {
      id,
      reason: reason || null,
      at: now(),
    });
    logAction(actor.id, "user.ban", "user", id, { reason });
  });
}

export function unbanUser(id: string, by: User) {
  const actor = assertAdmin(by);
  if (!run("UPDATE users SET status = 'active', ban_reason = NULL, banned_at = NULL WHERE id = $id", { id }).changes) {
    throw new AccessError(404, "not_found");
  }
  logAction(actor.id, "user.unban", "user", id);
}

export function setRole(id: string, role: Role, by: User) {
  if (!ROLES.includes(role)) throw new AccessError(400, "invalid_role");
  transaction(() => {
    const actor = assertAdmin(by);
    const target = getUser(id);
    if (!target) throw new AccessError(404, "not_found");
    if (target.id === actor.id && role !== "admin") throw new AccessError(409, "cannot_demote_self");
    if (target.role === "admin" && role !== "admin" && adminCount() <= 1) throw new AccessError(409, "last_admin");
    run("UPDATE users SET role = $role WHERE id = $id", { id, role });
    logAction(actor.id, "user.role", "user", id, { from: target.role, to: role });
  });
}

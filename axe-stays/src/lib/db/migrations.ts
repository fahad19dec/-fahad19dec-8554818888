import type { DatabaseSync } from "node:sqlite";

// Schema changes, applied in order. PRAGMA user_version records how many
// have run. Never edit a shipped migration; add a new one.
const migrations: string[] = [
  /* 1: catalog, accounts, bookings, reports, audit log */ `
  CREATE TABLE hosts (
    slug TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
  CREATE TABLE policies (
    slug TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
  CREATE TABLE stays (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    review_note TEXT,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX stays_status ON stays (status);

  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT,
    name TEXT,
    image_url TEXT,
    role TEXT NOT NULL DEFAULT 'guest' CHECK (role IN ('guest', 'host', 'admin')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'banned')),
    ban_reason TEXT,
    banned_at TEXT,
    created_at TEXT NOT NULL,
    last_seen_at TEXT
  );
  CREATE INDEX users_created ON users (created_at);

  CREATE TABLE bookings (
    id TEXT PRIMARY KEY,
    stay_id TEXT NOT NULL REFERENCES stays (id),
    user_id TEXT NOT NULL REFERENCES users (id),
    check_in TEXT NOT NULL,
    check_out TEXT NOT NULL,
    guests INTEGER NOT NULL,
    pets INTEGER NOT NULL DEFAULT 0,
    nights INTEGER NOT NULL,
    nightly_total_cents INTEGER NOT NULL,
    discount_cents INTEGER NOT NULL,
    cleaning_cents INTEGER NOT NULL,
    pet_fee_cents INTEGER NOT NULL,
    service_fee_cents INTEGER NOT NULL,
    total_cents INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('confirmed', 'cancelled')),
    refund_cents INTEGER NOT NULL DEFAULT 0,
    refund_service_cents INTEGER NOT NULL DEFAULT 0,
    cancelled_by TEXT,
    cancel_reason TEXT,
    payment_ref TEXT NOT NULL,
    created_at TEXT NOT NULL,
    cancelled_at TEXT
  );
  CREATE INDEX bookings_stay_dates ON bookings (stay_id, check_in, check_out);
  CREATE INDEX bookings_user ON bookings (user_id, created_at);
  CREATE INDEX bookings_created ON bookings (created_at);

  CREATE TABLE reports (
    id TEXT PRIMARY KEY,
    reporter_id TEXT NOT NULL REFERENCES users (id),
    stay_id TEXT REFERENCES stays (id),
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
    resolution TEXT,
    resolved_by TEXT,
    created_at TEXT NOT NULL,
    resolved_at TEXT
  );
  CREATE INDEX reports_status ON reports (status, created_at);

  CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_id TEXT,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    details TEXT,
    created_at TEXT NOT NULL
  );
  `,
];

export function migrate(conn: DatabaseSync) {
  const { user_version: version } = conn.prepare("PRAGMA user_version").get() as { user_version: number };
  for (let i = version; i < migrations.length; i++) {
    conn.exec("BEGIN IMMEDIATE");
    try {
      // Another process may have migrated while this one waited for the lock.
      const current = (conn.prepare("PRAGMA user_version").get() as { user_version: number }).user_version;
      if (current > i) {
        conn.exec("COMMIT");
        continue;
      }
      conn.exec(migrations[i]);
      conn.exec(`PRAGMA user_version = ${i + 1}`);
      conn.exec("COMMIT");
    } catch (error) {
      conn.exec("ROLLBACK");
      throw error;
    }
  }
}

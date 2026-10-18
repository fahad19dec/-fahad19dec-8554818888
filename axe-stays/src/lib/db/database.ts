import type { DatabaseSync, SQLInputValue } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

import { migrate } from "./migrations";
import { seedIfEmpty } from "./seed";

// Server only. The one database both apps share: the guest app's API routes
// (axe-stays/src/app/api) and the admin dashboard (admin/). It's a SQLite
// file at DATA_DIR/axe-stays.sqlite, opened with Node's built-in node:sqlite
// (Node 22.13+). WAL mode and a busy timeout let the two server processes
// read and write the same file safely.
//
// This module imports only relative paths and Node built-ins, so the admin
// app can import it from outside its own folder.

export type Db = DatabaseSync;
export type Params = Record<string, SQLInputValue>;

const FILE = "axe-stays.sqlite";

/** Where the database and uploaded photos live. Both apps must point at the same folder. */
export const dataDir = () => path.resolve(process.env.DATA_DIR ?? path.join(process.cwd(), "data"));

// The dev server re-evaluates modules per request; keep one connection per process.
const cache = globalThis as typeof globalThis & { __axeDb?: { file: string; db: DatabaseSync } };

export function db(): DatabaseSync {
  const file = path.join(dataDir(), FILE);
  if (cache.__axeDb?.file === file) return cache.__axeDb.db;

  // Loaded at runtime, so bundlers (Metro, Turbopack) never try to resolve it.
  // Node flags node:sqlite as experimental on first load; that one notice is
  // dropped so dev tools don't surface it as an error on every page.
  const emit = process.emitWarning;
  process.emitWarning = ((warning: string | Error, ...rest: never[]) => {
    if (!String(warning).includes("SQLite is an experimental feature")) emit.call(process, warning, ...rest);
  }) as typeof process.emitWarning;
  const { DatabaseSync } = process.getBuiltinModule("node:sqlite");
  process.emitWarning = emit;
  mkdirSync(path.dirname(file), { recursive: true });
  const conn = new DatabaseSync(file);
  conn.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;");
  migrate(conn);
  seedIfEmpty(conn, dataDir());
  cache.__axeDb = { file, db: conn };
  return conn;
}

/** Runs `work` in one write transaction: all of it lands, or none of it. */
export function transaction<T>(work: (conn: DatabaseSync) => T): T {
  const conn = db();
  conn.exec("BEGIN IMMEDIATE");
  try {
    const result = work(conn);
    conn.exec("COMMIT");
    return result;
  } catch (error) {
    conn.exec("ROLLBACK");
    throw error;
  }
}

export const all = <T>(sql: string, params: Params = {}) => db().prepare(sql).all(params) as T[];
export const get = <T>(sql: string, params: Params = {}) => db().prepare(sql).get(params) as T | undefined;
export const run = (sql: string, params: Params = {}) => db().prepare(sql).run(params);

/** A random id with a readable prefix: `bkg_3f9a…`. Web Crypto, so it works everywhere. */
export const newId = (prefix: string) =>
  `${prefix}_${Array.from(globalThis.crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, "0")).join("")}`;

export const now = () => new Date().toISOString();

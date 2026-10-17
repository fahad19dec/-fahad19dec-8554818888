import { randomBytes } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import type { HostRecord, RoamPolicy, StayRecord } from "@/lib/stays";

import seed from "../../../data/seed.json";

// Server only. The listings database: one JSON file, `data/db.json`, created
// from `data/seed.json` (Roam's 30 sample stays) the first time it's read.
// Delete db.json to start over from the seed. `DATA_DIR` moves both db.json
// and uploaded photos, e.g. onto a persistent volume in production.
//
// The file is read on every request: the dev server re-evaluates API route
// modules per request, and two server processes may share one file. Writes go
// through one queue (on globalThis, so it survives re-evaluation) and replace
// the file atomically, so readers never see half a write.

export type Db = { hosts: HostRecord[]; policies: RoamPolicy[]; stays: StayRecord[] };

export const dataDir = () => path.resolve(process.env.DATA_DIR ?? path.join(process.cwd(), "data"));
const dbFile = () => path.join(dataDir(), "db.json");

const queue = globalThis as typeof globalThis & { __roamWrites?: Promise<unknown> };

export async function readDb(): Promise<Db> {
  try {
    return JSON.parse(await readFile(dbFile(), "utf8")) as Db;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return structuredClone(seed) as unknown as Db;
  }
}

async function writeDb(db: Db) {
  await mkdir(dataDir(), { recursive: true });
  const temp = `${dbFile()}.${randomBytes(4).toString("hex")}.tmp`;
  await writeFile(temp, JSON.stringify(db, null, 2));
  await rename(temp, dbFile());
}

/** Runs `change` on the latest database and saves what it returns, one change at a time. */
export function updateDb<T>(change: (db: Db) => T | Promise<T>): Promise<T> {
  const run = (queue.__roamWrites ?? Promise.resolve()).then(async () => {
    const db = await readDb();
    const result = await change(db);
    await writeDb(db);
    return result;
  });
  // A failed write must not block the next one.
  queue.__roamWrites = run.catch(() => {});
  return run;
}


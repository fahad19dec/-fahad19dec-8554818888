// The shared data layer. Both the guest app's API routes and the admin
// dashboard import from here, so every change lands in the same database.
export { AccessError } from "./access";
export { dataDir, db } from "./database";
export * from "./analytics";
export * from "./audit";
export * from "./bookings";
export * from "./reports";
export * from "./stays";
export * from "./users";
export type { Catalog } from "./catalog";

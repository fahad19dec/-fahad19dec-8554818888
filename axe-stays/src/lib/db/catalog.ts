import type { HostRecord, PlatformPolicy, StayRecord } from "../stays";

/** Hosts, policies and stays loaded for one request (search, views, validation). */
export type Catalog = { hosts: HostRecord[]; policies: PlatformPolicy[]; stays: StayRecord[] };

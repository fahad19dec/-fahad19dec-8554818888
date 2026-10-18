import { useEffect, useSyncExternalStore } from "react";

import { api, ApiError, staysChanged } from "@/lib/api";
import type { StayRecord } from "@/lib/stays";

import { clearToken, readToken, saveToken } from "./admin-token";

// The admin session, shared by every admin screen: `undefined` while the
// saved token is read, `null` when signed out. A 401 from any admin call signs
// the admin out, so an expired token lands back on the sign-in form.

type Session = string | null | undefined;
let session: Session;
let loading: Promise<void> | undefined;
const listeners = new Set<() => void>();
const set = (next: Session) => {
  session = next;
  listeners.forEach((l) => l());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};

export function useAdminSession() {
  const token = useSyncExternalStore(subscribe, () => session, () => session);
  useEffect(() => {
    loading ??= readToken().then((saved) => set(saved));
  }, []);
  return token;
}

export async function signIn(password: string) {
  const { token } = await api<{ token: string }>("/api/admin/login", { method: "POST", json: { password } });
  await saveToken(token);
  set(token);
}

export async function signOut() {
  await clearToken();
  set(null);
}

/** An admin API call with the session's token. */
async function adminApi<T>(path: string, init: Parameters<typeof api>[1] = {}): Promise<T> {
  try {
    return await api<T>(path, { ...init, token: session });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) await signOut();
    throw error;
  }
}

export type AdminHost = { slug: string; name: string; isSuperhost?: boolean };

/** What the admin form sends; the server checks all of it (src/lib/server/stay-input.ts). */
export type StayInput = Omit<StayRecord, "id" | "slug" | "createdAt" | "updatedAt" | "hostSlug" | "location"> & {
  hostSlug?: string;
  newHostName?: string;
};

export const listStays = (signal?: AbortSignal) =>
  adminApi<{ stays: StayRecord[]; hosts: AdminHost[] }>("/api/admin/stays", { signal });

export const getStay = (id: string, signal?: AbortSignal) => adminApi<StayRecord>(`/api/admin/stays/${id}`, { signal });

export async function saveStay(id: string | null, input: StayInput) {
  const stay = await adminApi<StayRecord>(id ? `/api/admin/stays/${id}` : "/api/admin/stays", {
    method: id ? "PUT" : "POST",
    json: input,
  });
  staysChanged();
  return stay;
}

export async function deleteStay(id: string) {
  await adminApi<void>(`/api/admin/stays/${id}`, { method: "DELETE" });
  staysChanged();
}

/** Uploads one image file and returns its URL for a stay's photos. */
export const uploadPhoto = (file: Blob) =>
  adminApi<{ url: string }>("/api/admin/uploads", {
    method: "POST",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });

/** Admin error copy, by cause. */
export function adminErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) return "Something went wrong. Try again.";
  switch (error.code) {
    case "network_error":
      return "Can’t reach the server. Check your connection.";
    case "wrong_password":
      return "That password isn’t right.";
    case "admin_not_configured":
      return "Admin isn’t set up yet: set ADMIN_PASSWORD (8+ characters) in .env.local and restart the server.";
    case "invalid_stay":
      return "Some fields need fixing. They’re marked below.";
    case "not_found":
      return "That listing no longer exists.";
    case "too_large":
      return "That photo is over 8 MB.";
    case "not_an_image":
      return "Use a JPEG, PNG, WebP or GIF photo.";
    case "unauthorized":
      return "Your admin session ended. Sign in again.";
    default:
      return "Something went wrong. Try again.";
  }
}

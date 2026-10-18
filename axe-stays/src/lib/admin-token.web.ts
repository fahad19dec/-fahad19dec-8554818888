import { brand } from "@/brand";

// Web keeps the admin's sign-in token in localStorage. It can be blocked
// (private windows), in which case the admin signs in again next visit.
const KEY = `${brand.slug}.adminToken`;

export async function readToken() {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export async function saveToken(token: string) {
  try {
    window.localStorage.setItem(KEY, token);
  } catch {}
}

export async function clearToken() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {}
}

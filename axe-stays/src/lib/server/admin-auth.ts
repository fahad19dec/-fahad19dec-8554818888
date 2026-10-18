import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import { HttpError } from "./http";

// Server only. The admin signs in with ADMIN_PASSWORD (server env, never
// EXPO_PUBLIC_) and gets a signed token that expires after a week. The signing
// key comes from the password, so changing it signs every admin out.

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_PASSWORD = 8;

function password() {
  const value = process.env.ADMIN_PASSWORD;
  if (!value || value.length < MIN_PASSWORD) throw new HttpError(503, "admin_not_configured");
  return value;
}

const key = () => createHash("sha256").update(`admin-token:${password()}`).digest();
const sign = (payload: string) => createHmac("sha256", key()).update(payload).digest("base64url");

const same = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Checks the password and returns a token, or throws 401 after a short delay. */
export async function login(attempt: unknown): Promise<{ token: string; expiresAt: number }> {
  const expected = password();
  if (typeof attempt !== "string" || !same(createHash("sha256").update(attempt).digest("hex"), createHash("sha256").update(expected).digest("hex"))) {
    // Slows down guessing.
    await pause(600);
    throw new HttpError(401, "wrong_password");
  }
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ exp: expiresAt })).toString("base64url");
  return { token: `${payload}.${sign(payload)}`, expiresAt };
}

/** Every admin API route calls this before doing any work. */
export function requireAdmin(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  const [payload, signature] = token?.split(".") ?? [];
  if (!payload || !signature || !same(signature, sign(payload))) throw new HttpError(401, "unauthorized");
  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { exp: number };
    if (typeof exp !== "number" || exp < Date.now()) throw new Error("expired");
  } catch {
    throw new HttpError(401, "unauthorized");
  }
}

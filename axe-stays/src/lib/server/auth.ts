import { createClerkClient, verifyToken } from "@clerk/backend";

import { AccessError, assertAccess, getUser, upsertUser, type Role, type User } from "../db";

// Server only. Who is calling, from the bearer token the app sends:
// - Clerk (CLERK_SECRET_KEY set): a Clerk session token. The first request
//   from a new account fetches its email and name from Clerk and creates the
//   user row; later requests reuse the row.
// - Dev sign-in (AUTH_MODE=dev, never in production): "dev:<email>", so the
//   app can be run and tested without a Clerk account.
// Roles and bans always come from the database, so they apply immediately.

const clerkSecret = () => process.env.CLERK_SECRET_KEY;

export const devAuthEnabled = () => process.env.AUTH_MODE === "dev" && process.env.NODE_ENV !== "production";

const devUserId = (email: string) => `dev_${email.replace(/[^a-z0-9]/g, "_")}`;

async function resolveUser(token: string): Promise<User | undefined> {
  const secretKey = clerkSecret();
  if (secretKey) {
    let userId: string;
    try {
      const payload = await verifyToken(token, { secretKey });
      if (!payload.sub) return undefined;
      userId = payload.sub;
    } catch {
      return undefined;
    }
    const known = getUser(userId);
    if (known?.email) return upsertUser({ id: userId });
    const profile = await createClerkClient({ secretKey }).users.getUser(userId);
    return upsertUser({
      id: userId,
      email: profile.primaryEmailAddress?.emailAddress ?? null,
      name: profile.fullName || profile.firstName || null,
      imageUrl: profile.hasImage ? profile.imageUrl : null,
    });
  }
  if (devAuthEnabled() && token.startsWith("dev:")) {
    const email = token.slice(4).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return undefined;
    return upsertUser({ id: devUserId(email), email, name: email.split("@")[0] });
  }
  return undefined;
}

/** The signed-in user, or undefined for guests browsing without an account. Banned users still resolve. */
export async function currentUser(request: Request): Promise<User | undefined> {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  return token ? resolveUser(token) : undefined;
}

/** Every protected route calls this first: signed in, not banned, and one of `roles`. */
export async function requireUser(request: Request, roles?: readonly Role[]): Promise<User> {
  if (!clerkSecret() && !devAuthEnabled()) throw new AccessError(503, "auth_not_configured");
  return assertAccess(await currentUser(request), roles);
}

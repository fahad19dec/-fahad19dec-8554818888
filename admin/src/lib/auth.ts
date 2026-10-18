import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { AccessError, assertAccess, getUser, upsertUser, type User } from "@core/db";

// Who's using the dashboard, checked on the server for every page and every
// action. The browser never decides: the role and ban status come from the
// shared database on each request, so a demotion or ban in either app applies
// at once.
// - Clerk (CLERK_SECRET_KEY set): the Clerk session; the account is created
//   or refreshed from Clerk's profile.
// - Dev sign-in (AUTH_MODE=dev, never in production): an httpOnly cookie
//   holding the email typed on /login.

export const clerkEnabled = () => !!process.env.CLERK_SECRET_KEY && !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
export const devAuthEnabled = () => !clerkEnabled() && process.env.AUTH_MODE === "dev" && process.env.NODE_ENV !== "production";

export const DEV_COOKIE = "axe_admin_dev_email";
const devUserId = (email: string) => `dev_${email.replace(/[^a-z0-9]/g, "_")}`;

/** The signed-in person as the database sees them, or undefined. Not yet checked for admin. */
export async function signedInUser(): Promise<User | undefined> {
  if (clerkEnabled()) {
    const { userId } = await auth();
    if (!userId) return undefined;
    const known = getUser(userId);
    if (known?.email) return upsertUser({ id: userId });
    const profile = await currentUser();
    return upsertUser({
      id: userId,
      email: profile?.primaryEmailAddress?.emailAddress ?? null,
      name: profile?.fullName || profile?.firstName || null,
      imageUrl: profile?.hasImage ? profile.imageUrl : null,
    });
  }
  if (devAuthEnabled()) {
    const email = (await cookies()).get(DEV_COOKIE)?.value;
    if (!email) return undefined;
    return upsertUser({ id: devUserId(email), email, name: email.split("@")[0] });
  }
  return undefined;
}

/** For server actions: the admin, or an AccessError (401/403) that the action reports. */
export async function requireAdmin(): Promise<User> {
  return assertAccess(await signedInUser(), ["admin"]);
}

export type PageAccess = { admin: User } | { denied: "forbidden" | "account_suspended"; user: User };

/**
 * For pages: signed-out visitors go to /login; signed-in people who aren't
 * admins (or are banned) get a "no access" page instead of the dashboard.
 */
export async function adminPageAccess(): Promise<PageAccess> {
  const user = await signedInUser();
  if (!user) redirect("/login");
  try {
    return { admin: assertAccess(user, ["admin"]) };
  } catch (error) {
    if (error instanceof AccessError && (error.code === "forbidden" || error.code === "account_suspended")) {
      return { denied: error.code, user };
    }
    throw error;
  }
}

/**
 * For page components, which render alongside the layout's check: the admin,
 * or a redirect to /login when signed out. Signed-in non-admins get the
 * layout's "No access" screen (notFound keeps the page out of it).
 */
export async function pageAdmin(): Promise<User> {
  const access = await adminPageAccess();
  if ("denied" in access) notFound();
  return access.admin;
}

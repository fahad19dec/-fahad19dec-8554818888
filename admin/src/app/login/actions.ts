"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DEV_COOKIE, devAuthEnabled } from "@/lib/auth";

export type LoginState = { error?: string };

// Dev sign-in only: remembers the email in an httpOnly cookie. Whether that
// person is an admin is decided by the database on every request, not here.
export async function devSignIn(_prev: LoginState, form: FormData): Promise<LoginState> {
  if (!devAuthEnabled()) return { error: "Dev sign-in is off. Set AUTH_MODE=dev, or add Clerk keys." };
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  (await cookies()).set(DEV_COOKIE, email, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  redirect("/");
}

export async function devSignOut() {
  (await cookies()).delete(DEV_COOKIE);
  redirect("/login");
}

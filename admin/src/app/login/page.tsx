import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { brand } from "@brand";
import { LogoMark } from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clerkEnabled, devAuthEnabled, signedInUser } from "@/lib/auth";

import { DevLoginForm } from "./dev-login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await signedInUser()) redirect("/");
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="grid w-full max-w-sm gap-6">
        <div className="flex items-center justify-center gap-2">
          <LogoMark size={36} />
          <span className="text-xl font-bold tracking-tight">{brand.name} Admin</span>
        </div>
        {clerkEnabled() ? (
          <div className="flex justify-center">
            <SignIn routing="hash" forceRedirectUrl="/" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Sign in</CardTitle>
              <CardDescription>
                {devAuthEnabled()
                  ? "Development sign-in: any email, no password. Only accounts with the admin role get in."
                  : "Sign-in isn’t set up. Add Clerk keys to .env.local, or set AUTH_MODE=dev for local testing."}
              </CardDescription>
            </CardHeader>
            {devAuthEnabled() && (
              <CardContent>
                <DevLoginForm />
              </CardContent>
            )}
          </Card>
        )}
        <p className="text-center text-xs text-muted-foreground">Only accounts with the admin role can use this dashboard.</p>
      </div>
    </main>
  );
}

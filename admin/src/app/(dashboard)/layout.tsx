import { ShieldX } from "lucide-react";

import { brand } from "@brand";
import { openReportCount, statusCounts } from "@core/db";
import { LogoMark } from "@/components/logo";
import { Nav } from "@/components/dashboard/nav";
import { SignOut } from "@/components/dashboard/sign-out";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { adminPageAccess } from "@/lib/auth";

// Every dashboard page sits inside this check: signed out goes to /login,
// signed in without the admin role (or banned) sees "no access". Each page
// and action checks again on its own, so nothing relies on this layout alone.
export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const access = await adminPageAccess();
  if ("denied" in access) {
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <ShieldX className="mb-2 size-8 text-destructive" aria-hidden />
            <CardTitle>No access</CardTitle>
            <CardDescription>
              {access.denied === "account_suspended"
                ? "This account is suspended."
                : `${access.user.email ?? "This account"} isn’t an admin. Ask an admin to change your role, or sign in with another account.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignOut />
          </CardContent>
        </Card>
      </main>
    );
  }

  const { admin } = access;
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-6 bg-sidebar px-3 py-4 text-sidebar-foreground md:sticky md:top-0 md:h-screen md:w-60">
        <div className="flex items-center gap-2 px-2">
          <LogoMark size={30} onDark />
          <div className="leading-tight">
            <p className="font-bold">{brand.name}</p>
            <p className="text-xs text-sidebar-foreground/60">Admin</p>
          </div>
        </div>
        <Nav counts={{ pending: statusCounts().pending, reports: openReportCount() }} />
        <div className="mt-auto grid gap-2 border-t border-sidebar-border pt-3">
          <div className="px-3 text-xs text-sidebar-foreground/60">
            <p className="truncate font-medium text-sidebar-foreground">{admin.name ?? admin.email}</p>
            <p className="truncate">{admin.email}</p>
          </div>
          <SignOut />
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}

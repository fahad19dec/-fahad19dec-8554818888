import { SignOutButton } from "@clerk/nextjs";
import { LogOut } from "lucide-react";

import { devSignOut } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { clerkEnabled } from "@/lib/auth";

export function SignOut() {
  const button = (
    <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground" type="submit">
      <LogOut aria-hidden /> Sign out
    </Button>
  );
  if (clerkEnabled()) return <SignOutButton redirectUrl="/login">{button}</SignOutButton>;
  return <form action={devSignOut}>{button}</form>;
}

"use client";

import { Ban, MoreHorizontal, ShieldCheck, Undo2, UserRound } from "lucide-react";
import { useState } from "react";

import type { Role } from "@core/db/users";
import { useAdminAction } from "@/components/dashboard/use-action";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { banUserAction, setRoleAction, unbanUserAction } from "../actions";

const roleLabels: Record<Role, string> = { guest: "Guest", host: "Host", admin: "Admin" };

// Ban / unban and role changes for one user. The server refuses banning
// yourself, demoting yourself, and removing the last admin.
export function UserActions({ id, email, role, banned, isSelf }: { id: string; email: string; role: Role; banned: boolean; isSelf: boolean }) {
  const { pending, run } = useAdminAction();
  const [banning, setBanning] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <div className="flex items-center justify-end gap-1">
      {banned ? (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => unbanUserAction(id))}>
          <Undo2 /> Unban
        </Button>
      ) : (
        <Button size="sm" variant="outline" disabled={pending || isSelf} onClick={() => setBanning(true)}>
          <Ban /> Ban
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button size="icon-sm" variant="ghost" aria-label={`Change role for ${email}`} />}>
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Role</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(["guest", "host", "admin"] as const).map((r) => (
              <DropdownMenuItem key={r} disabled={r === role || pending} onClick={() => run(() => setRoleAction(id, r))}>
                {r === "admin" ? <ShieldCheck /> : <UserRound />} {roleLabels[r]}
                {r === role && <span className="ml-auto text-xs text-muted-foreground">current</span>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={banning} onOpenChange={setBanning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban {email}?</DialogTitle>
            <DialogDescription>
              They can still browse, but can’t book, cancel or report, and the app tells them their account is suspended. Their existing bookings aren’t cancelled.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor={`reason-${id}`}>Reason</Label>
            <Textarea id={`reason-${id}`} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Repeated payment requests outside the app" />
            <p className="text-xs text-muted-foreground">Shown to the user in the app.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanning(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={async () => {
                if (await run(() => banUserAction(id, reason))) setBanning(false);
              }}
            >
              Ban user
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

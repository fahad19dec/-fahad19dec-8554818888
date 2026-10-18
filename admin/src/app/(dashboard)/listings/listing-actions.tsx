"use client";

import { Check, MoreHorizontal, Pencil, Trash2, Undo2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ListingStatus } from "@core/db/stays";
import { useAdminAction } from "@/components/dashboard/use-action";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { deleteListingAction, setListingStatusAction } from "../actions";

// Approve / reject / edit / delete for one listing row. Reject asks for a
// note (kept on the listing and in the activity log); delete confirms first.
export function ListingActions({ id, title, status, bookingCount }: { id: string; title: string; status: ListingStatus; bookingCount: number }) {
  const router = useRouter();
  const { pending, run } = useAdminAction();
  const [dialog, setDialog] = useState<"reject" | "delete" | null>(null);
  const [note, setNote] = useState("");

  return (
    <div className="flex items-center justify-end gap-1">
      {status !== "approved" && (
        <Button size="sm" disabled={pending} onClick={() => run(() => setListingStatusAction(id, "approved"))}>
          <Check /> Approve
        </Button>
      )}
      {status === "pending" && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => setDialog("reject")}>
          <X /> Reject
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button size="icon-sm" variant="ghost" aria-label={`More actions for ${title}`} />}>
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/listings/${id}`)}>
            <Pencil /> Edit
          </DropdownMenuItem>
          {status === "approved" && (
            <DropdownMenuItem onClick={() => setDialog("reject")}>
              <X /> Reject (hide from guests)
            </DropdownMenuItem>
          )}
          {status === "rejected" && (
            <DropdownMenuItem onClick={() => run(() => setListingStatusAction(id, "pending"))}>
              <Undo2 /> Move back to review
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" disabled={bookingCount > 0} onClick={() => setDialog("delete")}>
            <Trash2 /> {bookingCount > 0 ? "Can’t delete (has bookings)" : "Delete"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialog === "reject"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject “{title}”?</DialogTitle>
            <DialogDescription>It’s hidden from guests right away. Existing bookings stay as they are.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor={`note-${id}`}>Reason (optional)</Label>
            <Textarea id={`note-${id}`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Photos don’t match the description" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Keep it
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={async () => {
                if (await run(() => setListingStatusAction(id, "rejected", note))) setDialog(null);
              }}
            >
              Reject listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "delete"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete “{title}”?</DialogTitle>
            <DialogDescription>This can’t be undone. Reports about it are deleted too.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Keep it
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={async () => {
                if (await run(() => deleteListingAction(id))) setDialog(null);
              }}
            >
              Delete listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

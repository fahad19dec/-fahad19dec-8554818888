"use client";

import { useState } from "react";

import { formatCents } from "@core/booking/pricing";
import { useAdminAction } from "@/components/dashboard/use-action";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { cancelBookingAction, refundPreviewAction } from "../actions";

type Preview = { full: number; policy: number; rule: string };

// Cancel a booking for the guest. The dialog shows both refund choices,
// computed by the server, before anything changes.
export function CancelBooking({ id, guest }: { id: string; guest: string }) {
  const { pending, run } = useAdminAction();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Preview | { error: string } | null>(null);
  const [mode, setMode] = useState<"full" | "policy">("full");
  const [reason, setReason] = useState("");

  const show = async () => {
    setOpen(true);
    setPreview(null);
    setPreview(await refundPreviewAction(id));
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={show}>
        Cancel
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel booking {id}?</DialogTitle>
            <DialogDescription>{guest} sees it as cancelled by us in their Trips, with the refund below.</DialogDescription>
          </DialogHeader>
          {!preview ? (
            <p className="text-sm text-muted-foreground">Working out the refund…</p>
          ) : "error" in preview ? (
            <p className="text-sm text-destructive">{preview.error}</p>
          ) : (
            <fieldset className="grid gap-2">
              <legend className="mb-1 text-sm font-medium">Refund</legend>
              <label className="flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm has-checked:border-primary has-checked:bg-accent">
                <input type="radio" name={`mode-${id}`} className="mt-0.5 accent-primary" checked={mode === "full"} onChange={() => setMode("full")} />
                <span>
                  <span className="font-medium">Full refund: {formatCents(preview.full)}</span>
                  <span className="block text-muted-foreground">Use when the problem is on our side or the host’s.</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm has-checked:border-primary has-checked:bg-accent">
                <input type="radio" name={`mode-${id}`} className="mt-0.5 accent-primary" checked={mode === "policy"} onChange={() => setMode("policy")} />
                <span>
                  <span className="font-medium">Cancellation policy: {formatCents(preview.policy)}</span>
                  <span className="block text-muted-foreground">{preview.rule}, as if the guest cancelled now.</span>
                </span>
              </label>
            </fieldset>
          )}
          <div className="grid gap-2">
            <Label htmlFor={`cancel-reason-${id}`}>Reason (shown to the guest)</Label>
            <Textarea id={`cancel-reason-${id}`} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="The host can no longer offer these dates" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Keep booking
            </Button>
            <Button
              variant="destructive"
              disabled={pending || !preview || "error" in preview}
              onClick={async () => {
                if (await run(() => cancelBookingAction(id, mode, reason))) setOpen(false);
              }}
            >
              Cancel booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";

import { useState } from "react";

import { useAdminAction } from "@/components/dashboard/use-action";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { closeReportAction } from "../actions";

// Close an open report: resolve it (optionally hiding the listing in the
// same step) or dismiss it. The note is kept with the report.
export function ReportActions({ id, stay }: { id: string; stay: { id: string; status: string } | null }) {
  const { pending, run } = useAdminAction();
  const [note, setNote] = useState("");
  const close = (status: "resolved" | "dismissed", hide = false) =>
    run(() => closeReportAction(id, status, note, hide && stay ? { stayId: stay.id } : undefined));

  return (
    <div className="grid gap-2">
      <Textarea aria-label="What you did" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What you did (kept with the report)" rows={2} />
      <div className="flex flex-wrap gap-2">
        {stay && stay.status === "approved" && (
          <Button size="sm" variant="destructive" disabled={pending} onClick={() => close("resolved", true)}>
            Hide listing and resolve
          </Button>
        )}
        <Button size="sm" disabled={pending} onClick={() => close("resolved")}>
          Resolve
        </Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => close("dismissed")}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}

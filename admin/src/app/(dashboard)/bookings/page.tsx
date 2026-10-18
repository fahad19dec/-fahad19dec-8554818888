import { Search } from "lucide-react";
import type { Metadata } from "next";

import { listBookingsForAdmin, type BookingStatus } from "@core/db";
import { todayIso } from "@core/booking/pricing";
import { NativeSelect } from "@/components/form-controls";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { pageAdmin } from "@/lib/auth";
import { formatCents, formatDate, formatDateTime } from "@/lib/format";

import { CancelBooking } from "./cancel-booking";

export const metadata: Metadata = { title: "Bookings" };

// Every booking, newest first. Payments are simulated (sim_ references).
export default async function BookingsPage({ searchParams }: PageProps<"/bookings">) {
  await pageAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const status = (["confirmed", "cancelled"] as const).find((s) => s === params.status) as BookingStatus | undefined;
  const upcoming = params.when === "upcoming";
  const bookings = listBookingsForAdmin({ q, status, upcoming });
  const today = todayIso();

  return (
    <>
      <PageHeader title="Bookings" description="Cancelling here refunds the guest and frees the dates in the app right away." />
      <form className="mb-4 flex flex-wrap gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input name="q" defaultValue={q} placeholder="Booking id, guest or listing" className="pl-8" aria-label="Search bookings" />
        </div>
        <NativeSelect name="status" defaultValue={status ?? ""} className="w-40" aria-label="Status">
          <option value="">Any status</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </NativeSelect>
        <NativeSelect name="when" defaultValue={upcoming ? "upcoming" : ""} className="w-40" aria-label="When">
          <option value="">Any dates</option>
          <option value="upcoming">Upcoming and current</option>
        </NativeSelect>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking</TableHead>
              <TableHead>Guest</TableHead>
              <TableHead className="hidden md:table-cell">Dates</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No bookings match.
                </TableCell>
              </TableRow>
            )}
            {bookings.map((b) => {
              const finished = b.status === "confirmed" && b.checkOut <= today;
              return (
                <TableRow key={b.id}>
                  <TableCell>
                    <p className="max-w-56 truncate font-medium">{b.stay.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {b.id} · booked {formatDateTime(b.createdAt)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-48 truncate">{b.guest.name ?? "—"}</p>
                    <p className="max-w-48 truncate text-xs text-muted-foreground">{b.guest.email}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(b.checkIn)} – {formatDate(b.checkOut)}
                    <p className="text-xs text-muted-foreground">
                      {b.nights} night{b.nights === 1 ? "" : "s"} · {b.guests} guest{b.guests === 1 ? "" : "s"}
                    </p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCents(b.totalCents)}
                    {b.refundCents > 0 && <p className="text-xs text-destructive">−{formatCents(b.refundCents)} refunded</p>}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={finished ? "completed" : b.status} />
                    {b.cancelledBy && <p className="mt-1 text-xs text-muted-foreground">by {b.cancelledBy}</p>}
                  </TableCell>
                  <TableCell className="text-right">
                    {b.status === "confirmed" && !finished && <CancelBooking id={b.id} guest={b.guest.email ?? "The guest"} />}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

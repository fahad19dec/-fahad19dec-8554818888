import { ArrowRight, Flag, House } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { listAudit, openReportCount, overview, statusCounts } from "@core/db";
import { DailyChart } from "@/components/dashboard/daily-chart";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { pageAdmin } from "@/lib/auth";
import { formatCents, formatDateTime, formatMoneyShort } from "@/lib/format";

export const metadata: Metadata = { title: "Overview" };

const DAYS = 30;

// The last 30 days at a glance: what needs attention, the headline numbers,
// then one chart per measure, then the latest admin activity.
export default async function OverviewPage() {
  await pageAdmin();
  const { totals, series } = overview(DAYS);
  const pending = statusCounts().pending;
  const reports = openReportCount();
  const activity = listAudit(8);

  return (
    <>
      <PageHeader title="Overview" description={`Last ${DAYS} days, in UTC. Payments are simulated, so money figures are what guests would have paid.`} />

      {(pending > 0 || reports > 0) && (
        <div className="mb-6 flex flex-wrap gap-3">
          {pending > 0 && <AttentionLink href="/listings?status=pending" icon={<House className="size-4" />} text={`${pending} listing${pending === 1 ? "" : "s"} awaiting review`} />}
          {reports > 0 && <AttentionLink href="/reports" icon={<Flag className="size-4" />} text={`${reports} open report${reports === 1 ? "" : "s"}`} />}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Revenue" value={formatMoneyShort(totals.revenueCents)} note="Service fees kept, after refunds" />
        <Stat label="Booking value" value={formatMoneyShort(totals.gmvCents)} note={`${formatCents(totals.refundsCents)} refunded`} />
        <Stat label="Bookings" value={totals.bookings.toLocaleString("en-US")} note={`${totals.cancellations} cancelled · ${totals.upcomingStays} upcoming stays`} />
        <Stat label="New signups" value={totals.signups.toLocaleString("en-US")} note={`${totals.users.toLocaleString("en-US")} users in total`} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <ChartCard title="Signups per day" data={series.map((d) => ({ date: d.date, value: d.signups }))} kind="count" />
        <ChartCard title="Bookings per day" data={series.map((d) => ({ date: d.date, value: d.bookings }))} kind="count" />
        <ChartCard title="Revenue per day" data={series.map((d) => ({ date: d.date, value: d.revenueCents }))} kind="money" />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent admin activity</CardTitle>
          <CardDescription>
            <Link href="/audit" className="text-primary hover:underline">
              See all activity
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No admin changes yet.</p>
          ) : (
            <ul className="grid gap-2 text-sm">
              {activity.map((a) => (
                <li key={a.id} className="flex flex-wrap justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
                  <span>
                    <span className="font-medium">{a.actorName ?? "System"}</span> {a.action.replace(".", " ").replace("_", " ")}{" "}
                    <span className="text-muted-foreground">{a.targetId}</span>
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">{formatDateTime(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function AttentionLink({ href, icon, text }: { href: string; icon: ReactNode; text: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 rounded-full bg-warning-soft px-3 py-1.5 text-sm font-medium hover:underline">
      {icon}
      {text}
      <ArrowRight className="size-3.5" aria-hidden />
    </Link>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl font-bold tabular-nums">{value}</CardTitle>
        <p className="text-xs text-muted-foreground">{note}</p>
      </CardHeader>
    </Card>
  );
}

function ChartCard({ title, data, kind }: { title: string; data: { date: string; value: number }[]; kind: "count" | "money" }) {
  const total = data.reduce((t, d) => t + d.value, 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {kind === "money" ? formatCents(total) : total.toLocaleString("en-US")} in {data.length} days
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <DailyChart data={data} label={title.replace(" per day", "")} kind={kind} />
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">Show as table</summary>
          <div className="mt-2 max-h-56 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  <TableHead className="text-right">{title.replace(" per day", "")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data
                  .filter((d) => d.value)
                  .map((d) => (
                    <TableRow key={d.date}>
                      <TableCell>{d.date}</TableCell>
                      <TableCell className="text-right tabular-nums">{kind === "money" ? formatCents(d.value) : d.value}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}

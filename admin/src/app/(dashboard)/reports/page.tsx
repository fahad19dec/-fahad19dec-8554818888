import type { Metadata } from "next";
import Link from "next/link";

import { listReports, REPORT_REASONS, type ReportStatus } from "@core/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pageAdmin } from "@/lib/auth";
import { formatDateTime, guestAppUrl } from "@/lib/format";
import { cn } from "@/lib/utils";

import { ReportActions } from "./report-actions";

export const metadata: Metadata = { title: "Reports" };

const tabs: { value: ReportStatus | "all"; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
  { value: "all", label: "All" },
];

// Listings guests reported from the app, open ones first.
export default async function ReportsPage({ searchParams }: PageProps<"/reports">) {
  await pageAdmin();
  const params = await searchParams;
  const current = tabs.find((t) => t.value === params.status)?.value ?? "open";
  const reports = listReports(current === "all" ? undefined : current);

  return (
    <>
      <PageHeader title="Reports" description="Guests report listings from the stay page in the app." />
      <nav aria-label="Report status" className="mb-4 flex w-fit flex-wrap gap-1 rounded-lg bg-muted p-1">
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={{ pathname: "/reports", query: { status: tab.value } }}
            aria-current={current === tab.value ? "page" : undefined}
            className={cn("rounded-md px-3 py-1 text-sm font-medium text-muted-foreground", current === tab.value && "bg-background text-foreground shadow-sm")}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">{current === "open" ? "No open reports. Nice." : "No reports here."}</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {reports.map((r) => {
            const view = r.stay?.status === "approved" ? guestAppUrl(`/stay/${r.stay.slug}`) : null;
            return (
              <Card key={r.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={r.status} />
                    <span className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</span>
                  </div>
                  <CardTitle className="text-base">{REPORT_REASONS[r.reason]}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm">
                  {r.details && <blockquote className="border-l-2 border-primary pl-3 text-pretty">{r.details}</blockquote>}
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                    <dt className="text-muted-foreground">Listing</dt>
                    <dd className="min-w-0">
                      {r.stay ? (
                        <>
                          <Link href={`/listings/${r.stay.id}`} className="font-medium hover:underline">
                            {r.stay.title}
                          </Link>{" "}
                          <StatusBadge status={r.stay.status} className="ml-1" />
                          {view && (
                            <a href={view} target="_blank" rel="noreferrer" className="ml-2 text-primary hover:underline">
                              View in app
                            </a>
                          )}
                        </>
                      ) : (
                        "Deleted"
                      )}
                    </dd>
                    <dt className="text-muted-foreground">Reported by</dt>
                    <dd className="min-w-0 truncate">
                      <Link href={{ pathname: "/users", query: { q: r.reporter.email ?? "" } }} className="hover:underline">
                        {r.reporter.email ?? r.reporter.name}
                      </Link>
                      {r.reporter.status === "banned" && <span className="ml-2 text-xs text-destructive">banned</span>}
                    </dd>
                    {r.status !== "open" && (
                      <>
                        <dt className="text-muted-foreground">Outcome</dt>
                        <dd>
                          {r.resolution ?? "No note"} <span className="text-xs text-muted-foreground">({r.resolvedBy ?? "admin"}, {formatDateTime(r.resolvedAt)})</span>
                        </dd>
                      </>
                    )}
                  </dl>
                  {r.status === "open" && <ReportActions id={r.id} stay={r.stay && { id: r.stay.id, status: r.stay.status }} />}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

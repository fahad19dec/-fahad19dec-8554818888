import { Plus, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { listStaysForAdmin, statusCounts, LISTING_STATUSES, type ListingStatus } from "@core/db";
import { typeLabels } from "@core/search/parse";
import { placeLabel } from "@core/stays";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { pageAdmin } from "@/lib/auth";
import { formatDate, guestAppUrl, photoSrc } from "@/lib/format";
import { cn } from "@/lib/utils";

import { ListingActions } from "./listing-actions";

export const metadata: Metadata = { title: "Listings" };

const tabs: { value: ListingStatus | "all"; label: string }[] = [
  { value: "pending", label: "Awaiting review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

// Listings by review status. Approved listings are the only ones guests see.
export default async function ListingsPage({ searchParams }: PageProps<"/listings">) {
  await pageAdmin();
  const params = await searchParams;
  const counts = statusCounts();
  const raw = typeof params.status === "string" ? params.status : undefined;
  const status = raw === "all" ? undefined : LISTING_STATUSES.find((s) => s === raw) ?? (counts.pending ? "pending" : "approved");
  const current = raw === "all" ? "all" : status;
  const q = typeof params.q === "string" ? params.q : "";
  const stays = listStaysForAdmin({ status, q });
  const total = counts.pending + counts.approved + counts.rejected;

  return (
    <>
      <PageHeader
        title="Listings"
        description="Approve listings to show them to guests. Rejected listings are hidden right away."
        actions={
          <Link href="/listings/new" className={buttonVariants({ size: "lg" })}>
            <Plus /> New listing
          </Link>
        }
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Listing status" className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
          {tabs.map((tab) => {
            const n = tab.value === "all" ? total : counts[tab.value];
            return (
              <Link
                key={tab.value}
                href={{ pathname: "/listings", query: { status: tab.value, ...(q ? { q } : {}) } }}
                aria-current={current === tab.value ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1 text-sm font-medium text-muted-foreground",
                  current === tab.value && "bg-background text-foreground shadow-sm",
                )}
              >
                {tab.label} <span className="tabular-nums">({n})</span>
              </Link>
            );
          })}
        </nav>
        <form className="relative w-full sm:w-72">
          <input type="hidden" name="status" value={current} />
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input name="q" defaultValue={q} placeholder="Search title, place or host" className="pl-8" aria-label="Search listings" />
        </form>
      </div>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Listing</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead className="text-right">Per night</TableHead>
              <TableHead className="hidden lg:table-cell">Updated</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stays.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  {q ? "No listings match that search." : status === "pending" ? "Nothing waiting for review." : "No listings here yet."}
                </TableCell>
              </TableRow>
            )}
            {stays.map((stay) => {
              const view = stay.status === "approved" ? guestAppUrl(`/stay/${stay.slug}`) : null;
              return (
                <TableRow key={stay.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element -- photos from any host */}
                      <img src={photoSrc(stay.photos[0]?.url, 160) ?? ""} alt="" className="h-10 w-14 shrink-0 rounded-md bg-muted object-cover" />
                      <div className="min-w-0">
                        <Link href={`/listings/${stay.id}`} className="block truncate font-medium hover:underline">
                          {stay.title}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">
                          {placeLabel(stay)} · {stay.bookingCount} booking{stay.bookingCount === 1 ? "" : "s"}
                          {view && (
                            <>
                              {" · "}
                              <a href={view} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                View in app
                              </a>
                            </>
                          )}
                        </p>
                        {stay.reviewNote && <p className="truncate text-xs text-muted-foreground italic">Note: {stay.reviewNote}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{typeLabels[stay.type]}</TableCell>
                  <TableCell className="text-right tabular-nums">${stay.pricePerNight}</TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">{formatDate(stay.updatedAt)}</TableCell>
                  <TableCell>
                    <StatusBadge status={stay.status} />
                  </TableCell>
                  <TableCell>
                    <ListingActions id={stay.id} title={stay.title} status={stay.status} bookingCount={stay.bookingCount} />
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

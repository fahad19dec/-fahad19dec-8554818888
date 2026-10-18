import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { listHosts, stayForAdmin } from "@core/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { pageAdmin } from "@/lib/auth";

import { ListingActions } from "../listing-actions";
import { ListingForm } from "../listing-form";

export const metadata: Metadata = { title: "Edit listing" };

export default async function EditListingPage({ params }: PageProps<"/listings/[id]">) {
  await pageAdmin();
  const { id } = await params;
  const stay = stayForAdmin(id);
  if (!stay) notFound();
  return (
    <>
      <PageHeader
        title={stay.title}
        description={
          <span className="inline-flex items-center gap-2">
            <StatusBadge status={stay.status} /> Edits go live in the guest app as soon as you save.
          </span>
        }
        actions={<ListingActions id={stay.id} title={stay.title} status={stay.status} bookingCount={stay.bookingCount} />}
      />
      <ListingForm stay={stay} hosts={listHosts().map(({ slug, name }) => ({ slug, name }))} />
    </>
  );
}

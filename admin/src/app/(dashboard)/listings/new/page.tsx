import type { Metadata } from "next";

import { listHosts } from "@core/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { pageAdmin } from "@/lib/auth";

import { ListingForm } from "../listing-form";

export const metadata: Metadata = { title: "New listing" };

export default async function NewListingPage() {
  await pageAdmin();
  return (
    <>
      <PageHeader title="New listing" description="New listings wait in review until approved, unless you publish them now." />
      <ListingForm hosts={listHosts().map(({ slug, name }) => ({ slug, name }))} />
    </>
  );
}

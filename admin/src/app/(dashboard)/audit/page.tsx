import type { Metadata } from "next";

import { listAudit } from "@core/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { pageAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Activity" };

// Every admin change, newest first: who did what, to which record.
export default async function AuditPage() {
  await pageAdmin();
  const entries = listAudit(300);
  return (
    <>
      <PageHeader title="Activity" description="Every change made by an admin, newest first. Kept for accountability." />
      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Record</TableHead>
              <TableHead className="hidden md:table-cell">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No admin changes yet.
                </TableCell>
              </TableRow>
            )}
            {entries.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">{formatDateTime(e.createdAt)}</TableCell>
                <TableCell>{e.actorName ?? "System"}</TableCell>
                <TableCell>
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{e.action}</code>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {e.targetType} {e.targetId}
                </TableCell>
                <TableCell className="hidden max-w-sm truncate text-xs text-muted-foreground md:table-cell">{e.details ? JSON.stringify(e.details) : ""}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

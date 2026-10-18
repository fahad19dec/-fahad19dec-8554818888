import { Search } from "lucide-react";
import type { Metadata } from "next";

import { listUsers, ROLES, type Role, type UserStatus } from "@core/db";
import { NativeSelect } from "@/components/form-controls";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { pageAdmin } from "@/lib/auth";
import { formatCents, formatDate } from "@/lib/format";

import { UserActions } from "./user-actions";

export const metadata: Metadata = { title: "Users" };

// Everyone who has signed in to either app.
export default async function UsersPage({ searchParams }: PageProps<"/users">) {
  const admin = await pageAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const role = ROLES.find((r) => r === params.role);
  const status = (["active", "banned"] as const).find((s) => s === params.status);
  const users = listUsers({ q, role: role as Role | undefined, status: status as UserStatus | undefined });

  return (
    <>
      <PageHeader title="Users" description="Accounts are created the first time someone signs in. Bans apply on their next request." />
      <form className="mb-4 flex flex-wrap gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input name="q" defaultValue={q} placeholder="Search name or email" className="pl-8" aria-label="Search users" />
        </div>
        <NativeSelect name="role" defaultValue={role ?? ""} className="w-36" aria-label="Role">
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r[0].toUpperCase() + r.slice(1)}s
            </option>
          ))}
        </NativeSelect>
        <NativeSelect name="status" defaultValue={status ?? ""} className="w-36" aria-label="Status">
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </NativeSelect>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden md:table-cell">Joined</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Bookings</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Spent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No users match.
                </TableCell>
              </TableRow>
            )}
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      {u.imageUrl && <AvatarImage src={u.imageUrl} alt="" />}
                      <AvatarFallback>{(u.name ?? u.email ?? "?")[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {u.name ?? "—"} {u.id === admin.id && <span className="text-xs text-muted-foreground">(you)</span>}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                      {u.banReason && <p className="truncate text-xs text-destructive">Banned: {u.banReason}</p>}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="capitalize">{u.role}</TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">{formatDate(u.createdAt)}</TableCell>
                <TableCell className="hidden text-right tabular-nums lg:table-cell">{u.bookingCount}</TableCell>
                <TableCell className="hidden text-right tabular-nums lg:table-cell">{formatCents(u.spentCents)}</TableCell>
                <TableCell>
                  <StatusBadge status={u.status} />
                </TableCell>
                <TableCell>
                  <UserActions id={u.id} email={u.email ?? u.id} role={u.role} banned={u.status === "banned"} isSelf={u.id === admin.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

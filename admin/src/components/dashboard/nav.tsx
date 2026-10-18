"use client";

import { BarChart3, CalendarCheck, Flag, History, House, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Overview", icon: BarChart3, count: null },
  { href: "/listings", label: "Listings", icon: House, count: "pending" },
  { href: "/bookings", label: "Bookings", icon: CalendarCheck, count: null },
  { href: "/users", label: "Users", icon: Users, count: null },
  { href: "/reports", label: "Reports", icon: Flag, count: "reports" },
  { href: "/audit", label: "Activity", icon: History, count: null },
] as const;

// The sidebar links. Badges show work waiting: listings to review, open reports.
export function Nav({ counts }: { counts: { pending: number; reports: number } }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Dashboard" className="grid gap-1">
      {items.map(({ href, label, icon: Icon, count }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        const n = count ? counts[count] : 0;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-primary focus-visible:outline-none",
              active && "bg-sidebar-accent text-sidebar-foreground",
            )}
          >
            <Icon className={cn("size-4", active && "text-sidebar-primary")} aria-hidden />
            <span className="flex-1">{label}</span>
            {n > 0 && (
              <span className="rounded-full bg-sidebar-primary px-2 py-0.5 text-xs font-semibold text-sidebar-primary-foreground tabular-nums">
                {n}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

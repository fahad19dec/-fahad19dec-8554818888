import { cn } from "@/lib/utils";

const tones = {
  green: "bg-success-soft text-success",
  amber: "bg-warning-soft text-foreground",
  red: "bg-destructive/10 text-destructive",
  gray: "bg-muted text-muted-foreground",
} as const;

const statusTone: Record<string, keyof typeof tones> = {
  approved: "green",
  confirmed: "green",
  active: "green",
  resolved: "green",
  pending: "amber",
  open: "amber",
  rejected: "red",
  cancelled: "red",
  banned: "red",
  dismissed: "gray",
  completed: "gray",
};

const labels: Record<string, string> = { pending: "Awaiting review" };

// A status as a colored pill, so what needs attention stands out in a table.
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn("inline-flex h-5 items-center rounded-full px-2 text-xs font-medium whitespace-nowrap", tones[statusTone[status] ?? "gray"], className)}>
      {labels[status] ?? status[0].toUpperCase() + status.slice(1)}
    </span>
  );
}

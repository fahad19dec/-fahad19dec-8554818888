import { brand } from "@brand";

// The dashboard's shadcn theme tokens, from the same brand.config.js as the
// guest app: change the brand there and both apps follow.
export function BrandTheme() {
  const c = brand.colors;
  const css = `:root{
  --primary:${c.primary};--primary-foreground:${c.ink};--ring:${c.primary};
  --foreground:${c.ink};--card-foreground:${c.ink};--popover-foreground:${c.ink};
  --muted:${c.surfaceMuted};--muted-foreground:${c.inkMuted};--secondary:${c.secondarySoft};--secondary-foreground:${c.ink};
  --accent:${c.primarySoft};--accent-foreground:${c.ink};--border:${c.border};--input:${c.border};
  --destructive:${c.danger};
  --chart-1:${c.primary};--chart-2:${c.accent};--chart-3:${c.secondary};--chart-4:${c.info};--chart-5:${c.inkSubtle};
  --sidebar:${c.ink};--sidebar-foreground:${c.surface};--sidebar-primary:${c.primary};--sidebar-primary-foreground:${c.ink};
  --sidebar-accent:rgba(255,255,255,0.08);--sidebar-accent-foreground:${c.surface};--sidebar-border:rgba(255,255,255,0.12);
  --success:${c.success};--success-soft:${c.successSoft};--warning-soft:${c.primarySoft};
}`;
  return <style>{css}</style>;
}

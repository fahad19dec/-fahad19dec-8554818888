import { formatCents } from "@core/booking/pricing";

export { formatCents };

export const formatDate = (iso: string | null | undefined) =>
  iso ? new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "—";

export const formatDateTime = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" }) + " UTC"
    : "—";

/** Compact money for KPI tiles: $12.4k. */
export const formatMoneyShort = (cents: number) => {
  const dollars = cents / 100;
  return dollars >= 10000 ? `$${(dollars / 1000).toFixed(1)}k` : formatCents(cents);
};

/** Photos uploaded in this dashboard are stored as "/api/uploads/x" (the guest app's route); serve them from ours. */
export const photoSrc = (url: string | null | undefined, width = 400) => {
  if (!url) return null;
  if (url.startsWith("/api/uploads/")) return url.replace("/api/uploads/", "/uploads/");
  if (url.startsWith("https://cdn.sanity.io/")) return `${url}?w=${width}&auto=format&q=70`;
  return url;
};

/** Where to open a stay in the guest app (GUEST_APP_URL), if set. */
export const guestAppUrl = (path: string) => {
  const base = process.env.GUEST_APP_URL?.replace(/\/+$/, "");
  return base ? `${base}${path}` : null;
};

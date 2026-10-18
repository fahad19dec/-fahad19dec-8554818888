import { AccessError } from "./access";
import { logAction } from "./audit";
import { all, get, newId, now, run } from "./database";
import { assertAdmin, type User } from "./users";
import { MAX_REPORT_DETAILS, REPORT_REASONS, type ReportReason } from "../report-reasons";

export { REPORT_REASONS, type ReportReason };

// Guests report a listing; admins work the queue: resolve (with what they
// did) or dismiss. A guest can have one open report per listing.

export type ReportStatus = "open" | "resolved" | "dismissed";

export type Report = {
  id: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  resolution: string | null;
  createdAt: string;
  resolvedAt: string | null;
  reporter: { id: string; name: string | null; email: string | null; status: string };
  stay: { id: string; slug: string; title: string; status: string } | null;
  resolvedBy: string | null;
};

export function createReport(user: User, stayId: string, reason: string, details?: string) {
  if (!(reason in REPORT_REASONS)) throw new AccessError(400, "invalid_report", { reason: "Pick a reason" });
  const text = details?.trim().slice(0, MAX_REPORT_DETAILS) || null;
  if (reason === "other" && !text) throw new AccessError(400, "invalid_report", { details: "Tell us what’s wrong" });
  const open = get<{ id: string }>(
    "SELECT id FROM reports WHERE reporter_id = $user AND stay_id = $stay AND status = 'open'",
    { user: user.id, stay: stayId },
  );
  if (open) throw new AccessError(409, "already_reported");
  const id = newId("rpt");
  run(
    `INSERT INTO reports (id, reporter_id, stay_id, reason, details, created_at)
     VALUES ($id, $user, $stay, $reason, $details, $at)`,
    { id, user: user.id, stay: stayId, reason, details: text, at: now() },
  );
  return id;
}

type Row = {
  id: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
  reporter_id: string;
  r_name: string | null;
  r_email: string | null;
  r_status: string;
  stay_id: string | null;
  s_slug: string | null;
  s_data: string | null;
  s_status: string | null;
  resolver: string | null;
};

export function listReports(status?: ReportStatus): Report[] {
  return all<Row>(
    `SELECT r.*, u.name AS r_name, u.email AS r_email, u.status AS r_status,
       s.slug AS s_slug, s.data AS s_data, s.status AS s_status,
       COALESCE(a.name, a.email) AS resolver
     FROM reports r
     JOIN users u ON u.id = r.reporter_id
     LEFT JOIN stays s ON s.id = r.stay_id
     LEFT JOIN users a ON a.id = r.resolved_by
     WHERE ($status IS NULL OR r.status = $status)
     ORDER BY CASE r.status WHEN 'open' THEN 0 ELSE 1 END, r.created_at DESC`,
    { status: status ?? null },
  ).map((r) => ({
    id: r.id,
    reason: r.reason,
    details: r.details,
    status: r.status,
    resolution: r.resolution,
    createdAt: r.created_at,
    resolvedAt: r.resolved_at,
    reporter: { id: r.reporter_id, name: r.r_name, email: r.r_email, status: r.r_status },
    stay:
      r.stay_id && r.s_data
        ? { id: r.stay_id, slug: r.s_slug!, title: (JSON.parse(r.s_data) as { title: string }).title, status: r.s_status! }
        : null,
    resolvedBy: r.resolver,
  }));
}

export function closeReport(id: string, status: "resolved" | "dismissed", resolution: string, by: User) {
  const actor = assertAdmin(by);
  const result = run(
    `UPDATE reports SET status = $status, resolution = $resolution, resolved_by = $actor, resolved_at = $at
     WHERE id = $id AND status = 'open'`,
    { id, status, resolution: resolution.trim() || null, actor: actor.id, at: now() },
  );
  if (!result.changes) throw new AccessError(409, "report_closed");
  logAction(actor.id, `report.${status === "resolved" ? "resolve" : "dismiss"}`, "report", id, { resolution });
}

export const openReportCount = () => get<{ n: number }>("SELECT COUNT(*) AS n FROM reports WHERE status = 'open'")!.n;

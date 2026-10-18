import { all, now, run } from "./database";

// Every admin change, for accountability: who did what to which record.

export type AuditEntry = {
  id: number;
  actorId: string | null;
  actorName: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
};

export function logAction(actorId: string | null, action: string, targetType?: string, targetId?: string, details?: object) {
  run(
    `INSERT INTO audit_log (actor_id, action, target_type, target_id, details, created_at)
     VALUES ($actor, $action, $type, $target, $details, $at)`,
    {
      actor: actorId,
      action,
      type: targetType ?? null,
      target: targetId ?? null,
      details: details ? JSON.stringify(details) : null,
      at: now(),
    },
  );
}

export function listAudit(limit = 100): AuditEntry[] {
  return all<{
    id: number;
    actor_id: string | null;
    actor_name: string | null;
    action: string;
    target_type: string | null;
    target_id: string | null;
    details: string | null;
    created_at: string;
  }>(
    `SELECT a.*, COALESCE(u.name, u.email) AS actor_name FROM audit_log a
     LEFT JOIN users u ON u.id = a.actor_id ORDER BY a.id DESC LIMIT $limit`,
    { limit },
  ).map((r) => ({
    id: r.id,
    actorId: r.actor_id,
    actorName: r.actor_name,
    action: r.action,
    targetType: r.target_type,
    targetId: r.target_id,
    details: r.details ? JSON.parse(r.details) : null,
    createdAt: r.created_at,
  }));
}

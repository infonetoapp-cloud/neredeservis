import { randomUUID } from "node:crypto";

import { getPostgresPool, isPostgresConfigured } from "./postgres.js";

function normalizeNullableText(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeIsoString(value) {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }
  return null;
}

function normalizeStatus(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "unknown";
}

function buildCompanyAuditLogRecord(input) {
  const companyId = normalizeNullableText(input?.companyId);
  const eventType = normalizeNullableText(input?.eventType);
  if (!companyId || !eventType) {
    return null;
  }

  const auditId = normalizeNullableText(input?.auditId) ?? randomUUID();

  return {
    auditId,
    companyId,
    eventType,
    targetType: normalizeNullableText(input?.targetType),
    targetId: normalizeNullableText(input?.targetId),
    actorUid: normalizeNullableText(input?.actorUid),
    status: normalizeStatus(input?.status),
    reason: normalizeNullableText(input?.reason),
    metadata: input?.metadata ?? null,
    createdAt: normalizeIsoString(input?.createdAt) ?? new Date().toISOString(),
  };
}

function formatAuditRow(row) {
  const auditId = normalizeNullableText(row?.audit_id);
  const companyId = normalizeNullableText(row?.company_id);
  const eventType = normalizeNullableText(row?.event_type);
  if (!auditId || !companyId || !eventType) {
    return null;
  }

  return {
    auditId,
    companyId,
    eventType,
    targetType: normalizeNullableText(row?.target_type),
    targetId: normalizeNullableText(row?.target_id),
    actorUid: normalizeNullableText(row?.actor_uid),
    status: normalizeStatus(row?.status),
    reason: normalizeNullableText(row?.reason),
    createdAt: normalizeIsoString(row?.created_at),
  };
}

async function readCompanyAuditSyncState(companyId) {
  const pool = getPostgresPool();
  if (!pool) {
    return null;
  }

  const normalizedCompanyId = normalizeNullableText(companyId);
  if (!normalizedCompanyId) {
    return null;
  }

  const result = await pool.query(
    `
      SELECT audit_logs_synced_at
      FROM companies
      WHERE company_id = $1
      LIMIT 1
    `,
    [normalizedCompanyId],
  );

  return result.rows[0] ?? null;
}

async function markCompanyAuditSyncState(queryable, companyId, syncedAt) {
  const normalizedCompanyId = normalizeNullableText(companyId);
  const normalizedSyncedAt = normalizeIsoString(syncedAt) ?? new Date().toISOString();
  if (!normalizedCompanyId) {
    return false;
  }

  const result = await queryable.query(
    `
      UPDATE companies
      SET audit_logs_synced_at = $2::timestamptz,
          updated_at = GREATEST(updated_at, $2::timestamptz)
      WHERE company_id = $1
    `,
    [normalizedCompanyId, normalizedSyncedAt],
  );

  return result.rowCount > 0;
}

async function upsertCompanyAuditLogRow(queryable, input) {
  const auditId = normalizeNullableText(input?.auditId);
  const companyId = normalizeNullableText(input?.companyId);
  const eventType = normalizeNullableText(input?.eventType);
  if (!auditId || !companyId || !eventType) {
    return false;
  }

  await queryable.query(
    `
      INSERT INTO company_audit_logs (
        audit_id,
        company_id,
        event_type,
        target_type,
        target_id,
        actor_uid,
        status,
        reason,
        metadata,
        created_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::timestamptz
      )
      ON CONFLICT (audit_id) DO UPDATE
      SET
        company_id = EXCLUDED.company_id,
        event_type = EXCLUDED.event_type,
        target_type = EXCLUDED.target_type,
        target_id = EXCLUDED.target_id,
        actor_uid = EXCLUDED.actor_uid,
        status = EXCLUDED.status,
        reason = EXCLUDED.reason,
        metadata = EXCLUDED.metadata,
        created_at = EXCLUDED.created_at
    `,
    [
      auditId,
      companyId,
      eventType,
      normalizeNullableText(input?.targetType),
      normalizeNullableText(input?.targetId),
      normalizeNullableText(input?.actorUid),
      normalizeStatus(input?.status),
      normalizeNullableText(input?.reason),
      JSON.stringify(input?.metadata ?? null),
      normalizeIsoString(input?.createdAt) ?? new Date().toISOString(),
    ],
  );

  return true;
}

export function shouldUsePostgresCompanyAuditStore() {
  return isPostgresConfigured();
}

export function stageCompanyAuditLogWrite(_db, _transaction, input) {
  const auditLog = buildCompanyAuditLogRecord(input);
  if (!auditLog) {
    return null;
  }

  return auditLog;
}

export async function flushStagedCompanyAuditLog(auditLog) {
  if (!shouldUsePostgresCompanyAuditStore() || !auditLog) {
    return false;
  }

  return syncCompanyAuditLogToPostgres(auditLog);
}

export async function isCompanyAuditFreshInPostgres(companyId, maxAgeMs) {
  const row = await readCompanyAuditSyncState(companyId);
  const syncedAt = normalizeIsoString(row?.audit_logs_synced_at);
  if (!syncedAt) {
    return false;
  }

  const syncedMs = Date.parse(syncedAt);
  if (!Number.isFinite(syncedMs)) {
    return false;
  }

  const maxAge = Number.isFinite(maxAgeMs) ? Math.max(1_000, Math.trunc(maxAgeMs)) : 60_000;
  return Date.now() - syncedMs <= maxAge;
}

export async function listCompanyAuditLogsFromPostgres(companyId, limit) {
  const pool = getPostgresPool();
  if (!pool) {
    return [];
  }

  const normalizedCompanyId = normalizeNullableText(companyId);
  if (!normalizedCompanyId) {
    return [];
  }

  const auditLimit = Number.isFinite(limit) ? Math.max(1, Math.trunc(limit)) : 60;
  const result = await pool.query(
    `
      SELECT
        audit_id,
        company_id,
        event_type,
        target_type,
        target_id,
        actor_uid,
        status,
        reason,
        created_at
      FROM company_audit_logs
      WHERE company_id = $1
      ORDER BY created_at DESC, audit_id DESC
      LIMIT $2
    `,
    [normalizedCompanyId, auditLimit],
  );

  return result.rows.map(formatAuditRow).filter((item) => item !== null);
}

export async function syncCompanyAuditLogsSnapshotForCompany(companyId, items, syncedAt) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  const normalizedCompanyId = normalizeNullableText(companyId);
  if (!normalizedCompanyId) {
    return false;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const item of Array.isArray(items) ? items : []) {
      await upsertCompanyAuditLogRow(client, item);
    }
    await markCompanyAuditSyncState(client, normalizedCompanyId, syncedAt);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => null);
    throw error;
  } finally {
    client.release();
  }
}

export async function syncCompanyAuditLogToPostgres(input) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  return upsertCompanyAuditLogRow(pool, input);
}

import { HttpError } from "./http.js";
import { getPostgresPool, isPostgresConfigured } from "./postgres.js";

function normalizeNullableText(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim());
}

function normalizeTimeSlot(value) {
  return value === "morning" || value === "evening" || value === "midday" || value === "custom"
    ? value
    : null;
}

function formatRouteShareRow(row) {
  const routeId = normalizeNullableText(row?.route_id);
  const companyId = normalizeNullableText(row?.company_id);
  const name = normalizeNullableText(row?.name);
  const srvCode = normalizeNullableText(row?.srv_code);
  if (!routeId || !companyId || !name || !srvCode) {
    return null;
  }

  return {
    routeId,
    companyId,
    name,
    srvCode,
    driverId: normalizeNullableText(row?.driver_id),
    authorizedDriverIds: normalizeStringArray(row?.authorized_driver_ids),
    memberIds: normalizeStringArray(row?.member_ids),
    scheduledTime: normalizeNullableText(row?.scheduled_time),
    timeSlot: normalizeTimeSlot(row?.time_slot),
    allowGuestTracking: row?.allow_guest_tracking === true,
    isArchived: row?.is_archived === true,
    driverDisplayName:
      normalizeNullableText(row?.driver_display_name) ?? "Servis Soforu",
  };
}

async function readRouteShareContextWithQuery(queryText, values) {
  const pool = getPostgresPool();
  if (!pool) {
    return null;
  }

  const result = await pool.query(queryText, values);
  return formatRouteShareRow(result.rows[0] ?? null);
}

export function shouldUsePostgresRouteShareStore() {
  return isPostgresConfigured();
}

export async function readRouteShareContextFromPostgresByRouteId(routeId) {
  const normalizedRouteId = normalizeNullableText(routeId);
  if (!normalizedRouteId) {
    return null;
  }

  return readRouteShareContextWithQuery(
    `
      SELECT
        r.route_id,
        r.company_id,
        r.name,
        r.srv_code,
        r.driver_id,
        r.authorized_driver_ids,
        r.member_ids,
        r.scheduled_time,
        r.time_slot,
        r.allow_guest_tracking,
        r.is_archived,
        COALESCE(
          d.name,
          au.display_name,
          au.profile_data->>'displayName',
          au.profile_data->>'name',
          au.email,
          'Servis Soforu'
        ) AS driver_display_name
      FROM company_routes r
      LEFT JOIN company_drivers d ON d.driver_id = r.driver_id
      LEFT JOIN auth_users au ON au.uid = r.driver_id
      WHERE r.route_id = $1
      LIMIT $2
    `,
    [normalizedRouteId, 1],
  );
}

export async function readRouteShareContextFromPostgresBySrvCode(srvCode) {
  const normalizedSrvCode = normalizeNullableText(srvCode)?.toUpperCase() ?? null;
  if (!normalizedSrvCode) {
    return null;
  }

  return readRouteShareContextWithQuery(
    `
      SELECT
        r.route_id,
        r.company_id,
        r.name,
        r.srv_code,
        r.driver_id,
        r.authorized_driver_ids,
        r.member_ids,
        r.scheduled_time,
        r.time_slot,
        r.allow_guest_tracking,
        r.is_archived,
        COALESCE(
          d.name,
          au.display_name,
          au.profile_data->>'displayName',
          au.profile_data->>'name',
          au.email,
          'Servis Soforu'
        ) AS driver_display_name
      FROM company_routes r
      LEFT JOIN company_drivers d ON d.driver_id = r.driver_id
      LEFT JOIN auth_users au ON au.uid = r.driver_id
      WHERE UPPER(r.srv_code) = $1
        AND r.is_archived = FALSE
      ORDER BY r.updated_at DESC NULLS LAST, r.route_id ASC
      LIMIT $2
    `,
    [normalizedSrvCode, 1],
  );
}

export async function enforceRoutePreviewRateLimitInPostgres(input) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  const rateKey = normalizeNullableText(input?.key);
  const nowMs = Number.isFinite(input?.nowMs) ? Math.trunc(input.nowMs) : Date.now();
  const windowMs = Number.isFinite(input?.windowMs) ? Math.max(1_000, Math.trunc(input.windowMs)) : 60_000;
  const maxCalls = Number.isFinite(input?.maxCalls) ? Math.max(1, Math.trunc(input.maxCalls)) : 60;
  if (!rateKey) {
    return false;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const currentResult = await client.query(
      `
        SELECT window_start_ms, call_count
        FROM route_preview_rate_limits
        WHERE rate_key = $1
        FOR UPDATE
      `,
      [rateKey],
    );

    const currentRow = currentResult.rows[0] ?? null;
    let windowStartMs =
      typeof currentRow?.window_start_ms === "number" ? currentRow.window_start_ms : nowMs;
    let callCount = typeof currentRow?.call_count === "number" ? currentRow.call_count : 0;

    if (nowMs - windowStartMs >= windowMs) {
      windowStartMs = nowMs;
      callCount = 1;
    } else {
      callCount += 1;
    }

    if (callCount > maxCalls) {
      throw new HttpError(
        429,
        "resource-exhausted",
        "Route preview limiti asildi. Lutfen daha sonra tekrar dene.",
      );
    }

    await client.query(
      `
        INSERT INTO route_preview_rate_limits (
          rate_key,
          window_start_ms,
          call_count,
          updated_at
        )
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (rate_key) DO UPDATE
        SET
          window_start_ms = EXCLUDED.window_start_ms,
          call_count = EXCLUDED.call_count,
          updated_at = NOW()
      `,
      [rateKey, windowStartMs, callCount],
    );
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => null);
    throw error;
  } finally {
    client.release();
  }
}

export async function writeRouteShareAuditEventToPostgres(input) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  await pool.query(
    `
      INSERT INTO route_share_audit_events (
        company_id,
        event_type,
        actor_uid,
        actor_type,
        route_id,
        srv_code,
        status,
        reason,
        request_ip_hash,
        metadata,
        created_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::timestamptz
      )
    `,
    [
      normalizeNullableText(input?.companyId),
      normalizeNullableText(input?.eventType) ?? "unknown",
      normalizeNullableText(input?.actorUid),
      normalizeNullableText(input?.actorType) ?? (input?.actorUid ? "authenticated" : "public"),
      normalizeNullableText(input?.routeId),
      normalizeNullableText(input?.srvCode),
      normalizeNullableText(input?.status) ?? "success",
      normalizeNullableText(input?.reason),
      normalizeNullableText(input?.requestIpHash),
      JSON.stringify(input?.metadata ?? {}),
      input?.createdAt instanceof Date
        ? input.createdAt.toISOString()
        : normalizeNullableText(input?.createdAt) ?? new Date().toISOString(),
    ],
  );
  return true;
}

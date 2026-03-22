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

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((item) => typeof item === "string" && item.trim().length > 0)
        .map((item) => item.trim()),
    ),
  );
}

function formatRouteAnnouncementRow(row) {
  const announcementId = normalizeNullableText(row?.announcement_id);
  const routeId = normalizeNullableText(row?.route_id);
  const driverId = normalizeNullableText(row?.driver_id);
  const templateKey = normalizeNullableText(row?.template_key);
  const shareUrl = normalizeNullableText(row?.share_url);
  const idempotencyKey = normalizeNullableText(row?.idempotency_key);
  if (!announcementId || !routeId || !driverId || !templateKey || !shareUrl || !idempotencyKey) {
    return null;
  }

  return {
    announcementId,
    routeId,
    companyId: normalizeNullableText(row?.company_id),
    driverId,
    templateKey,
    customText: normalizeNullableText(row?.custom_text),
    channels: normalizeStringArray(row?.channels),
    shareUrl,
    idempotencyKey,
    createdAt: normalizeIsoString(row?.created_at),
    updatedAt: normalizeIsoString(row?.updated_at),
  };
}

export function shouldUsePostgresRouteAnnouncementStore() {
  return isPostgresConfigured();
}

export async function upsertRouteAnnouncementToPostgres(input) {
  const pool = getPostgresPool();
  if (!pool) {
    return null;
  }

  const announcementId = normalizeNullableText(input?.announcementId);
  const routeId = normalizeNullableText(input?.routeId);
  const driverId = normalizeNullableText(input?.driverId);
  const templateKey = normalizeNullableText(input?.templateKey);
  const shareUrl = normalizeNullableText(input?.shareUrl);
  const idempotencyKey = normalizeNullableText(input?.idempotencyKey);
  if (!announcementId || !routeId || !driverId || !templateKey || !shareUrl || !idempotencyKey) {
    return null;
  }

  const createdAt = normalizeIsoString(input?.createdAt) ?? new Date().toISOString();
  const updatedAt = normalizeIsoString(input?.updatedAt) ?? createdAt;
  const result = await pool.query(
    `
      INSERT INTO route_announcements (
        announcement_id,
        route_id,
        company_id,
        driver_id,
        template_key,
        custom_text,
        channels,
        share_url,
        idempotency_key,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10::timestamptz, $11::timestamptz
      )
      ON CONFLICT (announcement_id) DO UPDATE
      SET
        route_id = EXCLUDED.route_id,
        company_id = EXCLUDED.company_id,
        driver_id = EXCLUDED.driver_id,
        template_key = EXCLUDED.template_key,
        custom_text = EXCLUDED.custom_text,
        channels = EXCLUDED.channels,
        share_url = EXCLUDED.share_url,
        idempotency_key = EXCLUDED.idempotency_key,
        updated_at = EXCLUDED.updated_at
      RETURNING
        announcement_id,
        route_id,
        company_id,
        driver_id,
        template_key,
        custom_text,
        channels,
        share_url,
        idempotency_key,
        created_at,
        updated_at
    `,
    [
      announcementId,
      routeId,
      normalizeNullableText(input?.companyId),
      driverId,
      templateKey,
      normalizeNullableText(input?.customText),
      JSON.stringify(normalizeStringArray(input?.channels)),
      shareUrl,
      idempotencyKey,
      createdAt,
      updatedAt,
    ],
  );

  return formatRouteAnnouncementRow(result.rows[0] ?? null);
}

export async function readLatestRouteAnnouncementFromPostgres(routeId) {
  const pool = getPostgresPool();
  if (!pool) {
    return null;
  }

  const normalizedRouteId = normalizeNullableText(routeId);
  if (!normalizedRouteId) {
    return null;
  }

  const result = await pool.query(
    `
      SELECT
        announcement_id,
        route_id,
        company_id,
        driver_id,
        template_key,
        custom_text,
        channels,
        share_url,
        idempotency_key,
        created_at,
        updated_at
      FROM route_announcements
      WHERE route_id = $1
      ORDER BY created_at DESC, announcement_id DESC
      LIMIT 1
    `,
    [normalizedRouteId],
  );

  return formatRouteAnnouncementRow(result.rows[0] ?? null);
}

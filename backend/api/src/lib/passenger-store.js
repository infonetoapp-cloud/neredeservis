import { getPostgresPool, isPostgresConfigured } from "./postgres.js";

function normalizeNullableText(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeBoolean(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeFiniteNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
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

function normalizeVirtualStop(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const lat = normalizeFiniteNumber(value.lat);
  const lng = normalizeFiniteNumber(value.lng);
  if (lat == null || lng == null || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  return { lat, lng };
}

function toJson(value, fallback) {
  return JSON.stringify(value ?? fallback);
}

function formatRoutePassengerRow(row) {
  const routeId = normalizeNullableText(row?.route_id);
  const companyId = normalizeNullableText(row?.company_id);
  const passengerUid = normalizeNullableText(row?.passenger_uid);
  const name = normalizeNullableText(row?.name);
  if (!routeId || !companyId || !passengerUid || !name) {
    return null;
  }

  return {
    routeId,
    companyId,
    passengerUid,
    name,
    phone: normalizeNullableText(row?.phone),
    showPhoneToDriver: normalizeBoolean(row?.show_phone_to_driver, false),
    boardingArea: normalizeNullableText(row?.boarding_area) ?? "",
    virtualStop: normalizeVirtualStop(row?.virtual_stop),
    virtualStopLabel: normalizeNullableText(row?.virtual_stop_label),
    notificationTime: normalizeNullableText(row?.notification_time) ?? "",
    joinedAt: normalizeIsoString(row?.joined_at),
    updatedAt: normalizeIsoString(row?.updated_at),
  };
}

function formatGuestTrackingSessionRow(row) {
  const sessionId = normalizeNullableText(row?.session_id);
  const routeId = normalizeNullableText(row?.route_id);
  const companyId = normalizeNullableText(row?.company_id);
  const guestUid = normalizeNullableText(row?.guest_uid);
  const guestDisplayName = normalizeNullableText(row?.guest_display_name);
  const expiresAt = normalizeIsoString(row?.expires_at);
  if (!sessionId || !routeId || !companyId || !guestUid || !guestDisplayName || !expiresAt) {
    return null;
  }

  return {
    sessionId,
    routeId,
    companyId,
    routeName: normalizeNullableText(row?.route_name),
    guestUid,
    guestDisplayName,
    expiresAt,
    status: normalizeNullableText(row?.status) ?? "active",
    revokeReason: normalizeNullableText(row?.revoke_reason),
    createdAt: normalizeIsoString(row?.created_at),
    updatedAt: normalizeIsoString(row?.updated_at),
  };
}

function formatRouteSkipRequestRow(row) {
  const routeId = normalizeNullableText(row?.route_id);
  const companyId = normalizeNullableText(row?.company_id);
  const passengerUid = normalizeNullableText(row?.passenger_uid);
  const dateKey = normalizeNullableText(row?.date_key);
  if (!routeId || !companyId || !passengerUid || !dateKey) {
    return null;
  }

  return {
    routeId,
    companyId,
    passengerUid,
    dateKey,
    status: normalizeNullableText(row?.status) ?? "skip_today",
    idempotencyKey: normalizeNullableText(row?.idempotency_key),
    createdAt: normalizeIsoString(row?.created_at),
    updatedAt: normalizeIsoString(row?.updated_at),
  };
}

async function upsertRoutePassengerRow(queryable, input) {
  const routeId = normalizeNullableText(input?.routeId);
  const companyId = normalizeNullableText(input?.companyId);
  const passengerUid = normalizeNullableText(input?.passengerUid);
  const name = normalizeNullableText(input?.name);
  if (!routeId || !companyId || !passengerUid || !name) {
    return false;
  }

  const joinedAt = normalizeIsoString(input?.joinedAt) ?? new Date().toISOString();
  const updatedAt = normalizeIsoString(input?.updatedAt) ?? joinedAt;
  await queryable.query(
    `
      INSERT INTO route_passengers (
        route_id,
        company_id,
        passenger_uid,
        name,
        phone,
        show_phone_to_driver,
        boarding_area,
        virtual_stop,
        virtual_stop_label,
        notification_time,
        joined_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11::timestamptz, $12::timestamptz
      )
      ON CONFLICT (route_id, passenger_uid) DO UPDATE
      SET
        company_id = EXCLUDED.company_id,
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        show_phone_to_driver = EXCLUDED.show_phone_to_driver,
        boarding_area = EXCLUDED.boarding_area,
        virtual_stop = EXCLUDED.virtual_stop,
        virtual_stop_label = EXCLUDED.virtual_stop_label,
        notification_time = EXCLUDED.notification_time,
        joined_at = COALESCE(route_passengers.joined_at, EXCLUDED.joined_at),
        updated_at = EXCLUDED.updated_at
    `,
    [
      routeId,
      companyId,
      passengerUid,
      name,
      normalizeNullableText(input?.phone),
      normalizeBoolean(input?.showPhoneToDriver, false),
      normalizeNullableText(input?.boardingArea) ?? "",
      toJson(normalizeVirtualStop(input?.virtualStop), null),
      normalizeNullableText(input?.virtualStopLabel),
      normalizeNullableText(input?.notificationTime) ?? "",
      joinedAt,
      updatedAt,
    ],
  );

  return true;
}

export function shouldUsePostgresPassengerStore() {
  return isPostgresConfigured();
}

export async function readRoutePassengerFromPostgres(routeId, passengerUid) {
  const pool = getPostgresPool();
  if (!pool) {
    return null;
  }

  const normalizedRouteId = normalizeNullableText(routeId);
  const normalizedPassengerUid = normalizeNullableText(passengerUid);
  if (!normalizedRouteId || !normalizedPassengerUid) {
    return null;
  }

  const result = await pool.query(
    `
      SELECT
        route_id,
        company_id,
        passenger_uid,
        name,
        phone,
        show_phone_to_driver,
        boarding_area,
        virtual_stop,
        virtual_stop_label,
        notification_time,
        joined_at,
        updated_at
      FROM route_passengers
      WHERE route_id = $1 AND passenger_uid = $2
      LIMIT 1
    `,
    [normalizedRouteId, normalizedPassengerUid],
  );

  return formatRoutePassengerRow(result.rows[0] ?? null);
}

export async function listRoutePassengersFromPostgres(routeId, options = {}) {
  const pool = getPostgresPool();
  if (!pool) {
    return [];
  }

  const normalizedRouteId = normalizeNullableText(routeId);
  if (!normalizedRouteId) {
    return [];
  }

  const limit = Number.isFinite(options.limit) ? Math.max(1, Math.trunc(options.limit)) : 300;
  const result = await pool.query(
    `
      SELECT
        route_id,
        company_id,
        passenger_uid,
        name,
        phone,
        show_phone_to_driver,
        boarding_area,
        virtual_stop,
        virtual_stop_label,
        notification_time,
        joined_at,
        updated_at
      FROM route_passengers
      WHERE route_id = $1
      ORDER BY joined_at ASC, passenger_uid ASC
      LIMIT $2
    `,
    [normalizedRouteId, limit],
  );

  return result.rows.map(formatRoutePassengerRow).filter((item) => item !== null);
}

export async function upsertRoutePassengerToPostgres(input) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  return upsertRoutePassengerRow(pool, input);
}

export async function deleteRoutePassengerFromPostgres(routeId, passengerUid) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  const normalizedRouteId = normalizeNullableText(routeId);
  const normalizedPassengerUid = normalizeNullableText(passengerUid);
  if (!normalizedRouteId || !normalizedPassengerUid) {
    return false;
  }

  const result = await pool.query(
    `
      DELETE FROM route_passengers
      WHERE route_id = $1 AND passenger_uid = $2
    `,
    [normalizedRouteId, normalizedPassengerUid],
  );
  return result.rowCount > 0;
}

export async function readRouteSkipRequestFromPostgres(routeId, passengerUid, dateKey) {
  const pool = getPostgresPool();
  if (!pool) {
    return null;
  }

  const normalizedRouteId = normalizeNullableText(routeId);
  const normalizedPassengerUid = normalizeNullableText(passengerUid);
  const normalizedDateKey = normalizeNullableText(dateKey);
  if (!normalizedRouteId || !normalizedPassengerUid || !normalizedDateKey) {
    return null;
  }

  const result = await pool.query(
    `
      SELECT
        route_id,
        company_id,
        passenger_uid,
        date_key,
        status,
        idempotency_key,
        created_at,
        updated_at
      FROM route_skip_requests
      WHERE route_id = $1 AND passenger_uid = $2 AND date_key = $3
      LIMIT 1
    `,
    [normalizedRouteId, normalizedPassengerUid, normalizedDateKey],
  );

  return formatRouteSkipRequestRow(result.rows[0] ?? null);
}

export async function upsertRouteSkipRequestToPostgres(input) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  const routeId = normalizeNullableText(input?.routeId);
  const companyId = normalizeNullableText(input?.companyId);
  const passengerUid = normalizeNullableText(input?.passengerUid);
  const dateKey = normalizeNullableText(input?.dateKey);
  const idempotencyKey = normalizeNullableText(input?.idempotencyKey);
  if (!routeId || !companyId || !passengerUid || !dateKey || !idempotencyKey) {
    return false;
  }

  const createdAt = normalizeIsoString(input?.createdAt) ?? new Date().toISOString();
  const updatedAt = normalizeIsoString(input?.updatedAt) ?? createdAt;
  await pool.query(
    `
      INSERT INTO route_skip_requests (
        route_id,
        company_id,
        passenger_uid,
        date_key,
        status,
        idempotency_key,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7::timestamptz, $8::timestamptz
      )
      ON CONFLICT (route_id, passenger_uid, date_key) DO UPDATE
      SET
        company_id = EXCLUDED.company_id,
        status = EXCLUDED.status,
        idempotency_key = COALESCE(route_skip_requests.idempotency_key, EXCLUDED.idempotency_key),
        created_at = COALESCE(route_skip_requests.created_at, EXCLUDED.created_at),
        updated_at = EXCLUDED.updated_at
    `,
    [
      routeId,
      companyId,
      passengerUid,
      dateKey,
      normalizeNullableText(input?.status) ?? "skip_today",
      idempotencyKey,
      createdAt,
      updatedAt,
    ],
  );

  return true;
}

export async function listRouteSkipPassengerIdsFromPostgres(routeId, dateKey) {
  const pool = getPostgresPool();
  if (!pool) {
    return [];
  }

  const normalizedRouteId = normalizeNullableText(routeId);
  const normalizedDateKey = normalizeNullableText(dateKey);
  if (!normalizedRouteId || !normalizedDateKey) {
    return [];
  }

  const result = await pool.query(
    `
      SELECT passenger_uid
      FROM route_skip_requests
      WHERE route_id = $1 AND date_key = $2
      ORDER BY updated_at DESC, passenger_uid ASC
    `,
    [normalizedRouteId, normalizedDateKey],
  );

  return Array.from(
    new Set(
      result.rows
        .map((row) => normalizeNullableText(row?.passenger_uid))
        .filter((item) => item !== null),
    ),
  );
}

export async function upsertGuestTrackingSessionToPostgres(input) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  const sessionId = normalizeNullableText(input?.sessionId);
  const routeId = normalizeNullableText(input?.routeId);
  const companyId = normalizeNullableText(input?.companyId);
  const guestUid = normalizeNullableText(input?.guestUid);
  const guestDisplayName = normalizeNullableText(input?.guestDisplayName);
  const expiresAt = normalizeIsoString(input?.expiresAt);
  if (!sessionId || !routeId || !companyId || !guestUid || !guestDisplayName || !expiresAt) {
    return false;
  }

  const createdAt = normalizeIsoString(input?.createdAt) ?? new Date().toISOString();
  const updatedAt = normalizeIsoString(input?.updatedAt) ?? createdAt;
  await pool.query(
    `
      INSERT INTO guest_tracking_sessions (
        session_id,
        route_id,
        company_id,
        route_name,
        guest_uid,
        guest_display_name,
        expires_at,
        status,
        revoke_reason,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7::timestamptz, $8, $9, $10::timestamptz, $11::timestamptz
      )
      ON CONFLICT (session_id) DO UPDATE
      SET
        route_id = EXCLUDED.route_id,
        company_id = EXCLUDED.company_id,
        route_name = EXCLUDED.route_name,
        guest_uid = EXCLUDED.guest_uid,
        guest_display_name = EXCLUDED.guest_display_name,
        expires_at = EXCLUDED.expires_at,
        status = EXCLUDED.status,
        revoke_reason = EXCLUDED.revoke_reason,
        created_at = COALESCE(guest_tracking_sessions.created_at, EXCLUDED.created_at),
        updated_at = EXCLUDED.updated_at
    `,
    [
      sessionId,
      routeId,
      companyId,
      normalizeNullableText(input?.routeName),
      guestUid,
      guestDisplayName,
      expiresAt,
      normalizeNullableText(input?.status) ?? "active",
      normalizeNullableText(input?.revokeReason),
      createdAt,
      updatedAt,
    ],
  );

  return true;
}

export async function revokeGuestTrackingSessionInPostgres(sessionId, input = {}) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  const normalizedSessionId = normalizeNullableText(sessionId);
  if (!normalizedSessionId) {
    return false;
  }

  const updatedAt = normalizeIsoString(input?.updatedAt) ?? new Date().toISOString();
  const result = await pool.query(
    `
      UPDATE guest_tracking_sessions
      SET
        status = $2,
        revoke_reason = $3,
        updated_at = $4::timestamptz
      WHERE session_id = $1
    `,
    [
      normalizedSessionId,
      normalizeNullableText(input?.status) ?? "revoked",
      normalizeNullableText(input?.revokeReason),
      updatedAt,
    ],
  );

  return result.rowCount > 0;
}

export async function readGuestTrackingSessionByIdFromPostgres(sessionId) {
  const pool = getPostgresPool();
  if (!pool) {
    return null;
  }

  const normalizedSessionId = normalizeNullableText(sessionId);
  if (!normalizedSessionId) {
    return null;
  }

  const result = await pool.query(
    `
      SELECT
        session_id,
        route_id,
        company_id,
        route_name,
        guest_uid,
        guest_display_name,
        expires_at,
        status,
        revoke_reason,
        created_at,
        updated_at
      FROM guest_tracking_sessions
      WHERE session_id = $1
      LIMIT 1
    `,
    [normalizedSessionId],
  );

  return formatGuestTrackingSessionRow(result.rows[0] ?? null);
}

export async function readActiveGuestSessionForGuestFromPostgres(routeId, guestUid) {
  const pool = getPostgresPool();
  if (!pool) {
    return null;
  }

  const normalizedRouteId = normalizeNullableText(routeId);
  const normalizedGuestUid = normalizeNullableText(guestUid);
  if (!normalizedRouteId || !normalizedGuestUid) {
    return null;
  }

  const result = await pool.query(
    `
      SELECT
        session_id,
        route_id,
        company_id,
        route_name,
        guest_uid,
        guest_display_name,
        expires_at,
        status,
        revoke_reason,
        created_at,
        updated_at
      FROM guest_tracking_sessions
      WHERE route_id = $1
        AND guest_uid = $2
        AND status = 'active'
        AND expires_at > NOW()
      ORDER BY expires_at DESC, updated_at DESC
      LIMIT 1
    `,
    [normalizedRouteId, normalizedGuestUid],
  );

  return formatGuestTrackingSessionRow(result.rows[0] ?? null);
}

export async function listActiveGuestSessionsByRouteFromPostgres(routeId, options = {}) {
  const pool = getPostgresPool();
  if (!pool) {
    return [];
  }

  const normalizedRouteId = normalizeNullableText(routeId);
  if (!normalizedRouteId) {
    return [];
  }

  const limit = Number.isFinite(options.limit) ? Math.max(1, Math.trunc(options.limit)) : 300;
  const result = await pool.query(
    `
      SELECT
        session_id,
        route_id,
        company_id,
        route_name,
        guest_uid,
        guest_display_name,
        expires_at,
        status,
        revoke_reason,
        created_at,
        updated_at
      FROM guest_tracking_sessions
      WHERE route_id = $1
        AND status = 'active'
        AND expires_at > NOW()
      ORDER BY expires_at DESC, updated_at DESC
      LIMIT $2
    `,
    [normalizedRouteId, limit],
  );

  return result.rows.map(formatGuestTrackingSessionRow).filter((item) => item !== null);
}

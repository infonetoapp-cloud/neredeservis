import { getPostgresPool, isPostgresConfigured } from "./postgres.js";

const DEFAULT_ROUTE_DRIVER_PERMISSIONS = {
  canStartFinishTrip: true,
  canSendAnnouncements: true,
  canViewPassengerList: true,
  canEditAssignedRouteMeta: false,
  canEditStops: false,
  canManageRouteSchedule: false,
};

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

function toRoutePermissionFlags(rawValue) {
  const record =
    rawValue && typeof rawValue === "object" && !Array.isArray(rawValue) ? rawValue : null;
  if (!record) {
    return { ...DEFAULT_ROUTE_DRIVER_PERMISSIONS };
  }

  const readFlag = (key) =>
    typeof record[key] === "boolean" ? record[key] : DEFAULT_ROUTE_DRIVER_PERMISSIONS[key];

  return {
    canStartFinishTrip: readFlag("canStartFinishTrip"),
    canSendAnnouncements: readFlag("canSendAnnouncements"),
    canViewPassengerList: readFlag("canViewPassengerList"),
    canEditAssignedRouteMeta: readFlag("canEditAssignedRouteMeta"),
    canEditStops: readFlag("canEditStops"),
    canManageRouteSchedule: readFlag("canManageRouteSchedule"),
  };
}

function formatRouteDriverPermissionRow(row) {
  const routeId = normalizeNullableText(row?.route_id);
  const driverUid = normalizeNullableText(row?.driver_uid);
  if (!routeId || !driverUid) {
    return null;
  }

  return {
    routeId,
    driverUid,
    permissions: toRoutePermissionFlags(row?.permissions),
    updatedAt: normalizeIsoString(row?.updated_at),
  };
}

async function readRouteDriverPermissionSyncState(companyId, routeId) {
  const pool = getPostgresPool();
  if (!pool) {
    return null;
  }

  const normalizedCompanyId = normalizeNullableText(companyId);
  const normalizedRouteId = normalizeNullableText(routeId);
  if (!normalizedCompanyId || !normalizedRouteId) {
    return null;
  }

  const result = await pool.query(
    `
      SELECT driver_permissions_synced_at
      FROM company_routes
      WHERE company_id = $1 AND route_id = $2
      LIMIT 1
    `,
    [normalizedCompanyId, normalizedRouteId],
  );

  return result.rows[0] ?? null;
}

async function markRouteDriverPermissionSyncState(queryable, companyId, routeId, syncedAt) {
  const normalizedCompanyId = normalizeNullableText(companyId);
  const normalizedRouteId = normalizeNullableText(routeId);
  const normalizedSyncedAt = normalizeIsoString(syncedAt) ?? new Date().toISOString();
  if (!normalizedCompanyId || !normalizedRouteId) {
    return false;
  }

  const result = await queryable.query(
    `
      UPDATE company_routes
      SET driver_permissions_synced_at = $3::timestamptz,
          updated_at = GREATEST(updated_at, $3::timestamptz)
      WHERE company_id = $1 AND route_id = $2
    `,
    [normalizedCompanyId, normalizedRouteId, normalizedSyncedAt],
  );

  return result.rowCount > 0;
}

async function upsertRouteDriverPermissionRow(queryable, input) {
  const companyId = normalizeNullableText(input?.companyId);
  const routeId = normalizeNullableText(input?.routeId);
  const driverUid = normalizeNullableText(input?.driverUid);
  if (!companyId || !routeId || !driverUid) {
    return false;
  }

  const createdAt = normalizeIsoString(input?.createdAt) ?? new Date().toISOString();
  const updatedAt = normalizeIsoString(input?.updatedAt) ?? createdAt;
  await queryable.query(
    `
      INSERT INTO company_route_driver_permissions (
        company_id,
        route_id,
        driver_uid,
        permissions,
        created_at,
        created_by,
        updated_at,
        updated_by
      )
      VALUES (
        $1, $2, $3, $4::jsonb, $5::timestamptz, $6, $7::timestamptz, $8
      )
      ON CONFLICT (route_id, driver_uid) DO UPDATE
      SET
        company_id = EXCLUDED.company_id,
        permissions = EXCLUDED.permissions,
        created_at = COALESCE(company_route_driver_permissions.created_at, EXCLUDED.created_at),
        created_by = COALESCE(company_route_driver_permissions.created_by, EXCLUDED.created_by),
        updated_at = EXCLUDED.updated_at,
        updated_by = EXCLUDED.updated_by
    `,
    [
      companyId,
      routeId,
      driverUid,
      JSON.stringify(toRoutePermissionFlags(input?.permissions)),
      createdAt,
      normalizeNullableText(input?.createdBy),
      updatedAt,
      normalizeNullableText(input?.updatedBy),
    ],
  );

  return true;
}

export function shouldUsePostgresRouteDriverPermissionStore() {
  return isPostgresConfigured();
}

export async function isRouteDriverPermissionsSyncedInPostgres(companyId, routeId) {
  const row = await readRouteDriverPermissionSyncState(companyId, routeId);
  return Boolean(normalizeIsoString(row?.driver_permissions_synced_at));
}

export async function listRouteDriverPermissionsFromPostgres(companyId, routeId) {
  const pool = getPostgresPool();
  if (!pool) {
    return null;
  }

  const normalizedCompanyId = normalizeNullableText(companyId);
  const normalizedRouteId = normalizeNullableText(routeId);
  if (!normalizedCompanyId || !normalizedRouteId) {
    return null;
  }

  const routeResult = await pool.query(
    `
      SELECT route_id
      FROM company_routes
      WHERE company_id = $1 AND route_id = $2
      LIMIT 1
    `,
    [normalizedCompanyId, normalizedRouteId],
  );
  if (routeResult.rows.length === 0) {
    return { routeExists: false, items: [] };
  }

  const result = await pool.query(
    `
      SELECT
        route_id,
        driver_uid,
        permissions,
        updated_at
      FROM company_route_driver_permissions
      WHERE company_id = $1 AND route_id = $2
      ORDER BY driver_uid ASC
    `,
    [normalizedCompanyId, normalizedRouteId],
  );

  return {
    routeExists: true,
    items: result.rows.map(formatRouteDriverPermissionRow).filter((item) => item !== null),
  };
}

export async function replaceRouteDriverPermissionsForRoute(companyId, routeId, items, syncedAt) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  const normalizedCompanyId = normalizeNullableText(companyId);
  const normalizedRouteId = normalizeNullableText(routeId);
  if (!normalizedCompanyId || !normalizedRouteId) {
    return false;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `
        DELETE FROM company_route_driver_permissions
        WHERE company_id = $1 AND route_id = $2
      `,
      [normalizedCompanyId, normalizedRouteId],
    );

    for (const item of Array.isArray(items) ? items : []) {
      await upsertRouteDriverPermissionRow(client, item);
    }

    await markRouteDriverPermissionSyncState(client, normalizedCompanyId, normalizedRouteId, syncedAt);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => null);
    throw error;
  } finally {
    client.release();
  }
}

export async function upsertRouteDriverPermissionToPostgres(input) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  return upsertRouteDriverPermissionRow(pool, input);
}

export async function deleteRouteDriverPermissionFromPostgres(companyId, routeId, driverUid, syncedAt) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  const normalizedCompanyId = normalizeNullableText(companyId);
  const normalizedRouteId = normalizeNullableText(routeId);
  const normalizedDriverUid = normalizeNullableText(driverUid);
  if (!normalizedCompanyId || !normalizedRouteId || !normalizedDriverUid) {
    return false;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `
        DELETE FROM company_route_driver_permissions
        WHERE company_id = $1 AND route_id = $2 AND driver_uid = $3
      `,
      [normalizedCompanyId, normalizedRouteId, normalizedDriverUid],
    );
    await markRouteDriverPermissionSyncState(
      client,
      normalizedCompanyId,
      normalizedRouteId,
      syncedAt,
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

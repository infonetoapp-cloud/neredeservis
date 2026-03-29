import { createHash, randomUUID } from "node:crypto";

import {
  findUserProfileByEmail,
  upsertAuthUserProfile,
} from "./auth-user-store.js";
import {
  createManagedUserLocally,
  issuePasswordResetTokenLocally,
} from "./auth-local.js";
import { readCompanyFromPostgres, syncCompanyWithOwnerMembershipToPostgres } from "./company-membership-store.js";
import { flushStagedCompanyAuditLog, stageCompanyAuditLogWrite } from "./company-audit-store.js";
import { HttpError } from "./http.js";
import { getPostgresPool, isPostgresConfigured } from "./postgres.js";

function requirePlatformStore() {
  if (!isPostgresConfigured()) {
    throw new HttpError(412, "failed-precondition", "Platform company store hazir degil.");
  }

  const pool = getPostgresPool();
  if (!pool) {
    throw new HttpError(412, "failed-precondition", "Platform company store hazir degil.");
  }
  return pool;
}

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

function assertCompanyStatus(value) {
  return value === "suspended" ? "suspended" : "active";
}

function normalizeCompanyId(rawValue) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", "companyId zorunludur.");
  }
  const companyId = rawValue.trim();
  if (!companyId || companyId.length > 128) {
    throw new HttpError(400, "invalid-argument", "companyId gecersiz.");
  }
  return companyId;
}

function normalizeCompanyName(rawValue) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", "companyName zorunludur.");
  }
  const companyName = rawValue.trim();
  if (companyName.length < 2 || companyName.length > 120) {
    throw new HttpError(400, "invalid-argument", "companyName en az 2 karakter olmalidir.");
  }
  return companyName;
}

function normalizeOwnerEmail(rawValue) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", "ownerEmail zorunludur.");
  }
  const ownerEmail = rawValue.trim().toLowerCase();
  if (!ownerEmail || !ownerEmail.includes("@") || ownerEmail.length > 254) {
    throw new HttpError(400, "invalid-argument", "Gecerli bir ownerEmail girilmelidir.");
  }
  return ownerEmail;
}

function normalizeVehicleLimit(rawValue) {
  if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) {
    throw new HttpError(400, "invalid-argument", "vehicleLimit sayisal olmalidir.");
  }
  const vehicleLimit = Math.trunc(rawValue);
  if (vehicleLimit < 0 || vehicleLimit > 9999) {
    throw new HttpError(400, "invalid-argument", "vehicleLimit gecersiz.");
  }
  return vehicleLimit;
}

function readAppBaseUrl() {
  return (process.env.APP_BASE_URL?.trim() || "https://app.neredeservis.app").replace(/\/+$/, "");
}

function generateBootstrapPassword() {
  return `Ns!${Math.floor(100000 + Math.random() * 900000)}`;
}

function buildOwnerPasswordSetupUrl(oobCode, email) {
  const setupUrl = new URL(`${readAppBaseUrl()}/sifre-belirle`);
  setupUrl.searchParams.set("oobCode", oobCode);
  if (email) {
    setupUrl.searchParams.set("email", email);
  }
  return setupUrl.toString();
}

async function issueOwnerPasswordSetupLink(db, uid, email, createdBy) {
  const resetToken = await issuePasswordResetTokenLocally(db, {
    uid,
    email,
    createdBy,
  });
  return buildOwnerPasswordSetupUrl(resetToken.token, email);
}

async function resolveCompanyOwnerIdentity(companyId, fallbackEmail = null) {
  const pool = requirePlatformStore();
  const result = await pool.query(
    `
      SELECT
        cm.uid,
        COALESCE(au.email, $2) AS owner_email
      FROM company_members cm
      LEFT JOIN auth_users au ON au.uid = cm.uid
      WHERE cm.company_id = $1
        AND cm.role = 'owner'
        AND cm.status = 'active'
      ORDER BY cm.accepted_at ASC NULLS LAST, cm.created_at ASC NULLS LAST, cm.uid ASC
      LIMIT 1
    `,
    [companyId, fallbackEmail],
  );
  const row = result.rows[0] ?? null;
  if (!row) {
    return {
      ownerUid: null,
      ownerEmail: normalizeNullableText(fallbackEmail),
    };
  }

  return {
    ownerUid: normalizeNullableText(row.uid),
    ownerEmail: normalizeNullableText(row.owner_email) ?? normalizeNullableText(fallbackEmail),
  };
}

async function listPlatformCompaniesFromPostgres() {
  const pool = requirePlatformStore();
  const result = await pool.query(
    `
      SELECT
        c.company_id,
        c.name,
        c.status,
        c.vehicle_limit,
        c.created_at,
        owner.uid AS owner_uid,
        au.email AS owner_email,
        COUNT(DISTINCT cm.uid)::int AS member_count,
        COUNT(DISTINCT v.vehicle_id)::int AS vehicle_count,
        COUNT(DISTINCT r.route_id)::int AS route_count
      FROM companies c
      LEFT JOIN company_members owner
        ON owner.company_id = c.company_id
       AND owner.role = 'owner'
       AND owner.status = 'active'
      LEFT JOIN auth_users au ON au.uid = owner.uid
      LEFT JOIN company_members cm ON cm.company_id = c.company_id
      LEFT JOIN company_vehicles v ON v.company_id = c.company_id
      LEFT JOIN company_routes r ON r.company_id = c.company_id
      GROUP BY c.company_id, c.name, c.status, c.vehicle_limit, c.created_at, owner.uid, au.email
      ORDER BY c.created_at DESC, c.company_id ASC
    `,
  );

  return result.rows.map((row) => ({
    companyId: row.company_id,
    name: normalizeNullableText(row.name) ?? "(isimsiz)",
    status: assertCompanyStatus(normalizeNullableText(row.status)),
    ownerEmail: normalizeNullableText(row.owner_email),
    ownerUid: normalizeNullableText(row.owner_uid),
    vehicleLimit: normalizeFiniteNumber(row.vehicle_limit) ?? 0,
    vehicleCount: normalizeFiniteNumber(row.vehicle_count) ?? 0,
    memberCount: normalizeFiniteNumber(row.member_count) ?? 0,
    routeCount: normalizeFiniteNumber(row.route_count) ?? 0,
    createdAt: normalizeIsoString(row.created_at) ?? new Date().toISOString(),
  }));
}

async function getPlatformCompanyDetailFromPostgres(companyId) {
  const pool = requirePlatformStore();
  const company = await readCompanyFromPostgres(companyId);
  if (!company) {
    return null;
  }

  const [membersResult, vehiclesResult, routesResult] = await Promise.all([
    pool.query(
      `
        SELECT
          cm.uid,
          au.email,
          COALESCE(au.display_name, au.profile_data->>'name', au.email) AS display_name,
          cm.role,
          cm.status,
          COALESCE(cm.accepted_at, cm.created_at) AS joined_at
        FROM company_members cm
        LEFT JOIN auth_users au ON au.uid = cm.uid
        WHERE cm.company_id = $1
        ORDER BY COALESCE(cm.accepted_at, cm.created_at) ASC NULLS LAST, cm.uid ASC
      `,
      [companyId],
    ),
    pool.query(
      `
        SELECT
          vehicle_id,
          plate,
          brand,
          model,
          capacity,
          status
        FROM company_vehicles
        WHERE company_id = $1
        ORDER BY updated_at DESC, vehicle_id ASC
      `,
      [companyId],
    ),
    pool.query(
      `
        SELECT
          r.route_id,
          r.name,
          COALESCE(COUNT(s.stop_id), 0)::int AS stop_count,
          r.passenger_count,
          r.is_archived
        FROM company_routes r
        LEFT JOIN company_route_stops s ON s.route_id = r.route_id
        WHERE r.company_id = $1
        GROUP BY r.route_id, r.name, r.passenger_count, r.is_archived, r.updated_at
        ORDER BY r.updated_at DESC NULLS LAST, r.route_id ASC
      `,
      [companyId],
    ),
  ]);

  const members = membersResult.rows.map((row) => ({
    uid: row.uid,
    email: normalizeNullableText(row.email),
    displayName: normalizeNullableText(row.display_name),
    role: normalizeNullableText(row.role) ?? "member",
    status: normalizeNullableText(row.status) ?? "active",
    joinedAt: normalizeIsoString(row.joined_at) ?? new Date().toISOString(),
  }));

  const vehicles = vehiclesResult.rows.map((row) => ({
    vehicleId: row.vehicle_id,
    plate: normalizeNullableText(row.plate),
    brand: normalizeNullableText(row.brand),
    model: normalizeNullableText(row.model),
    capacity: normalizeFiniteNumber(row.capacity),
    status: normalizeNullableText(row.status) ?? "active",
  }));

  const routes = routesResult.rows.map((row) => ({
    routeId: row.route_id,
    name: normalizeNullableText(row.name) ?? "(isimsiz rota)",
    stopCount: normalizeFiniteNumber(row.stop_count) ?? 0,
    passengerCount: normalizeFiniteNumber(row.passenger_count) ?? 0,
    isArchived: row.is_archived === true,
  }));

  const ownerMember = members.find((member) => member.role === "owner") ?? null;
  return {
    companyId,
    name: company.name ?? "(isimsiz)",
    status: assertCompanyStatus(company.status),
    ownerEmail: ownerMember?.email ?? company.contactEmail ?? null,
    ownerUid: ownerMember?.uid ?? null,
    vehicleLimit: company.vehicleLimit ?? 0,
    createdAt: company.createdAt ?? new Date().toISOString(),
    members,
    vehicles,
    routes,
  };
}

async function deletePlatformCompanyFromPostgres(companyId) {
  const pool = requirePlatformStore();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `
        DELETE FROM route_srv_code_reservations
        WHERE route_id IN (
          SELECT route_id
          FROM company_routes
          WHERE company_id = $1
        )
      `,
      [companyId],
    );
    await client.query(`DELETE FROM company_active_trips WHERE company_id = $1`, [companyId]);
    await client.query(`DELETE FROM driver_location_history WHERE company_id = $1`, [companyId]);
    await client.query(`DELETE FROM company_trip_history WHERE company_id = $1`, [companyId]);
    await client.query(`DELETE FROM company_audit_logs WHERE company_id = $1`, [companyId]);
    await client.query(`DELETE FROM company_invites WHERE company_id = $1`, [companyId]);
    await client.query(`DELETE FROM company_driver_documents WHERE company_id = $1`, [companyId]);
    await client.query(`DELETE FROM company_route_driver_permissions WHERE company_id = $1`, [companyId]);
    await client.query(`DELETE FROM route_share_audit_events WHERE company_id = $1`, [companyId]);
    await client.query(`DELETE FROM route_announcements WHERE company_id = $1`, [companyId]);
    await client.query(`DELETE FROM trip_chat_messages WHERE company_id = $1`, [companyId]);
    await client.query(`DELETE FROM trip_chats WHERE company_id = $1`, [companyId]);
    await client.query(`DELETE FROM company_drivers WHERE company_id = $1`, [companyId]);
    await client.query(`DELETE FROM company_vehicles WHERE company_id = $1`, [companyId]);
    await client.query(`DELETE FROM company_members WHERE company_id = $1`, [companyId]);
    await client.query(`DELETE FROM company_routes WHERE company_id = $1`, [companyId]);
    await client.query(`DELETE FROM companies WHERE company_id = $1`, [companyId]);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => null);
    throw error;
  } finally {
    client.release();
  }
}

async function updatePlatformCompanyFields(companyId, patch) {
  const pool = requirePlatformStore();
  const existing = await readCompanyFromPostgres(companyId);
  if (!existing) {
    throw new HttpError(404, "not-found", "Sirket bulunamadi.");
  }

  const nextVehicleLimit =
    Object.prototype.hasOwnProperty.call(patch, "vehicleLimit") ? patch.vehicleLimit : existing.vehicleLimit;
  const nextStatus =
    Object.prototype.hasOwnProperty.call(patch, "status") ? patch.status : existing.status;
  const nowIso = new Date().toISOString();

  await pool.query(
    `
      UPDATE companies
      SET
        vehicle_limit = $2,
        status = $3,
        updated_at = $4::timestamptz
      WHERE company_id = $1
    `,
    [companyId, nextVehicleLimit, nextStatus, nowIso],
  );

  return {
    companyId,
    vehicleLimit: nextVehicleLimit,
    status: nextStatus,
    updatedAt: nowIso,
  };
}

export async function listPlatformCompanies(_db) {
  const items = await listPlatformCompaniesFromPostgres().catch(() => []);
  return { items: Array.isArray(items) ? items : [] };
}

export async function getPlatformCompanyDetail(_db, input) {
  const companyId = normalizeCompanyId(input?.companyId);
  const detail = await getPlatformCompanyDetailFromPostgres(companyId).catch(() => null);
  if (!detail) {
    throw new HttpError(404, "not-found", "Sirket bulunamadi.");
  }
  return detail;
}

export async function createPlatformCompany(db, actorUid, input) {
  requirePlatformStore();

  const companyName = normalizeCompanyName(input?.companyName);
  const ownerEmail = normalizeOwnerEmail(input?.ownerEmail);
  const vehicleLimit = normalizeVehicleLimit(input?.vehicleLimit ?? 10);
  const nowIso = new Date().toISOString();

  let ownerUid = "";
  const existingOwnerProfile = await findUserProfileByEmail(db, ownerEmail).catch(() => null);
  if (existingOwnerProfile?.uid) {
    ownerUid = existingOwnerProfile.uid;
  } else {
    const bootstrapPassword = generateBootstrapPassword();
    const createdUser = await createManagedUserLocally(db, {
      email: ownerEmail,
      password: bootstrapPassword,
    });
    ownerUid = createdUser.uid;
    await upsertAuthUserProfile(db, {
      uid: ownerUid,
      email: ownerEmail,
      displayName: null,
      emailVerified: false,
      providerData: [{ providerId: "password" }],
      signInProvider: "password",
    });
  }

  const companyId = randomUUID();
  const auditLog = stageCompanyAuditLogWrite(db, null, {
    companyId,
    actorUid,
    actorType: "platform_admin",
    eventType: "platform_company_created",
    targetType: "company",
    targetId: companyId,
    status: "success",
    reason: null,
    metadata: {
      ownerUid,
      ownerEmail,
      vehicleLimit,
    },
    requestId: createHash("sha256")
      .update(`createPlatformCompany:${actorUid}:${ownerUid}:${companyName}:${nowIso}`)
      .digest("hex")
      .slice(0, 24),
    createdAt: nowIso,
  });

  await syncCompanyWithOwnerMembershipToPostgres({
    companyId,
    uid: ownerUid,
    name: companyName,
    status: "active",
    billingStatus: "active",
    timezone: "Europe/Istanbul",
    countryCode: "TR",
    contactEmail: ownerEmail,
    contactPhone: null,
    vehicleLimit,
    createdBy: actorUid,
    createdAt: nowIso,
    updatedAt: nowIso,
  });
  await flushStagedCompanyAuditLog(auditLog).catch(() => false);

  const loginUrl = await issueOwnerPasswordSetupLink(db, ownerUid, ownerEmail, actorUid);
  return {
    companyId,
    ownerUid,
    ownerEmail,
    notificationSent: true,
    loginUrl,
    createdAt: nowIso,
  };
}

export async function setPlatformCompanyVehicleLimit(_db, input) {
  const companyId = normalizeCompanyId(input?.companyId);
  const vehicleLimit = normalizeVehicleLimit(input?.vehicleLimit);
  const updated = await updatePlatformCompanyFields(companyId, { vehicleLimit });
  return {
    companyId: updated.companyId,
    vehicleLimit: updated.vehicleLimit,
    updatedAt: updated.updatedAt,
  };
}

export async function setPlatformCompanyStatus(_db, input) {
  const companyId = normalizeCompanyId(input?.companyId);
  const status = normalizeNullableText(input?.status);
  if (status !== "active" && status !== "suspended") {
    throw new HttpError(400, "invalid-argument", "status active veya suspended olmalidir.");
  }

  const updated = await updatePlatformCompanyFields(companyId, { status });
  return {
    companyId: updated.companyId,
    status: updated.status,
    updatedAt: updated.updatedAt,
  };
}

export async function resetPlatformCompanyOwnerPassword(db, input) {
  const companyId = normalizeCompanyId(input?.companyId);
  const company = await readCompanyFromPostgres(companyId);
  if (!company) {
    throw new HttpError(404, "not-found", "Sirket bulunamadi.");
  }

  const ownerIdentity = await resolveCompanyOwnerIdentity(companyId, company.contactEmail);
  if (!ownerIdentity.ownerEmail) {
    throw new HttpError(404, "not-found", "Sirket sahibinin e-postasi bulunamadi.");
  }
  if (!ownerIdentity.ownerUid) {
    throw new HttpError(404, "not-found", "Sirket sahibi kullanici kimligi bulunamadi.");
  }

  const loginUrl = await issueOwnerPasswordSetupLink(
    db,
    ownerIdentity.ownerUid,
    ownerIdentity.ownerEmail,
    "platform_admin",
  );
  return {
    notificationSent: true,
    loginUrl,
  };
}

export async function deletePlatformCompany(_db, _unusedRealtimeStore, input) {
  const companyId = normalizeCompanyId(input?.companyId);
  const company = await readCompanyFromPostgres(companyId);
  if (!company) {
    throw new HttpError(404, "not-found", "Sirket bulunamadi.");
  }

  await deletePlatformCompanyFromPostgres(companyId).catch(() => false);
  return {
    companyId,
    deletedAt: new Date().toISOString(),
  };
}

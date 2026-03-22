import { getPostgresPool, isPostgresConfigured } from "./postgres.js";

const VALID_MEMBER_ROLES = new Set(["owner", "admin", "dispatcher", "viewer"]);
const VALID_MEMBER_STATUSES = new Set(["active", "invited", "suspended"]);

function toIsoString(value) {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }
  return null;
}

function normalizeMemberRole(value) {
  return typeof value === "string" && VALID_MEMBER_ROLES.has(value) ? value : null;
}

function normalizeMemberStatus(value) {
  return typeof value === "string" && VALID_MEMBER_STATUSES.has(value) ? value : null;
}

function normalizeCompanyStatus(value) {
  return value === "suspended" || value === "archived" ? value : "active";
}

function normalizeBillingStatus(value) {
  return value === "past_due" || value === "suspended_locked" ? value : "active";
}

function normalizeNullableText(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeVehicleLimit(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(1, Math.trunc(value));
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(1, Math.trunc(parsed));
    }
  }
  return null;
}

export function shouldUsePostgresCompanyStore() {
  return isPostgresConfigured();
}

export async function readCompanyFromPostgres(companyId) {
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
      SELECT
        company_id,
        name,
        legal_name,
        status,
        billing_status,
        billing_valid_until,
        timezone,
        country_code,
        contact_phone,
        contact_email,
        logo_url,
        address,
        vehicle_limit,
        created_by,
        created_at,
        updated_at
      FROM companies
      WHERE company_id = $1
      LIMIT 1
    `,
    [normalizedCompanyId],
  );
  const row = result.rows[0] ?? null;
  if (!row) {
    return null;
  }

  const name = normalizeNullableText(row.name);
  if (!name) {
    return null;
  }

  return {
    companyId: normalizedCompanyId,
    name,
    legalName: normalizeNullableText(row.legal_name),
    status: normalizeCompanyStatus(row.status),
    billingStatus: normalizeBillingStatus(row.billing_status),
    billingValidUntil: toIsoString(row.billing_valid_until),
    timezone: normalizeNullableText(row.timezone) ?? "Europe/Istanbul",
    countryCode: normalizeNullableText(row.country_code) ?? "TR",
    contactPhone: normalizeNullableText(row.contact_phone),
    contactEmail: normalizeNullableText(row.contact_email),
    logoUrl: normalizeNullableText(row.logo_url),
    address: normalizeNullableText(row.address),
    vehicleLimit: normalizeVehicleLimit(row.vehicle_limit) ?? 10,
    createdBy: normalizeNullableText(row.created_by),
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

export async function backfillCompanyFromFirestoreRecord(input) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  const companyId = normalizeNullableText(input?.companyId);
  const name = normalizeNullableText(input?.name);
  if (!companyId || !name) {
    return false;
  }

  const nowIso = toIsoString(input?.updatedAt) ?? new Date().toISOString();
  await pool.query(
    `
      INSERT INTO companies (
        company_id,
        name,
        legal_name,
        status,
        billing_status,
        billing_valid_until,
        timezone,
        country_code,
        contact_phone,
        contact_email,
        logo_url,
        address,
        vehicle_limit,
        created_by,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6::timestamptz, $7, $8, $9, $10, $11, $12, $13, $14, $15::timestamptz, $16::timestamptz
      )
      ON CONFLICT (company_id) DO UPDATE
      SET
        name = EXCLUDED.name,
        legal_name = COALESCE(EXCLUDED.legal_name, companies.legal_name),
        status = EXCLUDED.status,
        billing_status = EXCLUDED.billing_status,
        billing_valid_until = COALESCE(EXCLUDED.billing_valid_until, companies.billing_valid_until),
        timezone = COALESCE(EXCLUDED.timezone, companies.timezone),
        country_code = COALESCE(EXCLUDED.country_code, companies.country_code),
        contact_phone = COALESCE(EXCLUDED.contact_phone, companies.contact_phone),
        contact_email = COALESCE(EXCLUDED.contact_email, companies.contact_email),
        logo_url = COALESCE(EXCLUDED.logo_url, companies.logo_url),
        address = COALESCE(EXCLUDED.address, companies.address),
        vehicle_limit = COALESCE(EXCLUDED.vehicle_limit, companies.vehicle_limit),
        created_by = COALESCE(EXCLUDED.created_by, companies.created_by),
        updated_at = EXCLUDED.updated_at
    `,
    [
      companyId,
      name,
      normalizeNullableText(input?.legalName),
      normalizeCompanyStatus(input?.status),
      normalizeBillingStatus(input?.billingStatus),
      toIsoString(input?.billingValidUntil),
      normalizeNullableText(input?.timezone) ?? "Europe/Istanbul",
      normalizeNullableText(input?.countryCode) ?? "TR",
      normalizeNullableText(input?.contactPhone),
      normalizeNullableText(input?.contactEmail),
      normalizeNullableText(input?.logoUrl),
      normalizeNullableText(input?.address),
      normalizeVehicleLimit(input?.vehicleLimit),
      normalizeNullableText(input?.createdBy),
      toIsoString(input?.createdAt) ?? nowIso,
      nowIso,
    ],
  );

  return true;
}

export async function listMyCompaniesFromPostgres(uid) {
  const pool = getPostgresPool();
  if (!pool) {
    return [];
  }

  const result = await pool.query(
    `
      SELECT
        c.company_id,
        c.name,
        c.status AS company_status,
        c.billing_status,
        cm.role,
        cm.status AS member_status
      FROM company_members cm
      INNER JOIN companies c ON c.company_id = cm.company_id
      WHERE cm.uid = $1
      ORDER BY c.name ASC
    `,
    [uid],
  );

  return result.rows
    .map((row) => {
      const role = normalizeMemberRole(row?.role);
      const memberStatus = normalizeMemberStatus(row?.member_status);
      const companyId = normalizeNullableText(row?.company_id);
      const name = normalizeNullableText(row?.name);
      if (!companyId || !name || !role || !memberStatus) {
        return null;
      }

      return {
        companyId,
        name,
        role,
        memberStatus,
        companyStatus: normalizeCompanyStatus(row?.company_status),
        billingStatus: normalizeBillingStatus(row?.billing_status),
      };
    })
    .filter((item) => item !== null);
}

export async function listCompanyMembersFromPostgres(companyId, limit) {
  const pool = getPostgresPool();
  if (!pool) {
    return { companyExists: false, items: [] };
  }

  const companyResult = await pool.query(
    `SELECT company_id FROM companies WHERE company_id = $1 LIMIT 1`,
    [companyId],
  );
  if (companyResult.rowCount === 0) {
    return { companyExists: false, items: [] };
  }

  const memberLimit = Number.isFinite(limit) ? Math.max(1, Math.trunc(limit)) : 50;
  const result = await pool.query(
    `
      SELECT
        cm.uid,
        cm.role,
        cm.status AS member_status,
        au.display_name,
        au.email,
        COALESCE(au.profile_data->>'phone', NULL) AS phone,
        COALESCE(au.profile_data->>'name', NULL) AS fallback_name
      FROM company_members cm
      LEFT JOIN auth_users au ON au.uid = cm.uid
      WHERE cm.company_id = $1
      ORDER BY cm.created_at ASC
      LIMIT $2
    `,
    [companyId, memberLimit],
  );

  const items = result.rows
    .map((row) => {
      const uid = normalizeNullableText(row?.uid);
      const role = normalizeMemberRole(row?.role);
      const memberStatus = normalizeMemberStatus(row?.member_status);
      if (!uid || !role || !memberStatus) {
        return null;
      }

      const displayName =
        normalizeNullableText(row?.display_name) ??
        normalizeNullableText(row?.fallback_name) ??
        `Uye (${uid.slice(0, 6)})`;

      return {
        uid,
        displayName,
        email: normalizeNullableText(row?.email),
        phone: normalizeNullableText(row?.phone),
        role,
        memberStatus,
        companyId,
      };
    })
    .filter((item) => item !== null)
    .sort((left, right) => left.displayName.localeCompare(right.displayName, "tr"));

  return { companyExists: true, items };
}

export async function readCompanyMemberRoleFromPostgres(companyId, uid) {
  const pool = getPostgresPool();
  if (!pool) {
    return null;
  }

  const result = await pool.query(
    `
      SELECT role, status
      FROM company_members
      WHERE company_id = $1 AND uid = $2
      LIMIT 1
    `,
    [companyId, uid],
  );
  const row = result.rows[0] ?? null;
  if (!row) {
    return null;
  }

  const role = normalizeMemberRole(row.role);
  const memberStatus = normalizeMemberStatus(row.status);
  if (!role || memberStatus !== "active") {
    return null;
  }

  return role;
}

export async function assertCompanyMembersActiveFromPostgres(companyId, uids) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  const uniqueUids = Array.from(
    new Set(
      uids.filter((uid) => typeof uid === "string" && uid.trim().length > 0).map((uid) => uid.trim()),
    ),
  );
  if (uniqueUids.length === 0) {
    return true;
  }

  const result = await pool.query(
    `
      SELECT uid, status
      FROM company_members
      WHERE company_id = $1 AND uid = ANY($2::text[])
    `,
    [companyId, uniqueUids],
  );
  const byUid = new Map(result.rows.map((row) => [row.uid, normalizeMemberStatus(row.status)]));
  return uniqueUids.every((uid) => byUid.get(uid) === "active");
}

export async function syncCompanyWithOwnerMembershipToPostgres(input) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  const companyId = normalizeNullableText(input?.companyId);
  const uid = normalizeNullableText(input?.uid);
  const name = normalizeNullableText(input?.name);
  const createdBy = normalizeNullableText(input?.createdBy) ?? uid;
  const nowIso = normalizeNullableText(input?.updatedAt) ?? new Date().toISOString();
  if (!companyId || !uid || !name) {
    return false;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `
        INSERT INTO companies (
          company_id,
          name,
          legal_name,
          status,
          billing_status,
          billing_valid_until,
          timezone,
          country_code,
          contact_phone,
          contact_email,
          created_by,
          created_at,
          updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6::timestamptz, $7, $8, $9, $10, $11, $12::timestamptz, $13::timestamptz
        )
        ON CONFLICT (company_id) DO UPDATE
        SET
          name = EXCLUDED.name,
          legal_name = EXCLUDED.legal_name,
          status = EXCLUDED.status,
          billing_status = EXCLUDED.billing_status,
          billing_valid_until = EXCLUDED.billing_valid_until,
          timezone = EXCLUDED.timezone,
          country_code = EXCLUDED.country_code,
          contact_phone = EXCLUDED.contact_phone,
          contact_email = EXCLUDED.contact_email,
          created_by = EXCLUDED.created_by,
          updated_at = EXCLUDED.updated_at
      `,
      [
        companyId,
        name,
        normalizeNullableText(input?.legalName),
        normalizeCompanyStatus(input?.status),
        normalizeBillingStatus(input?.billingStatus),
        toIsoString(input?.billingValidUntil),
        normalizeNullableText(input?.timezone) ?? "Europe/Istanbul",
        normalizeNullableText(input?.countryCode) ?? "TR",
        normalizeNullableText(input?.contactPhone),
        normalizeNullableText(input?.contactEmail),
        createdBy,
        normalizeNullableText(input?.createdAt) ?? nowIso,
        nowIso,
      ],
    );

    await client.query(
      `
        INSERT INTO company_members (
          company_id,
          uid,
          role,
          status,
          permissions,
          invited_by,
          invited_at,
          accepted_at,
          company_name_snapshot,
          created_at,
          updated_at
        )
        VALUES (
          $1, $2, 'owner', 'active', NULL, NULL, NULL, $3::timestamptz, $4, $5::timestamptz, $6::timestamptz
        )
        ON CONFLICT (company_id, uid) DO UPDATE
        SET
          role = EXCLUDED.role,
          status = EXCLUDED.status,
          accepted_at = EXCLUDED.accepted_at,
          company_name_snapshot = EXCLUDED.company_name_snapshot,
          updated_at = EXCLUDED.updated_at
      `,
      [
        companyId,
        uid,
        nowIso,
        name,
        normalizeNullableText(input?.createdAt) ?? nowIso,
        nowIso,
      ],
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

export async function backfillCompanyMembershipFromFirestoreRecord(input) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  const companyId = normalizeNullableText(input?.companyId);
  const uid = normalizeNullableText(input?.uid);
  const role = normalizeMemberRole(input?.role);
  const memberStatus = normalizeMemberStatus(input?.status);
  if (!companyId || !uid || !role || !memberStatus) {
    return false;
  }

  await pool.query(
    `
      INSERT INTO company_members (
        company_id,
        uid,
        role,
        status,
        permissions,
        invited_by,
        invited_at,
        accepted_at,
        company_name_snapshot,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5::jsonb, $6, $7::timestamptz, $8::timestamptz, $9, $10::timestamptz, $11::timestamptz
      )
      ON CONFLICT (company_id, uid) DO UPDATE
      SET
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        permissions = EXCLUDED.permissions,
        invited_by = EXCLUDED.invited_by,
        invited_at = EXCLUDED.invited_at,
        accepted_at = EXCLUDED.accepted_at,
        company_name_snapshot = COALESCE(EXCLUDED.company_name_snapshot, company_members.company_name_snapshot),
        updated_at = EXCLUDED.updated_at
    `,
    [
      companyId,
      uid,
      role,
      memberStatus,
      input?.permissions == null ? "null" : JSON.stringify(input.permissions),
      normalizeNullableText(input?.invitedBy),
      toIsoString(input?.invitedAt),
      toIsoString(input?.acceptedAt),
      normalizeNullableText(input?.companyNameSnapshot),
      toIsoString(input?.createdAt) ?? new Date().toISOString(),
      toIsoString(input?.updatedAt) ?? new Date().toISOString(),
    ],
  );

  return true;
}

export async function syncCompanyMemberToPostgres(input) {
  const companyBackfilled = await backfillCompanyFromFirestoreRecord(input);
  const membershipBackfilled = await backfillCompanyMembershipFromFirestoreRecord(input);
  return companyBackfilled || membershipBackfilled;
}

export async function deleteCompanyMemberFromPostgres(companyId, uid) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  const normalizedCompanyId = normalizeNullableText(companyId);
  const normalizedUid = normalizeNullableText(uid);
  if (!normalizedCompanyId || !normalizedUid) {
    return false;
  }

  await pool.query(
    `
      DELETE FROM company_members
      WHERE company_id = $1 AND uid = $2
    `,
    [normalizedCompanyId, normalizedUid],
  );

  return true;
}

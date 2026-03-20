import { getPostgresPool, isPostgresConfigured } from "./postgres.js";

const VALID_INVITE_ROLES = new Set(["admin", "dispatcher", "viewer"]);
const VALID_INVITE_STATUSES = new Set(["pending", "accepted", "declined", "revoked"]);

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

function normalizeInviteRole(value) {
  return VALID_INVITE_ROLES.has(value ?? "") ? value : "viewer";
}

function normalizeInviteStatus(value) {
  return VALID_INVITE_STATUSES.has(value ?? "") ? value : "pending";
}

function normalizeEmailLowercase(value) {
  const normalized = normalizeNullableText(value);
  return normalized ? normalized.toLowerCase() : null;
}

function formatCompanyInviteRow(row) {
  const inviteId = normalizeNullableText(row?.invite_id);
  const companyId = normalizeNullableText(row?.company_id);
  const invitedEmail = normalizeNullableText(row?.invited_email);
  const companyName = normalizeNullableText(row?.company_name);
  if (!inviteId || !companyId || !invitedEmail) {
    return null;
  }

  return {
    inviteId,
    companyId,
    companyName: companyName ?? "",
    invitedUid: normalizeNullableText(row?.invited_uid) ?? "",
    invitedEmail,
    role: normalizeInviteRole(row?.role),
    status: normalizeInviteStatus(row?.status),
    invitedBy: normalizeNullableText(row?.invited_by),
    createdAt: normalizeIsoString(row?.created_at),
    updatedAt: normalizeIsoString(row?.updated_at),
    expiresAt: normalizeIsoString(row?.expires_at),
    acceptedAt: normalizeIsoString(row?.accepted_at),
    declinedAt: normalizeIsoString(row?.declined_at),
    revokedAt: normalizeIsoString(row?.revoked_at),
  };
}

async function readCompanyInviteSyncState(companyId) {
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
      SELECT member_invites_synced_at
      FROM companies
      WHERE company_id = $1
      LIMIT 1
    `,
    [normalizedCompanyId],
  );

  return result.rows[0] ?? null;
}

async function markCompanyInviteSyncState(queryable, companyId, syncedAt) {
  const normalizedCompanyId = normalizeNullableText(companyId);
  const normalizedSyncedAt = normalizeIsoString(syncedAt) ?? new Date().toISOString();
  if (!normalizedCompanyId) {
    return false;
  }

  const result = await queryable.query(
    `
      UPDATE companies
      SET member_invites_synced_at = $2::timestamptz,
          updated_at = GREATEST(updated_at, $2::timestamptz)
      WHERE company_id = $1
    `,
    [normalizedCompanyId, normalizedSyncedAt],
  );

  return result.rowCount > 0;
}

async function upsertCompanyInviteRow(queryable, input) {
  const inviteId = normalizeNullableText(input?.inviteId);
  const companyId = normalizeNullableText(input?.companyId);
  const invitedEmail = normalizeNullableText(input?.invitedEmail);
  if (!inviteId || !companyId || !invitedEmail) {
    return false;
  }

  const createdAt = normalizeIsoString(input?.createdAt) ?? new Date().toISOString();
  const updatedAt = normalizeIsoString(input?.updatedAt) ?? createdAt;
  await queryable.query(
    `
      INSERT INTO company_invites (
        invite_id,
        company_id,
        invited_uid,
        invited_email,
        invited_email_lowercase,
        role,
        status,
        invited_by,
        created_at,
        updated_at,
        expires_at,
        accepted_at,
        declined_at,
        revoked_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9::timestamptz, $10::timestamptz, $11::timestamptz, $12::timestamptz, $13::timestamptz, $14::timestamptz
      )
      ON CONFLICT (invite_id) DO UPDATE
      SET
        company_id = EXCLUDED.company_id,
        invited_uid = EXCLUDED.invited_uid,
        invited_email = EXCLUDED.invited_email,
        invited_email_lowercase = EXCLUDED.invited_email_lowercase,
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        invited_by = EXCLUDED.invited_by,
        created_at = COALESCE(company_invites.created_at, EXCLUDED.created_at),
        updated_at = EXCLUDED.updated_at,
        expires_at = EXCLUDED.expires_at,
        accepted_at = EXCLUDED.accepted_at,
        declined_at = EXCLUDED.declined_at,
        revoked_at = EXCLUDED.revoked_at
    `,
    [
      inviteId,
      companyId,
      normalizeNullableText(input?.invitedUid),
      invitedEmail,
      normalizeEmailLowercase(input?.invitedEmail) ?? invitedEmail.toLowerCase(),
      normalizeInviteRole(input?.role),
      normalizeInviteStatus(input?.status),
      normalizeNullableText(input?.invitedBy),
      createdAt,
      updatedAt,
      normalizeIsoString(input?.expiresAt),
      normalizeIsoString(input?.acceptedAt),
      normalizeIsoString(input?.declinedAt),
      normalizeIsoString(input?.revokedAt),
    ],
  );

  return true;
}

export function shouldUsePostgresCompanyInviteStore() {
  return isPostgresConfigured();
}

export async function isCompanyInvitesSyncedInPostgres(companyId) {
  const row = await readCompanyInviteSyncState(companyId);
  return Boolean(normalizeIsoString(row?.member_invites_synced_at));
}

export async function areMyPendingCompanyInvitesSyncedInPostgres(uid) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  const normalizedUid = normalizeNullableText(uid);
  if (!normalizedUid) {
    return false;
  }

  const result = await pool.query(
    `
      SELECT COUNT(*)::int AS missing_count
      FROM company_members cm
      INNER JOIN companies c ON c.company_id = cm.company_id
      WHERE cm.uid = $1
        AND cm.status = 'invited'
        AND c.member_invites_synced_at IS NULL
    `,
    [normalizedUid],
  );

  const missingCount = Number(result.rows[0]?.missing_count ?? 0);
  return missingCount === 0;
}

export async function listCompanyInvitesFromPostgres(companyId, limit) {
  const pool = getPostgresPool();
  if (!pool) {
    return [];
  }

  const normalizedCompanyId = normalizeNullableText(companyId);
  if (!normalizedCompanyId) {
    return [];
  }

  const inviteLimit = Number.isFinite(limit) ? Math.max(1, Math.trunc(limit)) : 100;
  const result = await pool.query(
    `
      SELECT
        ci.invite_id,
        ci.company_id,
        c.name AS company_name,
        ci.invited_uid,
        ci.invited_email,
        ci.role,
        ci.status,
        ci.invited_by,
        ci.created_at,
        ci.updated_at,
        ci.expires_at,
        ci.accepted_at,
        ci.declined_at,
        ci.revoked_at
      FROM company_invites ci
      INNER JOIN companies c ON c.company_id = ci.company_id
      WHERE ci.company_id = $1
      ORDER BY ci.created_at DESC, ci.invite_id DESC
      LIMIT $2
    `,
    [normalizedCompanyId, inviteLimit],
  );

  return result.rows.map(formatCompanyInviteRow).filter((item) => item !== null);
}

export async function listMyPendingCompanyInvitesFromPostgres(uid) {
  const pool = getPostgresPool();
  if (!pool) {
    return [];
  }

  const normalizedUid = normalizeNullableText(uid);
  if (!normalizedUid) {
    return [];
  }

  const result = await pool.query(
    `
      SELECT DISTINCT ON (cm.company_id)
        ci.invite_id,
        ci.company_id,
        c.name AS company_name,
        ci.invited_uid,
        ci.invited_email,
        ci.role,
        ci.status,
        ci.invited_by,
        ci.created_at,
        ci.updated_at,
        ci.expires_at,
        ci.accepted_at,
        ci.declined_at,
        ci.revoked_at
      FROM company_members cm
      INNER JOIN companies c ON c.company_id = cm.company_id
      INNER JOIN company_invites ci
        ON ci.company_id = cm.company_id
       AND ci.invited_uid = cm.uid
       AND ci.status = 'pending'
      WHERE cm.uid = $1
        AND cm.status = 'invited'
        AND c.member_invites_synced_at IS NOT NULL
      ORDER BY cm.company_id, ci.updated_at DESC, ci.created_at DESC, ci.invite_id DESC
    `,
    [normalizedUid],
  );

  return result.rows.map(formatCompanyInviteRow).filter((item) => item !== null);
}

export async function syncCompanyInvitesSnapshotForCompany(companyId, items, syncedAt) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  const normalizedCompanyId = normalizeNullableText(companyId);
  if (!normalizedCompanyId) {
    return false;
  }

  const normalizedItems = Array.isArray(items) ? items : [];
  const inviteIds = normalizedItems
    .map((item) => normalizeNullableText(item?.inviteId))
    .filter((item) => item !== null);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (inviteIds.length === 0) {
      await client.query(`DELETE FROM company_invites WHERE company_id = $1`, [normalizedCompanyId]);
    } else {
      await client.query(
        `
          DELETE FROM company_invites
          WHERE company_id = $1
            AND NOT (invite_id = ANY($2::text[]))
        `,
        [normalizedCompanyId, inviteIds],
      );
    }

    for (const item of normalizedItems) {
      await upsertCompanyInviteRow(client, item);
    }

    await markCompanyInviteSyncState(client, normalizedCompanyId, syncedAt);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => null);
    throw error;
  } finally {
    client.release();
  }
}

export async function syncCompanyInviteToPostgres(input) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  return upsertCompanyInviteRow(pool, input);
}

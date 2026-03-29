import { createHash, randomUUID } from "node:crypto";

import { findUserProfileByEmail, readUserProfileByUid } from "./auth-user-store.js";
import { flushStagedCompanyAuditLog, stageCompanyAuditLogWrite } from "./company-audit-store.js";
import {
  readCompanyInviteFromPostgres,
  listPendingCompanyInvitesForMemberFromPostgres,
  syncCompanyInviteToPostgres,
  touchCompanyInviteSyncState,
} from "./company-invite-store.js";
import {
  readCompanyFromPostgres,
  readCompanyMemberFromPostgres,
  deleteCompanyMemberFromPostgres,
  shouldUsePostgresCompanyStore,
  syncCompanyMemberToPostgres,
} from "./company-membership-store.js";
import { HttpError } from "./http.js";
import { asRecord, pickString } from "./runtime-value.js";

const COMPANY_MEMBER_ROLES = new Set(["owner", "admin", "dispatcher", "viewer"]);
const COMPANY_MEMBER_STATUSES = new Set(["active", "invited", "suspended"]);
const INVITE_MEMBER_ROLES = new Set(["admin", "dispatcher", "viewer"]);

function normalizeId(rawValue, fieldLabel) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }

  const value = rawValue.trim();
  if (!value || value.length > 128) {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }

  return value;
}

function normalizeEmail(rawValue) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", "email gecersiz.");
  }

  const value = rawValue.trim().toLowerCase();
  if (!value || value.length > 254 || !value.includes("@")) {
    throw new HttpError(400, "invalid-argument", "email gecersiz.");
  }

  return value;
}

function ensureMemberManageRole(actorRole) {
  if (actorRole === "owner" || actorRole === "admin") {
    return;
  }
  throw new HttpError(403, "permission-denied", "Bu islem icin member yonetim yetkisi gerekli.");
}

function assertMemberRole(value) {
  if (COMPANY_MEMBER_ROLES.has(value ?? "")) {
    return value;
  }
  throw new HttpError(412, "failed-precondition", "COMPANY_MEMBER_ROLE_INVALID");
}

function assertMemberStatus(value) {
  if (COMPANY_MEMBER_STATUSES.has(value ?? "")) {
    return value;
  }
  throw new HttpError(412, "failed-precondition", "COMPANY_MEMBER_STATUS_INVALID");
}

function normalizeInviteRole(value) {
  if (INVITE_MEMBER_ROLES.has(value ?? "")) {
    return value;
  }
  throw new HttpError(400, "invalid-argument", "role gecersiz.");
}

function normalizeMemberPatch(rawValue) {
  const record = asRecord(rawValue);
  if (!record) {
    throw new HttpError(400, "invalid-argument", "Gecerli bir patch govdesi bekleniyor.");
  }

  const patch = {};
  if (Object.prototype.hasOwnProperty.call(record, "role")) {
    patch.role = assertMemberRole(record.role);
  }
  if (Object.prototype.hasOwnProperty.call(record, "memberStatus")) {
    patch.memberStatus = assertMemberStatus(record.memberStatus);
  }
  if (Object.keys(patch).length === 0) {
    throw new HttpError(400, "invalid-argument", "En az bir patch alani gonderilmelidir.");
  }

  return patch;
}

function companySyncPayloadFromSnapshot(companyId, companyData) {
  return {
    companyId,
    name: pickString(companyData, "name"),
    legalName: pickString(companyData, "legalName"),
    status: pickString(companyData, "status"),
    billingStatus: pickString(companyData, "billingStatus"),
    timezone: pickString(companyData, "timezone"),
    countryCode: pickString(companyData, "countryCode"),
    contactPhone: pickString(companyData, "contactPhone"),
    contactEmail: pickString(companyData, "contactEmail"),
    createdBy: pickString(companyData, "createdBy"),
    createdAt: pickString(companyData, "createdAt"),
    updatedAt: pickString(companyData, "updatedAt"),
  };
}

async function syncCompanyMemberMutationToPostgres(input) {
  if (!shouldUsePostgresCompanyStore()) {
    return;
  }

  try {
    await syncCompanyMemberToPostgres(input);
  } catch (error) {
    console.warn(
      JSON.stringify({
        level: "warn",
        event: "postgres_company_member_sync_failed",
        companyId: input?.companyId ?? null,
        uid: input?.uid ?? null,
        message: error instanceof Error ? error.message : "unknown_error",
      }),
    );
  }
}

async function deleteCompanyMemberMutationFromPostgres(companyId, uid) {
  if (!shouldUsePostgresCompanyStore()) {
    return;
  }

  try {
    await deleteCompanyMemberFromPostgres(companyId, uid);
  } catch (error) {
    console.warn(
      JSON.stringify({
        level: "warn",
        event: "postgres_company_member_delete_failed",
        companyId,
        uid,
        message: error instanceof Error ? error.message : "unknown_error",
      }),
    );
  }
}

export async function inviteCompanyMember(db, actorUid, actorRole, input) {
  const companyId = normalizeId(input?.companyId, "companyId");
  const role = normalizeInviteRole(input?.role);
  ensureMemberManageRole(actorRole);
  if (actorRole === "admin" && role === "admin") {
    throw new HttpError(403, "permission-denied", "Admin rolunde kullanici admin daveti gonderemez.");
  }
  if (!shouldUsePostgresCompanyStore()) {
    throw new HttpError(412, "failed-precondition", "Company store hazir degil.");
  }

  const rawEmail = typeof input?.email === "string" ? input.email.trim() : "";
  const rawMemberUid = typeof input?.memberUid === "string" ? input.memberUid.trim() : "";

  let targetUser = null;
  let normalizedEmail = "";
  if (rawEmail) {
    normalizedEmail = normalizeEmail(rawEmail);
    targetUser = await findUserProfileByEmail(db, normalizedEmail);
  } else if (rawMemberUid) {
    targetUser = await readUserProfileByUid(db, rawMemberUid);
    normalizedEmail = normalizeEmail(targetUser?.email);
  } else {
    throw new HttpError(400, "invalid-argument", "email veya memberUid gereklidir.");
  }

  const targetUid = targetUser?.uid ?? "";
  if (!targetUid) {
    throw new HttpError(
      412,
      "failed-precondition",
      rawEmail
        ? "INVITE_EMAIL_NOT_FOUND: Bu e-posta ile kayitli kullanici bulunamadi."
        : "INVITE_MEMBER_NOT_FOUND: Bu uid ile kayitli kullanici bulunamadi.",
    );
  }
  if (!normalizedEmail) {
    throw new HttpError(
      412,
      "failed-precondition",
      "INVITE_MEMBER_EMAIL_MISSING: Davet gonderilecek kullanicinin e-postasi bulunamadi.",
    );
  }
  if (targetUid === actorUid) {
    throw new HttpError(412, "failed-precondition", "SELF_INVITE_FORBIDDEN");
  }

  const nowIso = new Date().toISOString();
  const expiresAtIso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const company = await readCompanyFromPostgres(companyId).catch(() => null);
  if (!company) {
    throw new HttpError(404, "not-found", "Firma bulunamadi.");
  }

  const existingMember = await readCompanyMemberFromPostgres(companyId, targetUid).catch(() => null);
  const companyName = company.name ?? "";
  let previousRole = null;
  let previousMemberStatus = null;
  if (existingMember) {
    previousRole = assertMemberRole(existingMember.role);
    previousMemberStatus = assertMemberStatus(existingMember.status);
    if (previousRole === "owner") {
      throw new HttpError(412, "failed-precondition", "OWNER_MEMBER_IMMUTABLE");
    }
    if (previousMemberStatus === "active") {
      throw new HttpError(409, "already-exists", "Bu kullanici zaten aktif company uyesi.");
    }
  }

  const inviteId = randomUUID();
  const auditLog = stageCompanyAuditLogWrite(db, null, {
    companyId,
    actorUid,
    actorType: "company_member",
    eventType: "company_member_invited",
    targetType: "company_member",
    targetId: targetUid,
    status: "success",
    reason: null,
    metadata: {
      actorRole,
      role,
      invitedEmail: normalizedEmail,
      previousRole,
      previousMemberStatus,
      expiresAt: expiresAtIso,
    },
    requestId: createHash("sha256")
      .update(`inviteCompanyMember:${actorUid}:${companyId}:${targetUid}:${nowIso}`)
      .digest("hex")
      .slice(0, 24),
    createdAt: nowIso,
  });

  const companySync = {
    ...companySyncPayloadFromSnapshot(companyId, company),
    uid: targetUid,
    role,
    status: "invited",
    invitedBy: actorUid,
    invitedAt: nowIso,
    acceptedAt: null,
    companyNameSnapshot: companyName,
    createdAt: existingMember?.createdAt ?? nowIso,
    updatedAt: nowIso,
  };
  await syncCompanyMemberMutationToPostgres(companySync);
  await syncCompanyInviteToPostgres({
    inviteId,
    companyId,
    invitedUid: targetUid,
    invitedEmail: normalizedEmail,
    role,
    status: "pending",
    invitedBy: actorUid,
    createdAt: nowIso,
    updatedAt: nowIso,
    expiresAt: expiresAtIso,
  }).catch(() => false);
  await touchCompanyInviteSyncState(companyId, nowIso).catch(() => false);
  await flushStagedCompanyAuditLog(auditLog).catch(() => false);

  return {
    companyId,
    inviteId,
    memberUid: targetUid,
    invitedEmail: normalizedEmail,
    role,
    status: "pending",
    expiresAt: expiresAtIso,
    createdAt: nowIso,
    auditLog,
    companySync,
  };
}

export async function updateCompanyMember(db, actorUid, actorRole, input) {
  const companyId = normalizeId(input?.companyId, "companyId");
  const memberUid = normalizeId(input?.memberUid, "memberUid");
  const patch = normalizeMemberPatch(input?.patch);
  ensureMemberManageRole(actorRole);
  if (!shouldUsePostgresCompanyStore()) {
    throw new HttpError(412, "failed-precondition", "Company store hazir degil.");
  }

  const [company, existingMember] = await Promise.all([
    readCompanyFromPostgres(companyId).catch(() => null),
    readCompanyMemberFromPostgres(companyId, memberUid).catch(() => null),
  ]);
  if (!company) {
    throw new HttpError(404, "not-found", "Firma bulunamadi.");
  }
  if (!existingMember) {
    throw new HttpError(404, "not-found", "Uye bulunamadi.");
  }

  const currentRole = assertMemberRole(existingMember.role);
  const currentMemberStatus = assertMemberStatus(existingMember.status);
  if (currentRole === "owner") {
    throw new HttpError(412, "failed-precondition", "OWNER_MEMBER_IMMUTABLE");
  }
  if (actorRole === "admin" && patch.role === "owner") {
    throw new HttpError(403, "permission-denied", "Admin owner rolune yukseltemez.");
  }
  if (memberUid === actorUid && patch.memberStatus === "suspended") {
    throw new HttpError(412, "failed-precondition", "Kendi hesabinizi askiya alamazsiniz.");
  }

  const nextRole = patch.role ?? currentRole;
  const nextMemberStatus = patch.memberStatus ?? currentMemberStatus;
  const changedFields = [];
  if (nextRole !== currentRole) changedFields.push("role");
  if (nextMemberStatus !== currentMemberStatus) changedFields.push("memberStatus");
  if (changedFields.length === 0) {
    throw new HttpError(400, "invalid-argument", "En az bir farkli patch alani gonderilmelidir.");
  }

  const nowIso = new Date().toISOString();
  const auditLog = stageCompanyAuditLogWrite(db, null, {
    companyId,
    actorUid,
    actorType: "company_member",
    eventType: "company_member_updated",
    targetType: "company_member",
    targetId: memberUid,
    status: "success",
    reason: null,
    metadata: {
      actorRole,
      changedFields,
      prevRole: currentRole,
      prevMemberStatus: currentMemberStatus,
      nextRole,
      nextMemberStatus,
    },
    requestId: createHash("sha256")
      .update(`updateCompanyMember:${actorUid}:${companyId}:${memberUid}:${nowIso}`)
      .digest("hex")
      .slice(0, 24),
    createdAt: nowIso,
  });

  const companySync = {
    ...companySyncPayloadFromSnapshot(companyId, company),
    uid: memberUid,
    role: nextRole,
    status: nextMemberStatus,
    invitedBy: existingMember.invitedBy,
    invitedAt: existingMember.invitedAt,
    acceptedAt:
      nextMemberStatus === "active" ? existingMember.acceptedAt ?? nowIso : existingMember.acceptedAt,
    companyNameSnapshot: company.name,
    createdAt: existingMember.createdAt,
    updatedAt: nowIso,
  };
  await syncCompanyMemberMutationToPostgres(companySync);
  await flushStagedCompanyAuditLog(auditLog).catch(() => false);

  return {
    companyId,
    memberUid,
    role: nextRole,
    memberStatus: nextMemberStatus,
    updatedAt: nowIso,
    auditLog,
    companySync,
  };
}

export async function removeCompanyMember(db, actorUid, actorRole, input) {
  const companyId = normalizeId(input?.companyId, "companyId");
  const memberUid = normalizeId(input?.memberUid, "memberUid");
  ensureMemberManageRole(actorRole);
  if (memberUid === actorUid) {
    throw new HttpError(412, "failed-precondition", "SELF_MEMBER_REMOVE_FORBIDDEN");
  }
  if (!shouldUsePostgresCompanyStore()) {
    throw new HttpError(412, "failed-precondition", "Company store hazir degil.");
  }

  const nowIso = new Date().toISOString();
  const [company, existingMember] = await Promise.all([
    readCompanyFromPostgres(companyId).catch(() => null),
    readCompanyMemberFromPostgres(companyId, memberUid).catch(() => null),
  ]);
  if (!company) {
    throw new HttpError(404, "not-found", "Firma bulunamadi.");
  }
  if (!existingMember) {
    throw new HttpError(404, "not-found", "Uye bulunamadi.");
  }

  const removedRole = assertMemberRole(existingMember.role);
  const removedMemberStatus = assertMemberStatus(existingMember.status);
  if (removedRole === "owner") {
    throw new HttpError(412, "failed-precondition", "OWNER_MEMBER_IMMUTABLE");
  }
  if (actorRole === "admin" && removedRole === "admin") {
    throw new HttpError(403, "permission-denied", "Admin rolundeki uye admin uyeyi cikarama.");
  }

  const auditLog = stageCompanyAuditLogWrite(db, null, {
    companyId,
    actorUid,
    actorType: "company_member",
    eventType: "company_member_removed",
    targetType: "company_member",
    targetId: memberUid,
    status: "success",
    reason: null,
    metadata: {
      actorRole,
      removedRole,
      removedMemberStatus,
    },
    requestId: createHash("sha256")
      .update(`removeCompanyMember:${actorUid}:${companyId}:${memberUid}:${nowIso}`)
      .digest("hex")
      .slice(0, 24),
    createdAt: nowIso,
  });

  const pendingInvites = await listPendingCompanyInvitesForMemberFromPostgres(companyId, memberUid).catch(
    () => [],
  );
  await deleteCompanyMemberMutationFromPostgres(companyId, memberUid);
  await Promise.all(
    pendingInvites.map((invite) =>
      syncCompanyInviteToPostgres({
        ...invite,
        status: "revoked",
        revokedAt: nowIso,
        updatedAt: nowIso,
      }).catch(() => false),
    ),
  );
  if (pendingInvites.length > 0) {
    await touchCompanyInviteSyncState(companyId, nowIso).catch(() => false);
  }
  await flushStagedCompanyAuditLog(auditLog).catch(() => false);

  return {
    companyId,
    memberUid,
    removedRole,
    removedMemberStatus,
    removed: true,
    removedAt: nowIso,
    auditLog,
  };
}

export async function revokeCompanyInvite(db, actorUid, actorRole, input) {
  const companyId = normalizeId(input?.companyId, "companyId");
  const inviteId = normalizeId(input?.inviteId, "inviteId");
  ensureMemberManageRole(actorRole);
  if (!shouldUsePostgresCompanyStore()) {
    throw new HttpError(412, "failed-precondition", "Company store hazir degil.");
  }

  const nowIso = new Date().toISOString();
  const [company, invite] = await Promise.all([
    readCompanyFromPostgres(companyId).catch(() => null),
    readCompanyInviteFromPostgres(companyId, inviteId).catch(() => null),
  ]);
  if (!company) {
    throw new HttpError(404, "not-found", "Firma bulunamadi.");
  }
  if (!invite) {
    throw new HttpError(404, "not-found", "Davet bulunamadi.");
  }

  const currentStatus = pickString(invite, "status");
  if (currentStatus !== "pending") {
    throw new HttpError(
      412,
      "failed-precondition",
      `INVITE_NOT_REVOCABLE: Davet durumu '${currentStatus}', sadece 'pending' iptal edilebilir.`,
    );
  }

  const invitedEmail = pickString(invite, "invitedEmail") ?? "";
  const invitedUid = pickString(invite, "invitedUid") ?? "";
  const rawRole = pickString(invite, "role");
  const role = rawRole === "admin" || rawRole === "dispatcher" ? rawRole : "viewer";

  let companySync = null;
  if (invitedUid) {
    const member = await readCompanyMemberFromPostgres(companyId, invitedUid).catch(() => null);
    if (member && pickString(member, "status") === "invited") {
      companySync = {
        ...companySyncPayloadFromSnapshot(companyId, company),
        uid: invitedUid,
        role,
        status: "suspended",
        invitedBy: member.invitedBy ?? pickString(invite, "invitedBy"),
        invitedAt: member.invitedAt ?? pickString(invite, "createdAt"),
        acceptedAt: null,
        companyNameSnapshot: company.name || null,
        createdAt: member.createdAt ?? nowIso,
        updatedAt: nowIso,
      };
      await syncCompanyMemberMutationToPostgres(companySync);
    }
  }

  const auditLog = stageCompanyAuditLogWrite(db, null, {
    companyId,
    actorUid,
    actorType: "company_member",
    eventType: "company_member_invite_revoked",
    targetType: "company_invite",
    targetId: inviteId,
    status: "success",
    reason: null,
    metadata: {
      actorRole,
      invitedEmail,
      invitedUid,
      role,
    },
    requestId: createHash("sha256")
      .update(`revokeCompanyInvite:${actorUid}:${companyId}:${inviteId}:${nowIso}`)
      .digest("hex")
      .slice(0, 24),
    createdAt: nowIso,
  });

  await syncCompanyInviteToPostgres({
    ...invite,
    status: "revoked",
    revokedAt: nowIso,
    updatedAt: nowIso,
  }).catch(() => false);
  await touchCompanyInviteSyncState(companyId, nowIso).catch(() => false);
  await flushStagedCompanyAuditLog(auditLog).catch(() => false);

  return {
    inviteId,
    companyId,
    companyName: company.name ?? "",
    invitedEmail,
    role,
    status: "revoked",
    revokedAt: nowIso,
    auditLog,
    companySync,
  };
}

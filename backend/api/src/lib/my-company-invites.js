import { createHash } from "node:crypto";

import { flushStagedCompanyAuditLog, stageCompanyAuditLogWrite } from "./company-audit-store.js";
import {
  listPendingCompanyInvitesForMemberFromPostgres,
  listMyPendingCompanyInvitesFromPostgres,
  syncCompanyInviteToPostgres,
  touchCompanyInviteSyncState,
} from "./company-invite-store.js";
import {
  readCompanyFromPostgres,
  readCompanyMemberFromPostgres,
  shouldUsePostgresCompanyStore,
  syncCompanyMemberToPostgres,
} from "./company-membership-store.js";
import { HttpError } from "./http.js";
import { pickString } from "./runtime-value.js";

const VALID_MEMBER_ROLES = new Set(["owner", "admin", "dispatcher", "viewer"]);
const VALID_MEMBER_STATUSES = new Set(["active", "invited", "suspended"]);

function normalizeCompanyId(rawValue) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", "companyId gecersiz.");
  }

  const companyId = rawValue.trim();
  if (!companyId || companyId.length > 128) {
    throw new HttpError(400, "invalid-argument", "companyId gecersiz.");
  }

  return companyId;
}

function assertMemberRole(value) {
  if (VALID_MEMBER_ROLES.has(value ?? "")) {
    return value;
  }
  throw new HttpError(412, "failed-precondition", "Sirket uye rolu gecersiz.");
}

function assertMemberStatus(value) {
  if (VALID_MEMBER_STATUSES.has(value ?? "")) {
    return value;
  }
  throw new HttpError(412, "failed-precondition", "Sirket uye durumu gecersiz.");
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

async function syncInviteMembershipToPostgres(input) {
  if (!shouldUsePostgresCompanyStore()) {
    return;
  }

  try {
    await syncCompanyMemberToPostgres(input);
  } catch (error) {
    console.warn(
      JSON.stringify({
        level: "warn",
        event: "postgres_invite_membership_sync_failed",
        companyId: input?.companyId ?? null,
        uid: input?.uid ?? null,
        message: error instanceof Error ? error.message : "unknown_error",
      }),
    );
  }
}

export async function listMyPendingCompanyInvites(_db, uid) {
  const invites = await listMyPendingCompanyInvitesFromPostgres(uid).catch(() => []);
  return { invites: Array.isArray(invites) ? invites : [] };
}

export async function acceptMyCompanyInvite(db, uid, input) {
  const companyId = normalizeCompanyId(input?.companyId);
  const nowIso = new Date().toISOString();

  const [company, member] = await Promise.all([
    readCompanyFromPostgres(companyId).catch(() => null),
    readCompanyMemberFromPostgres(companyId, uid).catch(() => null),
  ]);
  if (!company) {
    throw new HttpError(404, "not-found", "Firma bulunamadi.");
  }
  if (!member) {
    throw new HttpError(404, "not-found", "Bu firma icin bekleyen davet bulunamadi.");
  }

  const currentRole = assertMemberRole(member.role);
  const currentMemberStatus = assertMemberStatus(member.status);
  const companyName = company.name ?? companyId;
  const companyStatus = company.status ?? "active";
  const billingStatus = company.billingStatus ?? "active";
  const acceptedAt = member.acceptedAt ?? nowIso;

  if (currentMemberStatus === "active") {
    return {
      companyId,
      companyName,
      companyStatus,
      billingStatus,
      memberUid: uid,
      role: currentRole,
      memberStatus: "active",
      acceptedAt,
    };
  }
  if (currentMemberStatus !== "invited") {
    throw new HttpError(412, "failed-precondition", "Bekleyen davet bu durumda kabul edilemez.");
  }

  const auditLog = stageCompanyAuditLogWrite(db, null, {
    companyId,
    actorUid: uid,
    actorType: "company_member",
    eventType: "company_member_invite_accepted",
    targetType: "company_member",
    targetId: uid,
    status: "success",
    reason: null,
    metadata: {
      role: currentRole,
    },
    requestId: createHash("sha256")
      .update(`acceptCompanyInvite:${uid}:${companyId}:${nowIso}`)
      .digest("hex")
      .slice(0, 24),
    createdAt: nowIso,
  });

  const companySync = {
    ...companySyncPayloadFromSnapshot(companyId, company),
    uid,
    role: currentRole,
    status: "active",
    invitedBy: member.invitedBy,
    invitedAt: member.invitedAt,
    acceptedAt: nowIso,
    companyNameSnapshot: companyName,
    createdAt: member.createdAt,
    updatedAt: nowIso,
  };
  await syncInviteMembershipToPostgres(companySync);

  const pendingInvites = await listPendingCompanyInvitesForMemberFromPostgres(companyId, uid).catch(
    () => [],
  );
  await Promise.all(
    pendingInvites.map((invite) =>
      syncCompanyInviteToPostgres({
        ...invite,
        status: "accepted",
        acceptedAt: nowIso,
        updatedAt: nowIso,
      }).catch(() => false),
    ),
  );
  await touchCompanyInviteSyncState(companyId, nowIso).catch(() => false);
  await flushStagedCompanyAuditLog(auditLog).catch(() => false);

  return {
    companyId,
    companyName,
    companyStatus,
    billingStatus,
    memberUid: uid,
    role: currentRole,
    memberStatus: "active",
    acceptedAt: nowIso,
    auditLog,
    companySync,
  };
}

export async function declineMyCompanyInvite(db, uid, input) {
  const companyId = normalizeCompanyId(input?.companyId);
  const nowIso = new Date().toISOString();

  const [company, member] = await Promise.all([
    readCompanyFromPostgres(companyId).catch(() => null),
    readCompanyMemberFromPostgres(companyId, uid).catch(() => null),
  ]);
  if (!company) {
    throw new HttpError(404, "not-found", "Firma bulunamadi.");
  }
  if (!member) {
    throw new HttpError(404, "not-found", "Bu firma icin bekleyen davet bulunamadi.");
  }

  const currentRole = assertMemberRole(member.role);
  const currentMemberStatus = assertMemberStatus(member.status);
  const companyName = company.name ?? companyId;
  const companyStatus = company.status ?? "active";
  const billingStatus = company.billingStatus ?? "active";
  const declinedAt = member.updatedAt ?? nowIso;

  if (currentMemberStatus === "suspended") {
    return {
      companyId,
      companyName,
      companyStatus,
      billingStatus,
      memberUid: uid,
      role: currentRole,
      memberStatus: "suspended",
      declinedAt,
    };
  }
  if (currentMemberStatus !== "invited") {
    throw new HttpError(412, "failed-precondition", "Bekleyen davet bu durumda reddedilemez.");
  }

  const auditLog = stageCompanyAuditLogWrite(db, null, {
    companyId,
    actorUid: uid,
    actorType: "company_member",
    eventType: "company_member_invite_declined",
    targetType: "company_member",
    targetId: uid,
    status: "success",
    reason: null,
    metadata: {
      role: currentRole,
    },
    requestId: createHash("sha256")
      .update(`declineCompanyInvite:${uid}:${companyId}:${nowIso}`)
      .digest("hex")
      .slice(0, 24),
    createdAt: nowIso,
  });

  const companySync = {
    ...companySyncPayloadFromSnapshot(companyId, company),
    uid,
    role: currentRole,
    status: "suspended",
    invitedBy: member.invitedBy,
    invitedAt: member.invitedAt,
    acceptedAt: member.acceptedAt,
    companyNameSnapshot: companyName,
    createdAt: member.createdAt,
    updatedAt: nowIso,
  };
  await syncInviteMembershipToPostgres(companySync);

  const pendingInvites = await listPendingCompanyInvitesForMemberFromPostgres(companyId, uid).catch(
    () => [],
  );
  await Promise.all(
    pendingInvites.map((invite) =>
      syncCompanyInviteToPostgres({
        ...invite,
        status: "declined",
        declinedAt: nowIso,
        updatedAt: nowIso,
      }).catch(() => false),
    ),
  );
  await touchCompanyInviteSyncState(companyId, nowIso).catch(() => false);
  await flushStagedCompanyAuditLog(auditLog).catch(() => false);

  return {
    companyId,
    companyName,
    companyStatus,
    billingStatus,
    memberUid: uid,
    role: currentRole,
    memberStatus: "suspended",
    declinedAt: nowIso,
    auditLog,
    companySync,
  };
}

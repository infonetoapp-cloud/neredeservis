import { createHash, randomUUID } from "node:crypto";

import { findUserProfileByEmail, readUserProfileByUid } from "./auth-user-store.js";
import { flushStagedCompanyAuditLog, stageCompanyAuditLogWrite } from "./company-audit-store.js";
import { syncCompanyInvitesFromFirestore } from "./company-invite-postgres-sync.js";
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

function hasFirestoreDb(db) {
  return Boolean(db?.collection);
}

async function mirrorCompanyMemberStateToFirestore(db, input) {
  if (shouldUsePostgresCompanyStore() || !hasFirestoreDb(db)) {
    return false;
  }

  try {
    const companyRef = db.collection("companies").doc(input.companyId);
    const memberRef = companyRef.collection("members").doc(input.uid);
    const userMembershipRef = db
      .collection("users")
      .doc(input.uid)
      .collection("company_memberships")
      .doc(input.companyId);

    await Promise.all([
      memberRef.set(
        {
          companyId: input.companyId,
          uid: input.uid,
          role: input.role,
          status: input.status,
          permissions: input.permissions ?? null,
          invitedBy: input.invitedBy ?? null,
          invitedAt: input.invitedAt ?? null,
          acceptedAt: input.acceptedAt ?? null,
          declinedAt: input.declinedAt ?? null,
          updatedAt: input.updatedAt,
          createdAt: input.createdAt ?? input.updatedAt,
        },
        { merge: true },
      ),
      userMembershipRef.set(
        {
          companyId: input.companyId,
          uid: input.uid,
          role: input.role,
          status: input.status,
          companyName: input.companyName ?? null,
          companyStatus: input.companyStatus ?? "active",
          billingStatus: input.billingStatus ?? "active",
          invitedAt: input.invitedAt ?? null,
          acceptedAt: input.acceptedAt ?? null,
          declinedAt: input.declinedAt ?? null,
          updatedAt: input.updatedAt,
          createdAt: input.createdAt ?? input.updatedAt,
        },
        { merge: true },
      ),
    ]);
    return true;
  } catch (error) {
    console.warn(
      JSON.stringify({
        level: "warn",
        event: "firestore_company_member_mirror_failed",
        companyId: input?.companyId ?? null,
        uid: input?.uid ?? null,
        message: error instanceof Error ? error.message : "unknown_error",
      }),
    );
    return false;
  }
}

async function mirrorCompanyInviteToFirestore(db, input) {
  if (shouldUsePostgresCompanyStore() || !hasFirestoreDb(db)) {
    return false;
  }

  try {
    await db
      .collection("companies")
      .doc(input.companyId)
      .collection("member_invites")
      .doc(input.inviteId)
      .set(
        {
          companyId: input.companyId,
          inviteId: input.inviteId,
          invitedUid: input.invitedUid ?? null,
          invitedEmail: input.invitedEmail,
          role: input.role,
          status: input.status,
          invitedBy: input.invitedBy ?? null,
          createdAt: input.createdAt,
          updatedAt: input.updatedAt,
          expiresAt: input.expiresAt ?? null,
          acceptedAt: input.acceptedAt ?? null,
          declinedAt: input.declinedAt ?? null,
          revokedAt: input.revokedAt ?? null,
          revokedBy: input.revokedBy ?? null,
        },
        { merge: true },
      );
    return true;
  } catch (error) {
    console.warn(
      JSON.stringify({
        level: "warn",
        event: "firestore_company_invite_mirror_failed",
        companyId: input?.companyId ?? null,
        inviteId: input?.inviteId ?? null,
        message: error instanceof Error ? error.message : "unknown_error",
      }),
    );
    return false;
  }
}

async function mirrorCompanyMemberDeletionToFirestore(db, companyId, uid) {
  if (shouldUsePostgresCompanyStore() || !hasFirestoreDb(db)) {
    return false;
  }

  try {
    await Promise.all([
      db.collection("companies").doc(companyId).collection("members").doc(uid).delete().catch(() => null),
      db
        .collection("users")
        .doc(uid)
        .collection("company_memberships")
        .doc(companyId)
        .delete()
        .catch(() => null),
    ]);
    return true;
  } catch (error) {
    console.warn(
      JSON.stringify({
        level: "warn",
        event: "firestore_company_member_delete_mirror_failed",
        companyId,
        uid,
        message: error instanceof Error ? error.message : "unknown_error",
      }),
    );
    return false;
  }
}

async function mirrorPendingInvitesForMemberRevokedToFirestore(db, companyId, memberUid, actorUid, nowIso) {
  if (shouldUsePostgresCompanyStore() || !hasFirestoreDb(db)) {
    return false;
  }

  try {
    const snapshot = await db
      .collection("companies")
      .doc(companyId)
      .collection("member_invites")
      .where("invitedUid", "==", memberUid)
      .limit(50)
      .get()
      .catch(() => null);
    if (!snapshot?.docs?.length) {
      return true;
    }

    await Promise.all(
      snapshot.docs.map((documentSnapshot) => {
        const inviteData = asRecord(documentSnapshot.data()) ?? {};
        if (pickString(inviteData, "status") !== "pending") {
          return Promise.resolve();
        }

        return documentSnapshot.ref.set(
          {
            status: "revoked",
            revokedAt: nowIso,
            revokedBy: actorUid,
            updatedAt: nowIso,
          },
          { merge: true },
        );
      }),
    );
    return true;
  } catch (error) {
    console.warn(
      JSON.stringify({
        level: "warn",
        event: "firestore_company_invite_revoke_mirror_failed",
        companyId,
        uid: memberUid,
        message: error instanceof Error ? error.message : "unknown_error",
      }),
    );
    return false;
  }
}

export async function inviteCompanyMember(db, actorUid, actorRole, input) {
  const companyId = normalizeId(input?.companyId, "companyId");
  const role = normalizeInviteRole(input?.role);
  ensureMemberManageRole(actorRole);
  if (actorRole === "admin" && role === "admin") {
    throw new HttpError(403, "permission-denied", "Admin rolunde kullanici admin daveti gonderemez.");
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

  const companyRef = db.collection("companies").doc(companyId);
  const memberRef = companyRef.collection("members").doc(targetUid);
  const userMembershipRef = db
    .collection("users")
    .doc(targetUid)
    .collection("company_memberships")
    .doc(companyId);
  const inviteRef = companyRef.collection("member_invites").doc();
  const nowIso = new Date().toISOString();
  const expiresAtIso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  if (shouldUsePostgresCompanyStore()) {
    const company = await readCompanyFromPostgres(companyId).catch(() => null);
    if (!company) {
      throw new HttpError(404, "not-found", "Firma bulunamadi.");
    }

    const existingMember = await readCompanyMemberFromPostgres(companyId, targetUid).catch(() => null);
    const companyName = company.name ?? "";
    const companyStatus = company.status ?? "active";
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

    const inviteId =
      db?.collection?.("companies")?.doc?.(companyId)?.collection?.("member_invites")?.doc?.().id ??
      randomUUID();
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

    await mirrorCompanyMemberStateToFirestore(db, {
      companyId,
      uid: targetUid,
      role,
      status: "invited",
      permissions: null,
      invitedBy: actorUid,
      invitedAt: nowIso,
      acceptedAt: null,
      updatedAt: nowIso,
      createdAt: existingMember?.createdAt ?? nowIso,
      companyName,
      companyStatus,
      billingStatus: company.billingStatus,
    });
    await mirrorCompanyInviteToFirestore(db, {
      companyId,
      inviteId,
      invitedUid: targetUid,
      invitedEmail: normalizedEmail,
      role,
      status: "pending",
      invitedBy: actorUid,
      createdAt: nowIso,
      updatedAt: nowIso,
      expiresAt: expiresAtIso,
    });
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

  return db.runTransaction(async (transaction) => {
    const [companySnapshot, memberSnapshot] = await Promise.all([
      transaction.get(companyRef),
      transaction.get(memberRef),
    ]);
    if (!companySnapshot.exists) {
      throw new HttpError(404, "not-found", "Firma bulunamadi.");
    }

    const companyData = asRecord(companySnapshot.data()) ?? {};
    const companyName = pickString(companyData, "name");
    const companyStatus = pickString(companyData, "status") ?? "active";

    let previousRole = null;
    let previousMemberStatus = null;
    if (memberSnapshot.exists) {
      const memberData = asRecord(memberSnapshot.data()) ?? {};
      previousRole = assertMemberRole(pickString(memberData, "role"));
      previousMemberStatus = assertMemberStatus(pickString(memberData, "status"));
      if (previousRole === "owner") {
        throw new HttpError(412, "failed-precondition", "OWNER_MEMBER_IMMUTABLE");
      }
      if (previousMemberStatus === "active") {
        throw new HttpError(409, "already-exists", "Bu kullanici zaten aktif company uyesi.");
      }
    }

    const memberPatch = {
      companyId,
      uid: targetUid,
      role,
      status: "invited",
      permissions: null,
      invitedBy: actorUid,
      invitedAt: nowIso,
      acceptedAt: null,
      updatedAt: nowIso,
      ...(memberSnapshot.exists ? {} : { createdAt: nowIso }),
    };
    transaction.set(memberRef, memberPatch, { merge: true });
    transaction.set(
      userMembershipRef,
      {
        companyId,
        uid: targetUid,
        role,
        status: "invited",
        companyName: companyName ?? null,
        companyStatus,
        invitedAt: nowIso,
        acceptedAt: null,
        updatedAt: nowIso,
        createdAt: nowIso,
      },
      { merge: true },
    );
    transaction.set(inviteRef, {
      companyId,
      inviteId: inviteRef.id,
      invitedUid: targetUid,
      invitedEmail: normalizedEmail,
      role,
      status: "pending",
      invitedBy: actorUid,
      createdAt: nowIso,
      updatedAt: nowIso,
      expiresAt: expiresAtIso,
    });

    const auditLog = stageCompanyAuditLogWrite(db, transaction, {
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

    return {
      companyId,
      inviteId: inviteRef.id,
      memberUid: targetUid,
      invitedEmail: normalizedEmail,
      role,
      status: "pending",
      expiresAt: expiresAtIso,
      createdAt: nowIso,
      auditLog,
      companySync: {
        ...companySyncPayloadFromSnapshot(companyId, companyData),
        uid: targetUid,
        role,
        status: "invited",
        invitedBy: actorUid,
        invitedAt: nowIso,
        acceptedAt: null,
        companyNameSnapshot: companyName,
        updatedAt: nowIso,
      },
    };
  }).then(async (result) => {
    await syncCompanyMemberMutationToPostgres(result.companySync);
    await syncCompanyInvitesFromFirestore(db, result.companyId, result.createdAt).catch(() => false);
    await flushStagedCompanyAuditLog(result.auditLog).catch(() => false);
    return result;
  });
}

export async function updateCompanyMember(db, actorUid, actorRole, input) {
  const companyId = normalizeId(input?.companyId, "companyId");
  const memberUid = normalizeId(input?.memberUid, "memberUid");
  const patch = normalizeMemberPatch(input?.patch);
  ensureMemberManageRole(actorRole);

  const companyRef = db.collection("companies").doc(companyId);
  const memberRef = companyRef.collection("members").doc(memberUid);
  const userMembershipRef = db
    .collection("users")
    .doc(memberUid)
    .collection("company_memberships")
    .doc(companyId);
  const nowIso = new Date().toISOString();

  if (shouldUsePostgresCompanyStore()) {
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
      acceptedAt: nextMemberStatus === "active" ? existingMember.acceptedAt ?? nowIso : existingMember.acceptedAt,
      companyNameSnapshot: company.name,
      createdAt: existingMember.createdAt,
      updatedAt: nowIso,
    };
    await syncCompanyMemberMutationToPostgres(companySync);
    await mirrorCompanyMemberStateToFirestore(db, {
      companyId,
      uid: memberUid,
      role: nextRole,
      status: nextMemberStatus,
      permissions: existingMember.permissions,
      invitedBy: existingMember.invitedBy,
      invitedAt: existingMember.invitedAt,
      acceptedAt: companySync.acceptedAt,
      updatedAt: nowIso,
      createdAt: existingMember.createdAt,
      companyName: company.name,
      companyStatus: company.status,
      billingStatus: company.billingStatus,
    });
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

  return db.runTransaction(async (transaction) => {
    const [companySnapshot, memberSnapshot] = await Promise.all([
      transaction.get(companyRef),
      transaction.get(memberRef),
    ]);
    if (!companySnapshot.exists) {
      throw new HttpError(404, "not-found", "Firma bulunamadi.");
    }
    if (!memberSnapshot.exists) {
      throw new HttpError(404, "not-found", "Uye bulunamadi.");
    }

    const memberData = asRecord(memberSnapshot.data()) ?? {};
    const currentRole = assertMemberRole(pickString(memberData, "role"));
    const currentMemberStatus = assertMemberStatus(pickString(memberData, "status"));

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

    transaction.update(memberRef, {
      role: nextRole,
      status: nextMemberStatus,
      updatedAt: nowIso,
    });
    transaction.set(
      userMembershipRef,
      {
        companyId,
        uid: memberUid,
        role: nextRole,
        status: nextMemberStatus,
        updatedAt: nowIso,
      },
      { merge: true },
    );

    const auditLog = stageCompanyAuditLogWrite(db, transaction, {
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

    return {
      companyId,
      memberUid,
      role: nextRole,
      memberStatus: nextMemberStatus,
      updatedAt: nowIso,
      auditLog,
      companySync: {
        ...companySyncPayloadFromSnapshot(companyId, asRecord(companySnapshot.data()) ?? {}),
        uid: memberUid,
        role: nextRole,
        status: nextMemberStatus,
        invitedBy: pickString(memberData, "invitedBy"),
        invitedAt: pickString(memberData, "invitedAt"),
        acceptedAt:
          nextMemberStatus === "active"
            ? pickString(memberData, "acceptedAt") ?? nowIso
            : pickString(memberData, "acceptedAt"),
        companyNameSnapshot: pickString(asRecord(companySnapshot.data()) ?? {}, "name"),
        createdAt: pickString(memberData, "createdAt"),
        updatedAt: nowIso,
      },
    };
  }).then(async (result) => {
    await syncCompanyMemberMutationToPostgres(result.companySync);
    await flushStagedCompanyAuditLog(result.auditLog).catch(() => false);
    return result;
  });
}

export async function removeCompanyMember(db, actorUid, actorRole, input) {
  const companyId = normalizeId(input?.companyId, "companyId");
  const memberUid = normalizeId(input?.memberUid, "memberUid");
  ensureMemberManageRole(actorRole);
  if (memberUid === actorUid) {
    throw new HttpError(412, "failed-precondition", "SELF_MEMBER_REMOVE_FORBIDDEN");
  }

  const companyRef = db.collection("companies").doc(companyId);
  const memberRef = companyRef.collection("members").doc(memberUid);
  const userMembershipRef = db
    .collection("users")
    .doc(memberUid)
    .collection("company_memberships")
    .doc(companyId);
  const nowIso = new Date().toISOString();

  if (shouldUsePostgresCompanyStore()) {
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

    await mirrorCompanyMemberDeletionToFirestore(db, companyId, memberUid);
    await mirrorPendingInvitesForMemberRevokedToFirestore(db, companyId, memberUid, actorUid, nowIso);
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

  return db.runTransaction(async (transaction) => {
    const [companySnapshot, memberSnapshot] = await Promise.all([
      transaction.get(companyRef),
      transaction.get(memberRef),
    ]);
    if (!companySnapshot.exists) {
      throw new HttpError(404, "not-found", "Firma bulunamadi.");
    }
    if (!memberSnapshot.exists) {
      throw new HttpError(404, "not-found", "Uye bulunamadi.");
    }

    const memberData = asRecord(memberSnapshot.data()) ?? {};
    const removedRole = assertMemberRole(pickString(memberData, "role"));
    const removedMemberStatus = assertMemberStatus(pickString(memberData, "status"));
    if (removedRole === "owner") {
      throw new HttpError(412, "failed-precondition", "OWNER_MEMBER_IMMUTABLE");
    }
    if (actorRole === "admin" && removedRole === "admin") {
      throw new HttpError(403, "permission-denied", "Admin rolundeki uye admin uyeyi cikarama.");
    }

    transaction.delete(memberRef);
    transaction.delete(userMembershipRef);

    const invitesSnapshot = await transaction.get(
      companyRef.collection("member_invites").where("invitedUid", "==", memberUid).limit(50),
    );
    invitesSnapshot.docs.forEach((documentSnapshot) => {
      const inviteData = asRecord(documentSnapshot.data()) ?? {};
      if (pickString(inviteData, "status") !== "pending") {
        return;
      }
      transaction.set(
        documentSnapshot.ref,
        {
          status: "revoked",
          revokedAt: nowIso,
          revokedBy: actorUid,
          updatedAt: nowIso,
        },
        { merge: true },
      );
    });

    const auditLog = stageCompanyAuditLogWrite(db, transaction, {
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

    return {
      companyId,
      memberUid,
      removedRole,
      removedMemberStatus,
      removed: true,
      removedAt: nowIso,
      auditLog,
    };
  }).then(async (result) => {
    await deleteCompanyMemberMutationFromPostgres(result.companyId, result.memberUid);
    await syncCompanyInvitesFromFirestore(db, result.companyId, result.removedAt).catch(() => false);
    await flushStagedCompanyAuditLog(result.auditLog).catch(() => false);
    return result;
  });
}

export async function revokeCompanyInvite(db, actorUid, actorRole, input) {
  const companyId = normalizeId(input?.companyId, "companyId");
  const inviteId = normalizeId(input?.inviteId, "inviteId");
  ensureMemberManageRole(actorRole);

  const companyRef = db.collection("companies").doc(companyId);
  const inviteRef = companyRef.collection("member_invites").doc(inviteId);
  const nowIso = new Date().toISOString();

  if (shouldUsePostgresCompanyStore()) {
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

    if (companySync) {
      await mirrorCompanyMemberStateToFirestore(db, {
        companyId,
        uid: invitedUid,
        role,
        status: "suspended",
        permissions: null,
        invitedBy: companySync.invitedBy,
        invitedAt: companySync.invitedAt,
        acceptedAt: null,
        updatedAt: nowIso,
        createdAt: companySync.createdAt,
        companyName: company.name,
        companyStatus: company.status,
        billingStatus: company.billingStatus,
      });
    }
    await mirrorCompanyInviteToFirestore(db, {
      ...invite,
      companyId,
      inviteId,
      status: "revoked",
      revokedAt: nowIso,
      revokedBy: actorUid,
      updatedAt: nowIso,
    });
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

  return db.runTransaction(async (transaction) => {
    const [companySnapshot, inviteSnapshot] = await Promise.all([
      transaction.get(companyRef),
      transaction.get(inviteRef),
    ]);
    if (!companySnapshot.exists) {
      throw new HttpError(404, "not-found", "Firma bulunamadi.");
    }
    if (!inviteSnapshot.exists) {
      throw new HttpError(404, "not-found", "Davet bulunamadi.");
    }

    const companyData = asRecord(companySnapshot.data()) ?? {};
    const companyName = pickString(companyData, "name") ?? "";

    const inviteData = asRecord(inviteSnapshot.data()) ?? {};
    const currentStatus = pickString(inviteData, "status");
    if (currentStatus !== "pending") {
      throw new HttpError(
        412,
        "failed-precondition",
        `INVITE_NOT_REVOCABLE: Davet durumu '${currentStatus}', sadece 'pending' iptal edilebilir.`,
      );
    }

    const invitedEmail = pickString(inviteData, "invitedEmail") ?? "";
    const invitedUid = pickString(inviteData, "invitedUid") ?? "";
    const rawRole = pickString(inviteData, "role");
    const role = rawRole === "admin" || rawRole === "dispatcher" ? rawRole : "viewer";

    transaction.set(
      inviteRef,
      {
        status: "revoked",
        revokedAt: nowIso,
        revokedBy: actorUid,
        updatedAt: nowIso,
      },
      { merge: true },
    );

    if (invitedUid) {
      const memberRef = companyRef.collection("members").doc(invitedUid);
      const memberSnapshot = await transaction.get(memberRef);
      if (memberSnapshot.exists) {
        const memberData = asRecord(memberSnapshot.data()) ?? {};
        if (pickString(memberData, "status") === "invited") {
          transaction.set(
            memberRef,
            {
              status: "suspended",
              updatedAt: nowIso,
            },
            { merge: true },
          );
          const userMembershipRef = db
            .collection("users")
            .doc(invitedUid)
            .collection("company_memberships")
            .doc(companyId);
          transaction.set(
            userMembershipRef,
            {
              status: "suspended",
              updatedAt: nowIso,
            },
            { merge: true },
          );
        }
      }
    }

    const auditLog = stageCompanyAuditLogWrite(db, transaction, {
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

    return {
      inviteId,
      companyId,
      companyName,
      invitedEmail,
      role,
      status: "revoked",
      revokedAt: nowIso,
      auditLog,
      companySync: invitedUid
        ? {
            ...companySyncPayloadFromSnapshot(companyId, companyData),
            uid: invitedUid,
            role,
            status: "suspended",
            invitedBy: pickString(inviteData, "invitedBy"),
            invitedAt: pickString(inviteData, "createdAt"),
            acceptedAt: null,
            companyNameSnapshot: companyName || null,
            updatedAt: nowIso,
          }
        : null,
    };
  }).then(async (result) => {
    if (result.companySync) {
      await syncCompanyMemberMutationToPostgres(result.companySync);
    }
    await syncCompanyInvitesFromFirestore(db, result.companyId, result.revokedAt).catch(() => false);
    await flushStagedCompanyAuditLog(result.auditLog).catch(() => false);
    return result;
  });
}

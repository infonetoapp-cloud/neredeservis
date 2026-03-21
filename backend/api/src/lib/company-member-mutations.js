import { createHash } from "node:crypto";

import { findUserProfileByEmail, readUserProfileByUid } from "./auth-user-store.js";
import { flushStagedCompanyAuditLog, stageCompanyAuditLogWrite } from "./company-audit-store.js";
import { syncCompanyInvitesFromFirestore } from "./company-invite-postgres-sync.js";
import {
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

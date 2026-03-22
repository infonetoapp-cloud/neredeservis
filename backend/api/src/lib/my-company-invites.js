import { createHash } from "node:crypto";

import { flushStagedCompanyAuditLog, stageCompanyAuditLogWrite } from "./company-audit-store.js";
import { syncCompanyInvitesFromFirestore } from "./company-invite-postgres-sync.js";
import {
  areMyPendingCompanyInvitesSyncedInPostgres,
  listPendingCompanyInvitesForMemberFromPostgres,
  listMyPendingCompanyInvitesFromPostgres,
  shouldUsePostgresCompanyInviteStore,
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
import { asRecord, pickString } from "./runtime-value.js";

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

function resolveCompanyStatus(companyData) {
  const rawStatus = pickString(companyData, "status");
  return rawStatus === "suspended" || rawStatus === "archived" ? rawStatus : "active";
}

function resolveBillingStatus(companyData) {
  const rawStatus = pickString(companyData, "billingStatus");
  return rawStatus === "past_due" || rawStatus === "suspended_locked" ? rawStatus : "active";
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

function hasFirestoreDb(db) {
  return Boolean(db?.collection);
}

async function mirrorInviteMembershipStateToFirestore(db, input) {
  if (!hasFirestoreDb(db)) {
    return false;
  }

  try {
    const companyRef = db.collection("companies").doc(input.companyId);
    const memberRef = companyRef.collection("members").doc(input.uid);
    const userMembershipRef = db.collection("users").doc(input.uid).collection("company_memberships").doc(input.companyId);
    await Promise.all([
      memberRef.set(
        {
          companyId: input.companyId,
          uid: input.uid,
          role: input.role,
          status: input.status,
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
          companyName: input.companyName,
          companyStatus: input.companyStatus,
          billingStatus: input.billingStatus,
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
        event: "firestore_my_company_invite_membership_mirror_failed",
        companyId: input?.companyId ?? null,
        uid: input?.uid ?? null,
        message: error instanceof Error ? error.message : "unknown_error",
      }),
    );
    return false;
  }
}

async function mirrorInviteStatusToFirestore(db, input) {
  if (!hasFirestoreDb(db)) {
    return false;
  }

  try {
    await Promise.all(
      (Array.isArray(input?.invites) ? input.invites : []).map((invite) =>
        db
          .collection("companies")
          .doc(input.companyId)
          .collection("member_invites")
          .doc(invite.inviteId)
          .set(
            {
              status: invite.status,
              acceptedAt: invite.acceptedAt ?? null,
              declinedAt: invite.declinedAt ?? null,
              acceptedBy: invite.acceptedBy ?? null,
              declinedBy: invite.declinedBy ?? null,
              updatedAt: invite.updatedAt,
            },
            { merge: true },
          ),
      ),
    );
    return true;
  } catch (error) {
    console.warn(
      JSON.stringify({
        level: "warn",
        event: "firestore_my_company_invite_status_mirror_failed",
        companyId: input?.companyId ?? null,
        uid: input?.uid ?? null,
        message: error instanceof Error ? error.message : "unknown_error",
      }),
    );
    return false;
  }
}

export async function listMyPendingCompanyInvites(db, uid) {
  if (shouldUsePostgresCompanyInviteStore()) {
    const invitesSynced = await areMyPendingCompanyInvitesSyncedInPostgres(uid).catch(() => false);
    if (invitesSynced) {
      const invites = await listMyPendingCompanyInvitesFromPostgres(uid).catch(() => null);
      if (invites) {
        return { invites };
      }
    }
  }

  const membershipSnapshot = await db
    .collection("users")
    .doc(uid)
    .collection("company_memberships")
    .get();

  if (membershipSnapshot.empty) {
    return { invites: [] };
  }

  const invitedMemberships = membershipSnapshot.docs
    .map((documentSnapshot) => {
      const membershipData = asRecord(documentSnapshot.data()) ?? {};
      const companyId = pickString(membershipData, "companyId") ?? documentSnapshot.id;
      const memberStatus =
        pickString(membershipData, "status") ?? pickString(membershipData, "memberStatus");
      if (!companyId || memberStatus !== "invited") {
        return null;
      }

      return {
        companyId,
        companyNameSnapshot: pickString(membershipData, "companyName"),
      };
    })
    .filter((item) => item !== null);

  if (invitedMemberships.length === 0) {
    return { invites: [] };
  }

  const invites = [];
  for (const membership of invitedMemberships) {
    const companyRef = db.collection("companies").doc(membership.companyId);
    const [companySnapshot, inviteSnapshot] = await Promise.all([
      companyRef.get(),
      companyRef.collection("member_invites").where("invitedUid", "==", uid).limit(50).get(),
    ]);

    if (!companySnapshot.exists) {
      continue;
    }

    const companyData = asRecord(companySnapshot.data()) ?? {};
    const companyName = pickString(companyData, "name") ?? membership.companyNameSnapshot;
    if (!companyName) {
      continue;
    }

    const pendingInvite = inviteSnapshot.docs
      .map((documentSnapshot) => {
        const inviteData = asRecord(documentSnapshot.data()) ?? {};
        const inviteId = pickString(inviteData, "inviteId") ?? documentSnapshot.id;
        const email = pickString(inviteData, "invitedEmail");
        const role = pickString(inviteData, "role");
        const status = pickString(inviteData, "status");
        if (!inviteId || !email || !VALID_MEMBER_ROLES.has(role ?? "") || status !== "pending") {
          return null;
        }

        return {
          inviteId,
          companyId: membership.companyId,
          companyName,
          email,
          role,
          status: "pending",
          targetUid: pickString(inviteData, "invitedUid") ?? uid,
          invitedBy: pickString(inviteData, "invitedBy"),
          createdAt: pickString(inviteData, "createdAt"),
          updatedAt: pickString(inviteData, "updatedAt"),
        };
      })
      .filter((item) => item !== null)
      .sort((left, right) => {
        const leftTime = left.updatedAt ?? left.createdAt ?? "";
        const rightTime = right.updatedAt ?? right.createdAt ?? "";
        return rightTime.localeCompare(leftTime);
      })[0];

    if (pendingInvite) {
      invites.push(pendingInvite);
    }
  }

  invites.sort((left, right) => left.companyName.localeCompare(right.companyName, "tr"));

  if (shouldUsePostgresCompanyInviteStore()) {
    const companyIds = Array.from(new Set(invites.map((invite) => invite.companyId).filter(Boolean)));
    await Promise.all(
      companyIds.map((companyId) =>
        syncCompanyInvitesFromFirestore(db, companyId, new Date().toISOString()).catch(() => false),
      ),
    );
  }

  return { invites };
}

export async function acceptMyCompanyInvite(db, uid, input) {
  const companyId = normalizeCompanyId(input?.companyId);
  const companyRef = db.collection("companies").doc(companyId);
  const memberRef = companyRef.collection("members").doc(uid);
  const userMembershipRef = db.collection("users").doc(uid).collection("company_memberships").doc(companyId);
  const nowIso = new Date().toISOString();

  if (shouldUsePostgresCompanyStore()) {
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

    await mirrorInviteMembershipStateToFirestore(db, {
      companyId,
      uid,
      role: currentRole,
      status: "active",
      invitedBy: member.invitedBy,
      invitedAt: member.invitedAt,
      acceptedAt: nowIso,
      updatedAt: nowIso,
      createdAt: member.createdAt ?? nowIso,
      companyName,
      companyStatus,
      billingStatus,
    });
    await mirrorInviteStatusToFirestore(db, {
      companyId,
      uid,
      invites: pendingInvites.map((invite) => ({
        inviteId: invite.inviteId,
        status: "accepted",
        acceptedAt: nowIso,
        acceptedBy: uid,
        updatedAt: nowIso,
      })),
    });
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

  return db.runTransaction(async (transaction) => {
    const [companySnapshot, memberSnapshot] = await Promise.all([
      transaction.get(companyRef),
      transaction.get(memberRef),
    ]);

    if (!companySnapshot.exists) {
      throw new HttpError(404, "not-found", "Firma bulunamadi.");
    }
    if (!memberSnapshot.exists) {
      throw new HttpError(404, "not-found", "Bu firma icin bekleyen davet bulunamadi.");
    }

    const companyData = asRecord(companySnapshot.data()) ?? {};
    const memberData = asRecord(memberSnapshot.data()) ?? {};
    const currentRole = assertMemberRole(pickString(memberData, "role"));
    const currentMemberStatus = assertMemberStatus(pickString(memberData, "status"));
    const companyName = pickString(companyData, "name") ?? companyId;
    const companyStatus = resolveCompanyStatus(companyData);
    const billingStatus = resolveBillingStatus(companyData);
    const acceptedAt = pickString(memberData, "acceptedAt") ?? nowIso;

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

    transaction.set(
      memberRef,
      {
        status: "active",
        acceptedAt: nowIso,
        updatedAt: nowIso,
      },
      { merge: true },
    );
    transaction.set(
      userMembershipRef,
      {
        companyId,
        uid,
        role: currentRole,
        status: "active",
        companyName,
        companyStatus,
        billingStatus,
        acceptedAt: nowIso,
        updatedAt: nowIso,
        createdAt: nowIso,
      },
      { merge: true },
    );

    const invitesSnapshot = await transaction.get(
      companyRef.collection("member_invites").where("invitedUid", "==", uid).limit(50),
    );
    invitesSnapshot.docs.forEach((documentSnapshot) => {
      const inviteData = asRecord(documentSnapshot.data()) ?? {};
      if (pickString(inviteData, "status") !== "pending") {
        return;
      }

      transaction.set(
        documentSnapshot.ref,
        {
          status: "accepted",
          acceptedAt: nowIso,
          acceptedBy: uid,
          updatedAt: nowIso,
        },
        { merge: true },
      );
    });

    const auditLog = stageCompanyAuditLogWrite(db, transaction, {
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
      companySync: {
        ...companySyncPayloadFromSnapshot(companyId, companyData),
        uid,
        role: currentRole,
        status: "active",
        invitedBy: null,
        invitedAt: pickString(memberData, "invitedAt"),
        acceptedAt: nowIso,
        companyNameSnapshot: companyName,
        createdAt: pickString(memberData, "createdAt"),
        updatedAt: nowIso,
      },
    };
  }).then(async (result) => {
    await syncInviteMembershipToPostgres(result.companySync);
    await syncCompanyInvitesFromFirestore(db, result.companyId, result.acceptedAt).catch(() => false);
    await flushStagedCompanyAuditLog(result.auditLog).catch(() => false);
    return result;
  });
}

export async function declineMyCompanyInvite(db, uid, input) {
  const companyId = normalizeCompanyId(input?.companyId);
  const companyRef = db.collection("companies").doc(companyId);
  const memberRef = companyRef.collection("members").doc(uid);
  const userMembershipRef = db.collection("users").doc(uid).collection("company_memberships").doc(companyId);
  const nowIso = new Date().toISOString();

  if (shouldUsePostgresCompanyStore()) {
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

    await mirrorInviteMembershipStateToFirestore(db, {
      companyId,
      uid,
      role: currentRole,
      status: "suspended",
      invitedBy: member.invitedBy,
      invitedAt: member.invitedAt,
      acceptedAt: member.acceptedAt,
      declinedAt: nowIso,
      updatedAt: nowIso,
      createdAt: member.createdAt ?? nowIso,
      companyName,
      companyStatus,
      billingStatus,
    });
    await mirrorInviteStatusToFirestore(db, {
      companyId,
      uid,
      invites: pendingInvites.map((invite) => ({
        inviteId: invite.inviteId,
        status: "declined",
        declinedAt: nowIso,
        declinedBy: uid,
        updatedAt: nowIso,
      })),
    });
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

  return db.runTransaction(async (transaction) => {
    const [companySnapshot, memberSnapshot] = await Promise.all([
      transaction.get(companyRef),
      transaction.get(memberRef),
    ]);

    if (!companySnapshot.exists) {
      throw new HttpError(404, "not-found", "Firma bulunamadi.");
    }
    if (!memberSnapshot.exists) {
      throw new HttpError(404, "not-found", "Bu firma icin bekleyen davet bulunamadi.");
    }

    const companyData = asRecord(companySnapshot.data()) ?? {};
    const memberData = asRecord(memberSnapshot.data()) ?? {};
    const currentRole = assertMemberRole(pickString(memberData, "role"));
    const currentMemberStatus = assertMemberStatus(pickString(memberData, "status"));
    const companyName = pickString(companyData, "name") ?? companyId;
    const companyStatus = resolveCompanyStatus(companyData);
    const billingStatus = resolveBillingStatus(companyData);
    const declinedAt =
      pickString(memberData, "declinedAt") ?? pickString(memberData, "updatedAt") ?? nowIso;

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

    transaction.set(
      memberRef,
      {
        status: "suspended",
        declinedAt: nowIso,
        updatedAt: nowIso,
      },
      { merge: true },
    );
    transaction.set(
      userMembershipRef,
      {
        companyId,
        uid,
        role: currentRole,
        status: "suspended",
        companyName,
        companyStatus,
        billingStatus,
        declinedAt: nowIso,
        updatedAt: nowIso,
        createdAt: nowIso,
      },
      { merge: true },
    );

    const invitesSnapshot = await transaction.get(
      companyRef.collection("member_invites").where("invitedUid", "==", uid).limit(50),
    );
    invitesSnapshot.docs.forEach((documentSnapshot) => {
      const inviteData = asRecord(documentSnapshot.data()) ?? {};
      if (pickString(inviteData, "status") !== "pending") {
        return;
      }

      transaction.set(
        documentSnapshot.ref,
        {
          status: "declined",
          declinedAt: nowIso,
          declinedBy: uid,
          updatedAt: nowIso,
        },
        { merge: true },
      );
    });

    const auditLog = stageCompanyAuditLogWrite(db, transaction, {
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
      companySync: {
        ...companySyncPayloadFromSnapshot(companyId, companyData),
        uid,
        role: currentRole,
        status: "suspended",
        invitedBy: null,
        invitedAt: pickString(memberData, "invitedAt"),
        acceptedAt: pickString(memberData, "acceptedAt"),
        companyNameSnapshot: companyName,
        createdAt: pickString(memberData, "createdAt"),
        updatedAt: nowIso,
      },
    };
  }).then(async (result) => {
    await syncInviteMembershipToPostgres(result.companySync);
    await syncCompanyInvitesFromFirestore(db, result.companyId, result.declinedAt).catch(() => false);
    await flushStagedCompanyAuditLog(result.auditLog).catch(() => false);
    return result;
  });
}

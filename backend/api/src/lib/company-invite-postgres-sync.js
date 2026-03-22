import { backfillCompanyFromFirestoreRecord } from "./company-membership-store.js";
import {
  shouldUsePostgresCompanyInviteStore,
  syncCompanyInvitesSnapshotForCompany,
} from "./company-invite-store.js";
import { asRecord, pickFiniteNumber, pickString } from "./runtime-value.js";

export function buildCompanyInviteProjection(companyId, companyName, inviteId, inviteData) {
  const resolvedInviteId = pickString(inviteData, "inviteId") ?? inviteId;
  const invitedEmail = pickString(inviteData, "invitedEmail");
  if (!companyId || !resolvedInviteId || !invitedEmail) {
    return null;
  }

  return {
    inviteId: resolvedInviteId,
    companyId,
    companyName,
    invitedUid: pickString(inviteData, "invitedUid"),
    invitedEmail,
    role: pickString(inviteData, "role"),
    status: pickString(inviteData, "status"),
    invitedBy: pickString(inviteData, "invitedBy"),
    createdAt: pickString(inviteData, "createdAt"),
    updatedAt: pickString(inviteData, "updatedAt"),
    expiresAt: pickString(inviteData, "expiresAt"),
    acceptedAt: pickString(inviteData, "acceptedAt"),
    declinedAt: pickString(inviteData, "declinedAt"),
    revokedAt: pickString(inviteData, "revokedAt"),
  };
}

async function backfillCompanyRecordFromSnapshot(companyId, companySnapshot) {
  if (!companySnapshot?.exists) {
    return false;
  }

  const companyData = asRecord(companySnapshot.data()) ?? {};
  return backfillCompanyFromFirestoreRecord({
    companyId,
    name: pickString(companyData, "name"),
    legalName: pickString(companyData, "legalName"),
    status: pickString(companyData, "status"),
    billingStatus: pickString(companyData, "billingStatus"),
    timezone: pickString(companyData, "timezone"),
    countryCode: pickString(companyData, "countryCode"),
    contactPhone: pickString(companyData, "contactPhone"),
    contactEmail: pickString(companyData, "contactEmail"),
    logoUrl: pickString(companyData, "logoUrl"),
    address: pickString(companyData, "address"),
    vehicleLimit: pickFiniteNumber(companyData, "vehicleLimit"),
    createdBy: pickString(companyData, "createdBy"),
    createdAt: pickString(companyData, "createdAt"),
    updatedAt: pickString(companyData, "updatedAt"),
  });
}

export async function syncCompanyInvitesFromFirestore(db, companyId, syncedAt) {
  if (!shouldUsePostgresCompanyInviteStore() || !db?.collection) {
    return false;
  }

  const companyRef = db.collection("companies").doc(companyId);
  const [companySnapshot, invitesSnapshot] = await Promise.all([
    companyRef.get(),
    companyRef.collection("member_invites").get(),
  ]);

  if (!companySnapshot.exists) {
    return false;
  }

  const companyData = asRecord(companySnapshot.data()) ?? {};
  const companyName = pickString(companyData, "name") ?? "";
  await backfillCompanyRecordFromSnapshot(companyId, companySnapshot).catch(() => false);

  const inviteItems = invitesSnapshot.docs
    .map((documentSnapshot) =>
      buildCompanyInviteProjection(
        companyId,
        companyName,
        documentSnapshot.id,
        asRecord(documentSnapshot.data()) ?? {},
      ),
    )
    .filter((item) => item !== null);

  await syncCompanyInvitesSnapshotForCompany(companyId, inviteItems, syncedAt ?? new Date().toISOString());
  return true;
}

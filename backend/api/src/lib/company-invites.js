import {
  listCompanyInvitesFromPostgres,
  shouldUsePostgresCompanyInviteStore,
} from "./company-invite-store.js";
import { readCompanyFromPostgres } from "./company-membership-store.js";
import { HttpError } from "./http.js";
import { asRecord, pickString } from "./runtime-value.js";

export async function listCompanyInvites(db, input) {
  const inviteLimit = Number.isFinite(input.limit) ? Math.max(1, Math.trunc(input.limit)) : 100;
  if (shouldUsePostgresCompanyInviteStore()) {
    const company = await readCompanyFromPostgres(input.companyId);
    if (!company) {
      throw new HttpError(404, "not-found", "Sirket bulunamadi.");
    }
    const invites = await listCompanyInvitesFromPostgres(input.companyId, inviteLimit);
    return { invites };
  }

  const companyReference = db.collection("companies").doc(input.companyId);

  const [companySnapshot, invitesSnapshot] = await Promise.all([
    companyReference.get(),
    companyReference
      .collection("member_invites")
      .orderBy("createdAt", "desc")
      .limit(inviteLimit)
      .get(),
  ]);

  if (!companySnapshot.exists) {
    throw new HttpError(404, "not-found", "Sirket bulunamadi.");
  }

  const companyData = asRecord(companySnapshot.data()) ?? {};
  const companyName = pickString(companyData, "name") ?? "";

  const invites = invitesSnapshot.docs
    .map((documentSnapshot) => {
      const inviteData = asRecord(documentSnapshot.data()) ?? {};
      const inviteId = pickString(inviteData, "inviteId") ?? documentSnapshot.id;
      const invitedEmail = pickString(inviteData, "invitedEmail") ?? "";
      if (!inviteId || !invitedEmail) {
        return null;
      }

      const rawRole = pickString(inviteData, "role");
      const role =
        rawRole === "admin" || rawRole === "dispatcher" || rawRole === "viewer"
          ? rawRole
          : "viewer";

      const rawStatus = pickString(inviteData, "status");
      const status =
        rawStatus === "pending" ||
        rawStatus === "accepted" ||
        rawStatus === "declined" ||
        rawStatus === "revoked"
          ? rawStatus
          : "pending";

      return {
        inviteId,
        companyId: input.companyId,
        companyName,
        invitedUid: pickString(inviteData, "invitedUid") ?? "",
        invitedEmail,
        role,
        status,
        invitedBy: pickString(inviteData, "invitedBy"),
        createdAt: pickString(inviteData, "createdAt"),
        updatedAt: pickString(inviteData, "updatedAt"),
        expiresAt: pickString(inviteData, "expiresAt"),
      };
    })
    .filter((invite) => invite !== null);
  return { invites };
}

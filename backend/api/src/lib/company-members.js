import {
  backfillCompanyFromFirestoreRecord,
  backfillCompanyMembershipFromFirestoreRecord,
  listCompanyMembersFromPostgres,
  shouldUsePostgresCompanyStore,
} from "./company-membership-store.js";
import { HttpError } from "./http.js";
import { asRecord, pickString } from "./runtime-value.js";

const VALID_MEMBER_ROLES = new Set(["owner", "admin", "dispatcher", "viewer"]);
const VALID_MEMBER_STATUSES = new Set(["active", "invited", "suspended"]);

export async function listCompanyMembers(db, input) {
  if (shouldUsePostgresCompanyStore()) {
    const postgresResult = await listCompanyMembersFromPostgres(input.companyId, input.limit);
    if (postgresResult.companyExists) {
      return { items: postgresResult.items };
    }
  }

  const companyReference = db.collection("companies").doc(input.companyId);
  const memberLimit = Number.isFinite(input.limit) ? Math.max(1, Math.trunc(input.limit)) : 50;

  const [companySnapshot, membersSnapshot] = await Promise.all([
    companyReference.get(),
    companyReference.collection("members").orderBy("createdAt", "asc").limit(memberLimit).get(),
  ]);

  if (!companySnapshot.exists) {
    throw new HttpError(404, "not-found", "Sirket bulunamadi.");
  }

  const memberRows = membersSnapshot.docs
    .map((documentSnapshot) => {
      const memberData = asRecord(documentSnapshot.data()) ?? {};
      const uid = pickString(memberData, "uid") ?? documentSnapshot.id;
      const role = pickString(memberData, "role");
      const memberStatus = pickString(memberData, "status");

      if (
        !uid ||
        !VALID_MEMBER_ROLES.has(role ?? "") ||
        !VALID_MEMBER_STATUSES.has(memberStatus ?? "")
      ) {
        return null;
      }

      return {
        uid,
        role,
        memberStatus,
      };
    })
    .filter((row) => row !== null);

  const userSnapshots = await Promise.all(
    memberRows.map((row) => db.collection("users").doc(row.uid).get()),
  );
  const userDataByUid = new Map();
  for (const userSnapshot of userSnapshots) {
    const userData = asRecord(userSnapshot.data());
    if (userSnapshot.id && userData) {
      userDataByUid.set(userSnapshot.id, userData);
    }
  }

  const items = memberRows
    .map((row) => {
      const userData = userDataByUid.get(row.uid) ?? null;
      return {
        uid: row.uid,
        displayName:
          pickString(userData, "displayName") ??
          pickString(userData, "name") ??
          `Uye (${row.uid.slice(0, 6)})`,
        email: pickString(userData, "email"),
        phone: pickString(userData, "phone"),
        role: row.role,
        memberStatus: row.memberStatus,
        companyId: input.companyId,
      };
    })
    .sort((left, right) => left.displayName.localeCompare(right.displayName, "tr"));

  if (shouldUsePostgresCompanyStore()) {
    const companyData = asRecord(companySnapshot.data()) ?? {};
    const companyNameSnapshot = pickString(companyData, "name");
    const nowIso = new Date().toISOString();
    await backfillCompanyFromFirestoreRecord({
      companyId: input.companyId,
      name: companyNameSnapshot,
      legalName: pickString(companyData, "legalName"),
      status: pickString(companyData, "status"),
      billingStatus: pickString(companyData, "billingStatus"),
      timezone: pickString(companyData, "timezone"),
      countryCode: pickString(companyData, "countryCode"),
      contactPhone: pickString(companyData, "contactPhone"),
      contactEmail: pickString(companyData, "contactEmail"),
      createdBy: pickString(companyData, "createdBy"),
      createdAt: pickString(companyData, "createdAt"),
      updatedAt: pickString(companyData, "updatedAt") ?? nowIso,
    }).catch(() => false);
    await Promise.all(
      memberRows.map((row) =>
        backfillCompanyMembershipFromFirestoreRecord({
          companyId: input.companyId,
          uid: row.uid,
          role: row.role,
          status: row.memberStatus,
          companyNameSnapshot,
          createdAt: null,
          updatedAt: nowIso,
        }).catch(() => false),
      ),
    );
  }

  return { items };
}

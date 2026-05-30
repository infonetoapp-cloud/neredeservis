import { HttpError } from "./http.js";
import { asRecord, pickString } from "./runtime-value.js";

const VALID_MEMBER_ROLES = new Set(["owner", "admin", "dispatcher", "viewer"]);
const VALID_MEMBER_STATUSES = new Set(["active", "invited", "suspended"]);

export async function listCompanyMembers(db, input) {
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

  return { items };
}

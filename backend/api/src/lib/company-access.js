import { HttpError } from "./http.js";
import { asRecord, pickString } from "./runtime-value.js";

const VALID_MEMBER_ROLES = new Set(["owner", "admin", "dispatcher", "viewer"]);

export async function requireActiveCompanyMemberRole(db, companyId, uid) {
  const memberSnapshot = await db
    .collection("companies")
    .doc(companyId)
    .collection("members")
    .doc(uid)
    .get();

  if (!memberSnapshot.exists) {
    throw new HttpError(403, "permission-denied", "Bu sirket icin uye kaydi bulunamadi.");
  }

  const memberData = asRecord(memberSnapshot.data()) ?? {};
  if (pickString(memberData, "status") !== "active") {
    throw new HttpError(403, "permission-denied", "Sirket uyeligi aktif degil.");
  }

  const role = pickString(memberData, "role");
  if (!VALID_MEMBER_ROLES.has(role ?? "")) {
    throw new HttpError(412, "failed-precondition", "Sirket uye rolu gecersiz.");
  }

  return role;
}

export function requireCompanyOwnerOrAdmin(role) {
  if (role !== "owner" && role !== "admin") {
    throw new HttpError(
      403,
      "permission-denied",
      "Bu islem icin owner veya admin rolu gereklidir.",
    );
  }
}

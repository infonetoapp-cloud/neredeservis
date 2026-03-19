import { asRecord, pickString } from "./runtime-value.js";

const VALID_MEMBER_ROLES = new Set(["owner", "admin", "dispatcher", "viewer"]);
const VALID_MEMBER_STATUSES = new Set(["active", "invited", "suspended"]);

export async function listMyCompanies(db, uid) {
  const membershipSnapshot = await db
    .collection("users")
    .doc(uid)
    .collection("company_memberships")
    .get();

  if (membershipSnapshot.empty) {
    return { items: [] };
  }

  const membershipRows = membershipSnapshot.docs
    .map((documentSnapshot) => {
      const membershipData = asRecord(documentSnapshot.data()) ?? {};
      const companyId = pickString(membershipData, "companyId") ?? documentSnapshot.id;
      const role = pickString(membershipData, "role");
      const memberStatus =
        pickString(membershipData, "status") ?? pickString(membershipData, "memberStatus");

      if (
        !companyId ||
        !VALID_MEMBER_ROLES.has(role ?? "") ||
        !VALID_MEMBER_STATUSES.has(memberStatus ?? "")
      ) {
        return null;
      }

      return {
        companyId,
        role,
        memberStatus,
        companyNameSnapshot: pickString(membershipData, "companyName"),
      };
    })
    .filter((row) => row !== null);

  const companySnapshots = await Promise.all(
    membershipRows.map((row) => db.collection("companies").doc(row.companyId).get()),
  );

  const items = [];
  for (let index = 0; index < membershipRows.length; index += 1) {
    const row = membershipRows[index];
    const companySnapshot = companySnapshots[index];
    if (!row || !companySnapshot?.exists) {
      continue;
    }

    const companyData = asRecord(companySnapshot.data()) ?? {};
    const name = pickString(companyData, "name") ?? row.companyNameSnapshot;
    if (!name) {
      continue;
    }

    const rawCompanyStatus = pickString(companyData, "status");
    const companyStatus =
      rawCompanyStatus === "suspended" || rawCompanyStatus === "archived"
        ? rawCompanyStatus
        : "active";

    const rawBillingStatus = pickString(companyData, "billingStatus");
    const billingStatus =
      rawBillingStatus === "past_due" || rawBillingStatus === "suspended_locked"
        ? rawBillingStatus
        : "active";

    items.push({
      companyId: row.companyId,
      name,
      role: row.role,
      memberStatus: row.memberStatus,
      companyStatus,
      billingStatus,
    });
  }

  items.sort((left, right) => left.name.localeCompare(right.name, "tr"));

  return { items };
}

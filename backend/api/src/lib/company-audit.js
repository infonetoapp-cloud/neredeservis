import { HttpError } from "./http.js";
import { asRecord, pickString } from "./runtime-value.js";

function parseIsoToMs(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function readCompanyStatus(value) {
  if (value === "active" || value === "suspended" || value === "archived") {
    return value;
  }
  return "unknown";
}

function readBillingStatus(value) {
  if (value === "active" || value === "past_due" || value === "suspended_locked") {
    return value;
  }
  return "unknown";
}

export async function listCompanyAuditLogs(db, input) {
  const auditLimit = Number.isFinite(input.limit) ? Math.max(1, Math.trunc(input.limit)) : 60;

  const auditSnapshot = await db
    .collection("audit_logs")
    .where("companyId", "==", input.companyId)
    .limit(Math.min(auditLimit * 3, 200))
    .get();

  const items = auditSnapshot.docs
    .map((documentSnapshot) => {
      const auditData = asRecord(documentSnapshot.data()) ?? {};
      const eventType = pickString(auditData, "eventType");
      if (!eventType) {
        return null;
      }

      return {
        auditId: documentSnapshot.id,
        companyId: input.companyId,
        eventType,
        targetType: pickString(auditData, "targetType"),
        targetId: pickString(auditData, "targetId"),
        actorUid: pickString(auditData, "actorUid"),
        status: pickString(auditData, "status") ?? "unknown",
        reason: pickString(auditData, "reason"),
        createdAt: pickString(auditData, "createdAt"),
      };
    })
    .filter((item) => item !== null)
    .sort((left, right) => (parseIsoToMs(right.createdAt) ?? 0) - (parseIsoToMs(left.createdAt) ?? 0))
    .slice(0, auditLimit);

  return { items };
}

export async function getCompanyAdminTenantState(db, companyId) {
  const companySnapshot = await db.collection("companies").doc(companyId).get();
  if (!companySnapshot.exists) {
    throw new HttpError(404, "not-found", "Sirket bulunamadi.");
  }

  const companyData = asRecord(companySnapshot.data()) ?? {};
  return {
    companyId,
    companyStatus: readCompanyStatus(pickString(companyData, "status")),
    billingStatus: readBillingStatus(pickString(companyData, "billingStatus")),
    billingValidUntil: pickString(companyData, "billingValidUntil"),
    updatedAt: pickString(companyData, "updatedAt"),
    createdAt: pickString(companyData, "createdAt"),
  };
}

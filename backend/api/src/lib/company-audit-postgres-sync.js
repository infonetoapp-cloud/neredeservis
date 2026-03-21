import { backfillCompanyFromFirestoreRecord } from "./company-membership-store.js";
import {
  shouldUsePostgresCompanyAuditStore,
  syncCompanyAuditLogsSnapshotForCompany,
} from "./company-audit-store.js";
import { asRecord, pickFiniteNumber, pickString } from "./runtime-value.js";

export function buildCompanyAuditProjection(auditId, companyId, auditData) {
  const eventType = pickString(auditData, "eventType");
  if (!auditId || !companyId || !eventType) {
    return null;
  }

  return {
    auditId,
    companyId,
    eventType,
    targetType: pickString(auditData, "targetType"),
    targetId: pickString(auditData, "targetId"),
    actorUid: pickString(auditData, "actorUid"),
    status: pickString(auditData, "status") ?? "unknown",
    reason: pickString(auditData, "reason"),
    metadata: auditData?.metadata ?? null,
    createdAt: pickString(auditData, "createdAt"),
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

export async function syncCompanyAuditLogsFromFirestore(db, companyId, syncedAt, options = {}) {
  if (!shouldUsePostgresCompanyAuditStore()) {
    return false;
  }

  const limit = Number.isFinite(options.limit) ? Math.max(1, Math.trunc(options.limit)) : 200;
  const companyRef = db.collection("companies").doc(companyId);
  const [companySnapshot, auditSnapshot] = await Promise.all([
    companyRef.get(),
    db.collection("audit_logs").where("companyId", "==", companyId).limit(limit).get(),
  ]);

  if (!companySnapshot.exists) {
    return false;
  }

  await backfillCompanyRecordFromSnapshot(companyId, companySnapshot).catch(() => false);
  const auditItems = auditSnapshot.docs
    .map((documentSnapshot) =>
      buildCompanyAuditProjection(documentSnapshot.id, companyId, asRecord(documentSnapshot.data()) ?? {}),
    )
    .filter((item) => item !== null);

  await syncCompanyAuditLogsSnapshotForCompany(companyId, auditItems, syncedAt ?? new Date().toISOString());
  return true;
}

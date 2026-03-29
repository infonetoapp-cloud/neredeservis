import { createHash } from "node:crypto";

import {
  flushStagedCompanyAuditLog,
  listCompanyAuditLogsFromPostgres,
  stageCompanyAuditLogWrite,
  shouldUsePostgresCompanyAuditStore,
} from "./company-audit-store.js";
import {
  backfillCompanyFromFirestoreRecord,
  readCompanyFromPostgres,
  shouldUsePostgresCompanyStore,
} from "./company-membership-store.js";
import { HttpError } from "./http.js";
import { asRecord, pickString } from "./runtime-value.js";

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

function normalizeCompanyStatus(value) {
  if (value === undefined) {
    return undefined;
  }
  if (value === "active" || value === "suspended" || value === "archived") {
    return value;
  }
  throw new HttpError(400, "invalid-argument", "companyStatus gecersiz.");
}

function normalizeBillingStatus(value) {
  if (value === undefined) {
    return undefined;
  }
  if (value === "active" || value === "past_due" || value === "suspended_locked") {
    return value;
  }
  throw new HttpError(400, "invalid-argument", "billingStatus gecersiz.");
}

function normalizeBillingValidUntil(value) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  throw new HttpError(400, "invalid-argument", "billingValidUntil gecersiz.");
}

export async function listCompanyAuditLogs(_db, input) {
  if (!shouldUsePostgresCompanyAuditStore()) {
    return { items: [] };
  }

  const auditLimit = Number.isFinite(input.limit) ? Math.max(1, Math.trunc(input.limit)) : 60;
  const postgresItems = await listCompanyAuditLogsFromPostgres(input.companyId, auditLimit).catch(
    () => [],
  );
  return { items: Array.isArray(postgresItems) ? postgresItems : [] };
}

export async function getCompanyAdminTenantState(_db, companyId) {
  if (!shouldUsePostgresCompanyStore()) {
    throw new HttpError(412, "failed-precondition", "Sirket depolamasi hazir degil.");
  }

  const company = await readCompanyFromPostgres(companyId).catch(() => null);
  if (!company) {
    throw new HttpError(404, "not-found", "Sirket bulunamadi.");
  }

  return {
    companyId,
    companyStatus: readCompanyStatus(company.status),
    billingStatus: readBillingStatus(company.billingStatus),
    billingValidUntil: company.billingValidUntil ?? null,
    updatedAt: company.updatedAt,
    createdAt: company.createdAt,
  };
}

export async function updateCompanyAdminTenantState(_db, actorUid, actorRole, input) {
  if (actorRole !== "owner" && actorRole !== "admin") {
    throw new HttpError(
      403,
      "permission-denied",
      "Bu islem icin owner veya admin rolu gereklidir.",
    );
  }
  if (!shouldUsePostgresCompanyStore()) {
    throw new HttpError(412, "failed-precondition", "Sirket depolamasi hazir degil.");
  }

  const rawPatch = asRecord(input?.patch);
  if (!rawPatch) {
    throw new HttpError(400, "invalid-argument", "Gecerli bir patch govdesi bekleniyor.");
  }

  const nextCompanyStatus = normalizeCompanyStatus(rawPatch.companyStatus);
  const nextBillingStatus = normalizeBillingStatus(rawPatch.billingStatus);
  const nextBillingValidUntil = normalizeBillingValidUntil(rawPatch.billingValidUntil);
  const patchReason = pickString(rawPatch, "reason");
  const companyId = pickString(input, "companyId");
  if (!companyId) {
    throw new HttpError(400, "invalid-argument", "companyId gecersiz.");
  }

  const company = await readCompanyFromPostgres(companyId).catch(() => null);
  if (!company) {
    throw new HttpError(404, "not-found", "Sirket bulunamadi.");
  }

  const nowIso = new Date().toISOString();
  const currentCompanyStatus = readCompanyStatus(company.status);
  const currentBillingStatus = readBillingStatus(company.billingStatus);
  const currentBillingValidUntil = company.billingValidUntil ?? null;

  const updatePatch = {
    updatedAt: nowIso,
    updatedBy: actorUid,
  };
  const changedFields = [];

  if (nextCompanyStatus !== undefined && currentCompanyStatus !== nextCompanyStatus) {
    updatePatch.status = nextCompanyStatus;
    changedFields.push("companyStatus");
  }
  if (nextBillingStatus !== undefined && currentBillingStatus !== nextBillingStatus) {
    updatePatch.billingStatus = nextBillingStatus;
    changedFields.push("billingStatus");
  }
  if (
    nextBillingValidUntil !== undefined &&
    (currentBillingValidUntil ?? null) !== nextBillingValidUntil
  ) {
    updatePatch.billingValidUntil = nextBillingValidUntil;
    changedFields.push("billingValidUntil");
  }

  if (changedFields.length === 0) {
    throw new HttpError(400, "invalid-argument", "TENANT_STATE_NO_CHANGES");
  }

  const companySync = {
    companyId,
    name: company.name,
    legalName: company.legalName,
    status: typeof updatePatch.status === "string" ? updatePatch.status : currentCompanyStatus,
    billingStatus:
      typeof updatePatch.billingStatus === "string"
        ? updatePatch.billingStatus
        : currentBillingStatus,
    billingValidUntil:
      updatePatch.billingValidUntil === undefined
        ? currentBillingValidUntil
        : updatePatch.billingValidUntil,
    timezone: company.timezone,
    countryCode: company.countryCode,
    contactPhone: company.contactPhone,
    contactEmail: company.contactEmail,
    logoUrl: company.logoUrl,
    address: company.address,
    vehicleLimit: company.vehicleLimit,
    createdBy: company.createdBy,
    createdAt: company.createdAt,
    updatedAt: nowIso,
  };

  const auditLog = stageCompanyAuditLogWrite(null, null, {
    companyId,
    actorUid,
    actorType: "company_member",
    eventType: "company_tenant_state_updated",
    targetType: "company",
    targetId: companyId,
    status: "success",
    reason: null,
    metadata: {
      actorRole,
      changedFields,
      patchReason: patchReason ?? null,
      previous: {
        companyStatus: currentCompanyStatus,
        billingStatus: currentBillingStatus,
        billingValidUntil: currentBillingValidUntil ?? null,
      },
      next: {
        companyStatus: companySync.status,
        billingStatus: companySync.billingStatus,
        billingValidUntil: companySync.billingValidUntil ?? null,
      },
    },
    requestId: createHash("sha256")
      .update(`updateCompanyAdminTenantState:${actorUid}:${companyId}:${nowIso}`)
      .digest("hex")
      .slice(0, 24),
    createdAt: nowIso,
  });

  await backfillCompanyFromFirestoreRecord(companySync).catch(() => false);
  await flushStagedCompanyAuditLog(auditLog).catch(() => false);

  return {
    companyId,
    companyStatus: readCompanyStatus(companySync.status),
    billingStatus: readBillingStatus(companySync.billingStatus),
    billingValidUntil: companySync.billingValidUntil ?? null,
    updatedAt: nowIso,
    changedFields,
    companySync,
    auditLog,
  };
}

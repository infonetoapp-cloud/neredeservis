import { createHash } from "node:crypto";

import { syncCompanyAuditLogsFromFirestore } from "./company-audit-postgres-sync.js";
import {
  flushStagedCompanyAuditLog,
  isCompanyAuditFreshInPostgres,
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

const COMPANY_AUDIT_CACHE_MAX_AGE_MS = 60_000;

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
  if (shouldUsePostgresCompanyAuditStore()) {
    const auditFresh = await isCompanyAuditFreshInPostgres(
      input.companyId,
      COMPANY_AUDIT_CACHE_MAX_AGE_MS,
    ).catch(() => false);
    if (auditFresh) {
      const items = await listCompanyAuditLogsFromPostgres(input.companyId, auditLimit).catch(() => null);
      if (items) {
        return { items };
      }
    }
  }

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

  if (shouldUsePostgresCompanyAuditStore()) {
    await syncCompanyAuditLogsFromFirestore(db, input.companyId, new Date().toISOString()).catch(() => false);
  }

  return { items };
}

export async function getCompanyAdminTenantState(db, companyId) {
  if (shouldUsePostgresCompanyStore()) {
    const company = await readCompanyFromPostgres(companyId).catch(() => null);
    if (company) {
      return {
        companyId,
        companyStatus: readCompanyStatus(company.status),
        billingStatus: readBillingStatus(company.billingStatus),
        billingValidUntil: company.billingValidUntil ?? null,
        updatedAt: company.updatedAt,
        createdAt: company.createdAt,
      };
    }
  }

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

export async function updateCompanyAdminTenantState(db, actorUid, actorRole, input) {
  if (actorRole !== "owner" && actorRole !== "admin") {
    throw new HttpError(
      403,
      "permission-denied",
      "Bu islem icin owner veya admin rolu gereklidir.",
    );
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

  const nowIso = new Date().toISOString();
  const companyRef = db.collection("companies").doc(companyId);

  return db.runTransaction(async (transaction) => {
    const companySnapshot = await transaction.get(companyRef);
    if (!companySnapshot.exists) {
      throw new HttpError(404, "not-found", "Sirket bulunamadi.");
    }

    const companyData = asRecord(companySnapshot.data()) ?? {};
    const currentCompanyStatus = readCompanyStatus(pickString(companyData, "status"));
    const currentBillingStatus = readBillingStatus(pickString(companyData, "billingStatus"));
    const currentBillingValidUntil = pickString(companyData, "billingValidUntil");

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

    transaction.update(companyRef, updatePatch);

    const auditLog = {
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
          companyStatus: updatePatch.status ?? currentCompanyStatus,
          billingStatus: updatePatch.billingStatus ?? currentBillingStatus,
          billingValidUntil:
            updatePatch.billingValidUntil === undefined
              ? currentBillingValidUntil ?? null
              : updatePatch.billingValidUntil,
        },
      },
      requestId: createHash("sha256")
        .update(`updateCompanyAdminTenantState:${actorUid}:${companyId}:${nowIso}`)
        .digest("hex")
        .slice(0, 24),
      createdAt: nowIso,
    };
    const stagedAuditLog = stageCompanyAuditLogWrite(db, transaction, auditLog);

    return {
      companyId,
      companyStatus: readCompanyStatus(
        typeof updatePatch.status === "string" ? updatePatch.status : currentCompanyStatus,
      ),
      billingStatus: readBillingStatus(
        typeof updatePatch.billingStatus === "string"
          ? updatePatch.billingStatus
          : currentBillingStatus,
      ),
      billingValidUntil:
        updatePatch.billingValidUntil === undefined
          ? currentBillingValidUntil ?? null
          : updatePatch.billingValidUntil,
      updatedAt: nowIso,
      changedFields,
      companySync: {
        companyId,
        name: pickString(companyData, "name"),
        legalName: pickString(companyData, "legalName"),
        status:
          typeof updatePatch.status === "string" ? updatePatch.status : currentCompanyStatus,
        billingStatus:
          typeof updatePatch.billingStatus === "string"
            ? updatePatch.billingStatus
            : currentBillingStatus,
        billingValidUntil:
          updatePatch.billingValidUntil === undefined
            ? currentBillingValidUntil ?? null
            : updatePatch.billingValidUntil,
        timezone: pickString(companyData, "timezone"),
        countryCode: pickString(companyData, "countryCode"),
        contactPhone: pickString(companyData, "contactPhone"),
        contactEmail: pickString(companyData, "contactEmail"),
        logoUrl: pickString(companyData, "logoUrl"),
        address: pickString(companyData, "address"),
        vehicleLimit: companyData?.vehicleLimit,
        createdBy: pickString(companyData, "createdBy"),
        createdAt: pickString(companyData, "createdAt"),
        updatedAt: nowIso,
      },
      auditLog: {
        ...stagedAuditLog,
      },
    };
  }).then(async (result) => {
    if (shouldUsePostgresCompanyStore()) {
      await backfillCompanyFromFirestoreRecord(result.companySync).catch(() => false);
    }
    if (shouldUsePostgresCompanyAuditStore()) {
      await flushStagedCompanyAuditLog(result.auditLog).catch(() => false);
    }
    return result;
  });
}

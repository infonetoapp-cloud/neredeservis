import { createHash, randomUUID } from "node:crypto";

import {
  listMyCompaniesFromPostgres,
  shouldUsePostgresCompanyStore,
  syncCompanyWithOwnerMembershipToPostgres,
} from "./company-membership-store.js";
import { flushStagedCompanyAuditLog, stageCompanyAuditLogWrite } from "./company-audit-store.js";
import { HttpError } from "./http.js";

function requireCompanyStore() {
  if (!shouldUsePostgresCompanyStore()) {
    throw new HttpError(412, "failed-precondition", "Sirket depolamasi hazir degil.");
  }
}

function normalizeContactField(rawValue, options = {}) {
  if (rawValue === undefined || rawValue === null) {
    return null;
  }
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", `${options.label ?? "Alan"} bilgisi gecersiz.`);
  }

  const value = rawValue.trim();
  if (!value) {
    return null;
  }

  const maxLength = Number.isFinite(options.maxLength) ? options.maxLength : 254;
  if (value.length > maxLength) {
    throw new HttpError(
      400,
      "invalid-argument",
      `${options.label ?? "Alan"} maksimum ${maxLength} karakter olabilir.`,
    );
  }

  return value;
}

export async function listMyCompanies(_db, uid) {
  requireCompanyStore();
  const items = await listMyCompaniesFromPostgres(uid).catch(() => []);
  return { items: Array.isArray(items) ? items : [] };
}

export async function createCompany(db, uid, input) {
  requireCompanyStore();

  const name = normalizeContactField(input?.name, { label: "Sirket adi", maxLength: 120 });
  if (!name || name.length < 2) {
    throw new HttpError(400, "invalid-argument", "Sirket adi minimum 2 karakter olmalidir.");
  }

  const contactEmail = normalizeContactField(input?.contactEmail, {
    label: "Iletisim e-postasi",
    maxLength: 254,
  });
  if (contactEmail && !contactEmail.includes("@")) {
    throw new HttpError(400, "invalid-argument", "Gecerli bir e-posta adresi girilmelidir.");
  }

  const contactPhone = normalizeContactField(input?.contactPhone, {
    label: "Iletisim telefonu",
    maxLength: 32,
  });
  if (contactPhone && contactPhone.length < 3) {
    throw new HttpError(400, "invalid-argument", "Telefon bilgisi minimum 3 karakter olmalidir.");
  }

  const nowIso = new Date().toISOString();
  const companyId = randomUUID();
  const auditLog = stageCompanyAuditLogWrite(db, null, {
    companyId,
    actorUid: uid,
    actorType: "company_member",
    eventType: "company_created",
    targetType: "company",
    targetId: companyId,
    status: "success",
    reason: null,
    metadata: {
      role: "owner",
    },
    requestId: createHash("sha256")
      .update(`${uid}:${companyId}:${nowIso}`)
      .digest("hex")
      .slice(0, 24),
    createdAt: nowIso,
  });

  await syncCompanyWithOwnerMembershipToPostgres({
    companyId,
    uid,
    name,
    status: "active",
    billingStatus: "active",
    timezone: "Europe/Istanbul",
    countryCode: "TR",
    contactPhone,
    contactEmail,
    createdBy: uid,
    createdAt: nowIso,
    updatedAt: nowIso,
  });

  await flushStagedCompanyAuditLog(auditLog).catch(() => false);

  return {
    companyId,
    ownerMember: {
      uid,
      role: "owner",
      status: "active",
    },
    createdAt: nowIso,
    auditLog,
  };
}

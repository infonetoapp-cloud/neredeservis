import { createHash } from "node:crypto";

import {
  backfillCompanyFromFirestoreRecord,
  backfillCompanyMembershipFromFirestoreRecord,
  listMyCompaniesFromPostgres,
  shouldUsePostgresCompanyStore,
  syncCompanyWithOwnerMembershipToPostgres,
} from "./company-membership-store.js";
import { flushStagedCompanyAuditLog, stageCompanyAuditLogWrite } from "./company-audit-store.js";
import { HttpError } from "./http.js";
import { asRecord, pickString } from "./runtime-value.js";

const VALID_MEMBER_ROLES = new Set(["owner", "admin", "dispatcher", "viewer"]);
const VALID_MEMBER_STATUSES = new Set(["active", "invited", "suspended"]);

export async function listMyCompanies(db, uid) {
  if (shouldUsePostgresCompanyStore()) {
    const postgresItems = await listMyCompaniesFromPostgres(uid);
    if (postgresItems.length > 0) {
      return { items: postgresItems };
    }
  }

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
  const resolvedItems = [];
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

    const item = {
      companyId: row.companyId,
      name,
      role: row.role,
      memberStatus: row.memberStatus,
      companyStatus,
      billingStatus,
    };
    items.push(item);
    resolvedItems.push({
      item,
      row,
      companyData,
    });
  }

  items.sort((left, right) => left.name.localeCompare(right.name, "tr"));

  if (shouldUsePostgresCompanyStore()) {
    await Promise.all(
      resolvedItems.map(({ item, row, companyData }) => {
        const nowIso = new Date().toISOString();

        return Promise.all([
          backfillCompanyFromFirestoreRecord({
            companyId: item.companyId,
            name: item.name,
            legalName: pickString(companyData, "legalName"),
            status: item.companyStatus,
            billingStatus: item.billingStatus,
            timezone: pickString(companyData, "timezone"),
            countryCode: pickString(companyData, "countryCode"),
            contactPhone: pickString(companyData, "contactPhone"),
            contactEmail: pickString(companyData, "contactEmail"),
            createdBy: pickString(companyData, "createdBy"),
            createdAt: pickString(companyData, "createdAt"),
            updatedAt: pickString(companyData, "updatedAt") ?? nowIso,
          }).catch(() => false),
          backfillCompanyMembershipFromFirestoreRecord({
            companyId: item.companyId,
            uid,
            role: row.role,
            status: row.memberStatus,
            companyNameSnapshot: item.name,
            createdAt: pickString(companyData, "createdAt"),
            updatedAt: pickString(companyData, "updatedAt") ?? nowIso,
          }).catch(() => false),
        ]);
      }),
    );
  }

  return { items };
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

export async function createCompany(db, uid, input) {
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

  return db.runTransaction(async (transaction) => {
    const companyRef = db.collection("companies").doc();
    const memberRef = companyRef.collection("members").doc(uid);
    const userMembershipRef = db
      .collection("users")
      .doc(uid)
      .collection("company_memberships")
      .doc(companyRef.id);
    transaction.set(companyRef, {
      name,
      legalName: null,
      status: "active",
      timezone: "Europe/Istanbul",
      countryCode: "TR",
      contactPhone,
      contactEmail,
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy: uid,
    });

    transaction.set(memberRef, {
      companyId: companyRef.id,
      uid,
      role: "owner",
      status: "active",
      permissions: null,
      invitedBy: null,
      invitedAt: null,
      acceptedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    transaction.set(userMembershipRef, {
      companyId: companyRef.id,
      uid,
      role: "owner",
      status: "active",
      companyName: name,
      companyStatus: "active",
      acceptedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    const auditLog = stageCompanyAuditLogWrite(db, transaction, {
      companyId: companyRef.id,
      actorUid: uid,
      actorType: "company_member",
      eventType: "company_created",
      targetType: "company",
      targetId: companyRef.id,
      status: "success",
      reason: null,
      metadata: {
        role: "owner",
      },
      requestId: createHash("sha256")
        .update(`${uid}:${companyRef.id}:${nowIso}`)
        .digest("hex")
        .slice(0, 24),
      createdAt: nowIso,
    });

    return {
      companyId: companyRef.id,
      ownerMember: {
        uid,
        role: "owner",
        status: "active",
      },
      createdAt: nowIso,
      auditLog,
    };
  }).then(async (result) => {
    if (shouldUsePostgresCompanyStore()) {
      try {
        await syncCompanyWithOwnerMembershipToPostgres({
          companyId: result.companyId,
          uid,
          name,
          status: "active",
          timezone: "Europe/Istanbul",
          countryCode: "TR",
          contactPhone,
          contactEmail,
          createdAt: nowIso,
          updatedAt: nowIso,
        });
      } catch (error) {
        console.warn(
          JSON.stringify({
            level: "warn",
            event: "postgres_company_sync_failed",
            companyId: result.companyId,
            message: error instanceof Error ? error.message : "unknown_error",
          }),
        );
      }
    }

    await flushStagedCompanyAuditLog(result.auditLog).catch(() => false);

    return result;
  });
}

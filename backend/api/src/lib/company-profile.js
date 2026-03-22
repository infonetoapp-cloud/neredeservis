import {
  backfillCompanyFromFirestoreRecord,
  readCompanyFromPostgres,
  shouldUsePostgresCompanyStore,
} from "./company-membership-store.js";
import { HttpError } from "./http.js";
import { asRecord, pickFiniteNumber, pickString } from "./runtime-value.js";

async function mirrorCompanyPatchToFirestore(db, companyId, updates) {
  try {
    await db.collection("companies").doc(companyId).set(updates, { merge: true });
    return true;
  } catch (error) {
    console.warn(
      JSON.stringify({
        level: "warn",
        event: "firestore_company_profile_mirror_failed",
        companyId,
        message: error instanceof Error ? error.message : "unknown_error",
      }),
    );
    return false;
  }
}

export async function getCompanyProfile(db, companyId) {
  if (shouldUsePostgresCompanyStore()) {
    const company = await readCompanyFromPostgres(companyId);
    if (company) {
      return {
        companyId,
        name: company.name,
        logoUrl: company.logoUrl ?? null,
        contactEmail: company.contactEmail ?? null,
        contactPhone: company.contactPhone ?? null,
        address: company.address ?? null,
        timezone: company.timezone ?? "Europe/Istanbul",
        countryCode: company.countryCode ?? "TR",
        status: company.status ?? "active",
        vehicleLimit: company.vehicleLimit ?? 10,
        createdAt: company.createdAt ?? null,
      };
    }
  }

  const companySnapshot = await db.collection("companies").doc(companyId).get();
  if (!companySnapshot.exists) {
    throw new HttpError(404, "not-found", "Sirket bulunamadi.");
  }

  const data = asRecord(companySnapshot.data()) ?? {};
  const profile = {
    companyId,
    name: pickString(data, "name") ?? "",
    logoUrl: pickString(data, "logoUrl") ?? null,
    contactEmail: pickString(data, "contactEmail") ?? null,
    contactPhone: pickString(data, "contactPhone") ?? null,
    address: pickString(data, "address") ?? null,
    timezone: pickString(data, "timezone") ?? "Europe/Istanbul",
    countryCode: pickString(data, "countryCode") ?? "TR",
    status: pickString(data, "status") ?? "active",
    vehicleLimit: pickFiniteNumber(data, "vehicleLimit") ?? 10,
    createdAt: pickString(data, "createdAt") ?? null,
  };

  if (shouldUsePostgresCompanyStore()) {
    await backfillCompanyFromFirestoreRecord({
      companyId,
      ...profile,
      legalName: pickString(data, "legalName"),
      billingStatus: pickString(data, "billingStatus"),
      createdBy: pickString(data, "createdBy"),
      updatedAt: pickString(data, "updatedAt"),
    }).catch(() => false);
  }

  return profile;
}

export async function updateCompanyProfile(db, input) {
  const postgresCompany = shouldUsePostgresCompanyStore()
    ? await readCompanyFromPostgres(input.companyId).catch(() => null)
    : null;
  const companySnapshot = postgresCompany
    ? null
    : await db.collection("companies").doc(input.companyId).get();
  if (!postgresCompany && !companySnapshot?.exists) {
    throw new HttpError(404, "not-found", "Sirket bulunamadi.");
  }

  const data = postgresCompany
    ? {
        name: postgresCompany.name,
        logoUrl: postgresCompany.logoUrl,
        contactEmail: postgresCompany.contactEmail,
        contactPhone: postgresCompany.contactPhone,
        address: postgresCompany.address,
        timezone: postgresCompany.timezone,
        countryCode: postgresCompany.countryCode,
        status: postgresCompany.status,
        vehicleLimit: postgresCompany.vehicleLimit,
        legalName: postgresCompany.legalName,
        billingStatus: postgresCompany.billingStatus,
        createdBy: postgresCompany.createdBy,
        createdAt: postgresCompany.createdAt,
        updatedAt: postgresCompany.updatedAt,
      }
    : asRecord(companySnapshot.data()) ?? {};
  const updates = {};
  const changedFields = [];

  if (Object.prototype.hasOwnProperty.call(input, "name")) {
    if (typeof input.name !== "string") {
      throw new HttpError(400, "invalid-argument", "Sirket adi metin olmalidir.");
    }

    const name = input.name.trim();
    if (name.length < 2 || name.length > 120) {
      throw new HttpError(400, "invalid-argument", "Sirket adi 2 ile 120 karakter arasinda olmalidir.");
    }

    updates.name = name;
    changedFields.push("name");
  }

  if (Object.prototype.hasOwnProperty.call(input, "logoUrl")) {
    if (typeof input.logoUrl !== "string") {
      throw new HttpError(400, "invalid-argument", "Logo URL metin olmalidir.");
    }

    const logoUrl = input.logoUrl.trim();
    if (logoUrl.length > 1024) {
      throw new HttpError(400, "invalid-argument", "Logo URL en fazla 1024 karakter olabilir.");
    }

    updates.logoUrl = logoUrl.length > 0 ? logoUrl : null;
    changedFields.push("logoUrl");
  }

  if (changedFields.length === 0) {
    throw new HttpError(400, "invalid-argument", "En az bir alan guncellenmelidir.");
  }

  const updatedAt = new Date().toISOString();
  updates.updatedAt = updatedAt;

  if (shouldUsePostgresCompanyStore()) {
    const nextData = {
      ...data,
      ...updates,
    };
    await backfillCompanyFromFirestoreRecord({
      companyId: input.companyId,
      name: pickString(nextData, "name"),
      logoUrl: pickString(nextData, "logoUrl"),
      contactEmail: pickString(nextData, "contactEmail"),
      contactPhone: pickString(nextData, "contactPhone"),
      address: pickString(nextData, "address"),
      timezone: pickString(nextData, "timezone"),
      countryCode: pickString(nextData, "countryCode"),
      status: pickString(nextData, "status"),
      vehicleLimit: pickFiniteNumber(nextData, "vehicleLimit"),
      legalName: pickString(nextData, "legalName"),
      billingStatus: pickString(nextData, "billingStatus"),
      createdBy: pickString(nextData, "createdBy"),
      createdAt: pickString(nextData, "createdAt"),
      updatedAt,
    }).catch(() => false);

    await mirrorCompanyPatchToFirestore(db, input.companyId, updates);
  } else {
    await db.collection("companies").doc(input.companyId).update(updates);
  }

  return {
    companyId: input.companyId,
    changedFields,
    updatedAt,
  };
}

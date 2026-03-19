import { HttpError } from "./http.js";
import { asRecord, pickFiniteNumber, pickString } from "./runtime-value.js";

export async function getCompanyProfile(db, companyId) {
  const companySnapshot = await db.collection("companies").doc(companyId).get();
  if (!companySnapshot.exists) {
    throw new HttpError(404, "not-found", "Sirket bulunamadi.");
  }

  const data = asRecord(companySnapshot.data()) ?? {};
  return {
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
}

export async function updateCompanyProfile(db, input) {
  const companySnapshot = await db.collection("companies").doc(input.companyId).get();
  if (!companySnapshot.exists) {
    throw new HttpError(404, "not-found", "Sirket bulunamadi.");
  }

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

  await db.collection("companies").doc(input.companyId).update(updates);

  return {
    companyId: input.companyId,
    changedFields,
    updatedAt,
  };
}

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

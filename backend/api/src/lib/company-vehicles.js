import { asRecord, pickString } from "./runtime-value.js";

function pickFiniteNumber(record, key) {
  const value = record?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseIsoToMs(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export async function listCompanyVehicles(db, input) {
  const vehicleLimit = Number.isFinite(input.limit) ? Math.max(1, Math.trunc(input.limit)) : 50;
  const vehiclesSnapshot = await db
    .collection("companies")
    .doc(input.companyId)
    .collection("vehicles")
    .limit(vehicleLimit)
    .get();

  const items = vehiclesSnapshot.docs
    .map((documentSnapshot) => {
      const vehicleData = asRecord(documentSnapshot.data()) ?? {};
      const plate = pickString(vehicleData, "plate");
      if (!plate) {
        return null;
      }

      const rawStatus = pickString(vehicleData, "status");
      const status =
        rawStatus === "active" || rawStatus === "maintenance" || rawStatus === "inactive"
          ? rawStatus
          : "active";

      return {
        vehicleId: documentSnapshot.id,
        companyId: input.companyId,
        plate,
        status,
        brand: pickString(vehicleData, "brand"),
        model: pickString(vehicleData, "model"),
        year: pickFiniteNumber(vehicleData, "year"),
        capacity: pickFiniteNumber(vehicleData, "capacity"),
        updatedAt: pickString(vehicleData, "updatedAt"),
      };
    })
    .filter((item) => item !== null)
    .sort((left, right) => (parseIsoToMs(right.updatedAt) ?? 0) - (parseIsoToMs(left.updatedAt) ?? 0));

  return { items };
}

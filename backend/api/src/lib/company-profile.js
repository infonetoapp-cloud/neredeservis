import { readCompanyFromPostgres, shouldUsePostgresCompanyStore } from "./company-membership-store.js";
import { HttpError } from "./http.js";
import { getPostgresPool } from "./postgres.js";

function requireCompanyStore() {
  if (!shouldUsePostgresCompanyStore()) {
    throw new HttpError(412, "failed-precondition", "Sirket depolamasi hazir degil.");
  }
}

export async function getCompanyProfile(_db, companyId) {
  requireCompanyStore();

  const company = await readCompanyFromPostgres(companyId).catch(() => null);
  if (!company) {
    throw new HttpError(404, "not-found", "Sirket bulunamadi.");
  }

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

export async function updateCompanyProfile(_db, input) {
  requireCompanyStore();

  const company = await readCompanyFromPostgres(input.companyId).catch(() => null);
  if (!company) {
    throw new HttpError(404, "not-found", "Sirket bulunamadi.");
  }

  const nextData = {
    ...company,
  };
  const changedFields = [];

  if (Object.prototype.hasOwnProperty.call(input, "name")) {
    if (typeof input.name !== "string") {
      throw new HttpError(400, "invalid-argument", "Sirket adi metin olmalidir.");
    }

    const name = input.name.trim();
    if (name.length < 2 || name.length > 120) {
      throw new HttpError(400, "invalid-argument", "Sirket adi 2 ile 120 karakter arasinda olmalidir.");
    }

    nextData.name = name;
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

    nextData.logoUrl = logoUrl.length > 0 ? logoUrl : null;
    changedFields.push("logoUrl");
  }

  if (changedFields.length === 0) {
    throw new HttpError(400, "invalid-argument", "En az bir alan guncellenmelidir.");
  }

  const updatedAt = new Date().toISOString();
  const pool = getPostgresPool();
  if (!pool) {
    throw new HttpError(412, "failed-precondition", "Sirket depolamasi hazir degil.");
  }

  await pool.query(
    `
      UPDATE companies
      SET
        name = $2,
        logo_url = $3,
        updated_at = $4::timestamptz
      WHERE company_id = $1
    `,
    [input.companyId, nextData.name, nextData.logoUrl, updatedAt],
  );

  return {
    companyId: input.companyId,
    changedFields,
    updatedAt,
  };
}

import {
  listCompanyMembersFromPostgres,
  shouldUsePostgresCompanyStore,
} from "./company-membership-store.js";
import { HttpError } from "./http.js";

export async function listCompanyMembers(_db, input) {
  if (!shouldUsePostgresCompanyStore()) {
    throw new HttpError(412, "failed-precondition", "Sirket depolamasi hazir degil.");
  }

  const postgresResult = await listCompanyMembersFromPostgres(input.companyId, input.limit).catch(
    () => null,
  );
  if (!postgresResult?.companyExists) {
    throw new HttpError(404, "not-found", "Sirket bulunamadi.");
  }
  return { items: postgresResult.items };
}

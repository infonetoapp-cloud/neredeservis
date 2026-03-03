import type { CompanyMemberRole, CompanyMemberStatus } from "@/features/company/company-types";

type Role = CompanyMemberRole | null;
type Status = CompanyMemberStatus | null;

function isActiveMember(status: Status) {
  return status === "active";
}

/**
 * MVP tek-rol modeli: tüm aktif üyeler eşit yetkiye sahip.
 * Role parametresi geriye uyumluluk için korunuyor; gating yalnızca
 * `isActiveMember` kontrolüne dayanır.
 */

export function canAccessAdminSurface(_role: Role, status: Status) {
  return isActiveMember(status);
}

export function canManageCompanyMembers(_role: Role, status: Status) {
  return isActiveMember(status);
}

export function canManageRoutePermissions(_role: Role, status: Status) {
  return isActiveMember(status);
}

export function canMutateCompanyOperations(_role: Role, status: Status) {
  return isActiveMember(status);
}


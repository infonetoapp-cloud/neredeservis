import type { CompanyMemberRole, CompanyMemberStatus } from "@/features/company/company-types";

type Role = CompanyMemberRole | null;
type Status = CompanyMemberStatus | null;

function isActiveMember(status: Status) {
  return status === "active";
}

function isCompanyManager(role: Role) {
  return role === "owner" || role === "admin";
}

export function canAccessAdminSurface(role: Role, status: Status) {
  return isActiveMember(status) && isCompanyManager(role);
}

export function canManageCompanyMembers(role: Role, status: Status) {
  return isActiveMember(status) && isCompanyManager(role);
}

export function canManageRoutePermissions(role: Role, status: Status) {
  return isActiveMember(status) && isCompanyManager(role);
}

export function canMutateCompanyOperations(role: Role, status: Status) {
  return isActiveMember(status) && (isCompanyManager(role) || role === "dispatcher");
}


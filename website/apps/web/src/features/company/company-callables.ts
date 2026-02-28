"use client";

import { callFirebaseCallable } from "@/lib/firebase/callable";
import {
  ensureAcceptCompanyInviteResponse,
  ensureCreateCompanyResponse,
  ensureDeclineCompanyInviteResponse,
  ensureInviteCompanyMemberResponse,
  ensureListCompanyMembersResponse,
  ensureListMyCompaniesResponse,
  ensureRemoveCompanyMemberResponse,
  ensureUpdateCompanyMemberResponse,
} from "@/features/company/company-callable-contract-guards";
export {
  isCompanyCallableConflictError,
  mapCompanyCallableErrorToMessage,
} from "@/features/company/company-callable-error-messages";
export {
  createCompanyRouteCallable,
  deleteCompanyRouteStopCallable,
  grantDriverRoutePermissionsCallable,
  listActiveTripsByCompanyCallable,
  listCompanyRouteStopsCallable,
  listCompanyRoutesCallable,
  listRouteDriverPermissionsCallable,
  reorderCompanyRouteStopsCallable,
  revokeDriverRoutePermissionsCallable,
  updateCompanyRouteCallable,
  upsertCompanyRouteStopCallable,
} from "@/features/company/company-route-callables";
export {
  generateRouteShareLinkCallable,
  getDynamicRoutePreviewCallable,
} from "@/features/company/company-share-callables";
export {
  createVehicleCallable,
  listCompanyVehiclesCallable,
  updateVehicleCallable,
} from "@/features/company/company-vehicle-callables";

import type {
  AcceptCompanyInviteResponse,
  CompanyMemberRole,
  CompanyMemberStatus,
  CompanyMemberSummary,
  CompanyMembershipSummary,
  CreateCompanyResponse,
  DeclineCompanyInviteResponse,
  InviteCompanyMemberResponse,
  InviteCompanyMemberRole,
  RemoveCompanyMemberResponse,
  UpdateCompanyMemberResponse,
} from "@/features/company/company-types";

export async function listMyCompaniesCallable(): Promise<CompanyMembershipSummary[]> {
  const envelope = await callFirebaseCallable<Record<string, never>, unknown>(
    "listMyCompanies",
    {},
  );
  return ensureListMyCompaniesResponse(envelope.data, "listMyCompanies").items;
}

export async function createCompanyCallable(input: {
  name: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
}): Promise<CreateCompanyResponse> {
  const envelope = await callFirebaseCallable<typeof input, unknown>(
    "createCompany",
    input,
  );
  return ensureCreateCompanyResponse(envelope.data, "createCompany");
}

export async function listCompanyMembersCallable(input: {
  companyId: string;
}): Promise<CompanyMemberSummary[]> {
  const envelope = await callFirebaseCallable<typeof input, unknown>(
    "listCompanyMembers",
    input,
  );
  return ensureListCompanyMembersResponse(envelope.data, "listCompanyMembers").items;
}

export async function inviteCompanyMemberCallable(input: {
  companyId: string;
  email: string;
  role: InviteCompanyMemberRole;
}): Promise<InviteCompanyMemberResponse> {
  const envelope = await callFirebaseCallable<typeof input, unknown>(
    "inviteCompanyMember",
    input,
  );
  return ensureInviteCompanyMemberResponse(envelope.data, "inviteCompanyMember");
}

export async function acceptCompanyInviteCallable(input: {
  companyId: string;
}): Promise<AcceptCompanyInviteResponse> {
  const envelope = await callFirebaseCallable<typeof input, unknown>(
    "acceptCompanyInvite",
    input,
  );
  return ensureAcceptCompanyInviteResponse(envelope.data, "acceptCompanyInvite");
}

export async function declineCompanyInviteCallable(input: {
  companyId: string;
}): Promise<DeclineCompanyInviteResponse> {
  const envelope = await callFirebaseCallable<typeof input, unknown>(
    "declineCompanyInvite",
    input,
  );
  return ensureDeclineCompanyInviteResponse(envelope.data, "declineCompanyInvite");
}

export async function updateCompanyMemberCallable(input: {
  companyId: string;
  memberUid: string;
  patch: {
    role?: CompanyMemberRole;
    memberStatus?: CompanyMemberStatus;
  };
}): Promise<UpdateCompanyMemberResponse> {
  const envelope = await callFirebaseCallable<typeof input, unknown>(
    "updateCompanyMember",
    input,
  );
  return ensureUpdateCompanyMemberResponse(envelope.data, "updateCompanyMember");
}

export async function removeCompanyMemberCallable(input: {
  companyId: string;
  memberUid: string;
}): Promise<RemoveCompanyMemberResponse> {
  const envelope = await callFirebaseCallable<typeof input, unknown>(
    "removeCompanyMember",
    input,
  );
  return ensureRemoveCompanyMemberResponse(envelope.data, "removeCompanyMember");
}

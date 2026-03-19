"use client";

import { callBackendApi } from "@/lib/backend-api/client";
import { getBackendApiBaseUrl } from "@/lib/env/public-env";
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
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const envelope = await callBackendApi<unknown>({
      baseUrl: backendApiBaseUrl,
      path: "/api/my/companies",
    });
    return ensureListMyCompaniesResponse(envelope.data, "listMyCompanies").items;
  }

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
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const envelope = await callBackendApi<unknown>({
      baseUrl: backendApiBaseUrl,
      path: "/api/my/companies",
      method: "POST",
      body: {
        name: input.name,
        ...(input.contactEmail !== undefined ? { contactEmail: input.contactEmail } : {}),
        ...(input.contactPhone !== undefined ? { contactPhone: input.contactPhone } : {}),
      },
    });
    return ensureCreateCompanyResponse(envelope.data, "createCompany");
  }

  const envelope = await callFirebaseCallable<typeof input, unknown>(
    "createCompany",
    input,
  );
  return ensureCreateCompanyResponse(envelope.data, "createCompany");
}

export async function listCompanyMembersCallable(input: {
  companyId: string;
}): Promise<CompanyMemberSummary[]> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const companyId = input.companyId.trim();
    const envelope = await callBackendApi<unknown>({
      baseUrl: backendApiBaseUrl,
      path: `/api/companies/${encodeURIComponent(companyId)}/members`,
    });
    return ensureListCompanyMembersResponse(envelope.data, "listCompanyMembers").items;
  }

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
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const companyId = input.companyId.trim();
    const envelope = await callBackendApi<unknown>({
      baseUrl: backendApiBaseUrl,
      path: `/api/companies/${encodeURIComponent(companyId)}/members`,
      method: "POST",
      body: {
        email: input.email,
        role: input.role,
      },
    });
    return ensureInviteCompanyMemberResponse(envelope.data, "inviteCompanyMember");
  }

  const envelope = await callFirebaseCallable<typeof input, unknown>(
    "inviteCompanyMember",
    input,
  );
  return ensureInviteCompanyMemberResponse(envelope.data, "inviteCompanyMember");
}

export async function acceptCompanyInviteCallable(input: {
  companyId: string;
}): Promise<AcceptCompanyInviteResponse> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const companyId = input.companyId.trim();
    const envelope = await callBackendApi<unknown>({
      baseUrl: backendApiBaseUrl,
      path: `/api/my/company-invites/${encodeURIComponent(companyId)}/accept`,
      method: "POST",
    });
    return ensureAcceptCompanyInviteResponse(envelope.data, "acceptCompanyInvite");
  }

  const envelope = await callFirebaseCallable<typeof input, unknown>(
    "acceptCompanyInvite",
    input,
  );
  return ensureAcceptCompanyInviteResponse(envelope.data, "acceptCompanyInvite");
}

export async function declineCompanyInviteCallable(input: {
  companyId: string;
}): Promise<DeclineCompanyInviteResponse> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const companyId = input.companyId.trim();
    const envelope = await callBackendApi<unknown>({
      baseUrl: backendApiBaseUrl,
      path: `/api/my/company-invites/${encodeURIComponent(companyId)}/decline`,
      method: "POST",
    });
    return ensureDeclineCompanyInviteResponse(envelope.data, "declineCompanyInvite");
  }

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
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const companyId = input.companyId.trim();
    const memberUid = input.memberUid.trim();
    const envelope = await callBackendApi<unknown>({
      baseUrl: backendApiBaseUrl,
      path: `/api/companies/${encodeURIComponent(companyId)}/members/${encodeURIComponent(memberUid)}`,
      method: "PATCH",
      body: {
        patch: input.patch,
      },
    });
    return ensureUpdateCompanyMemberResponse(envelope.data, "updateCompanyMember");
  }

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
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const companyId = input.companyId.trim();
    const memberUid = input.memberUid.trim();
    const envelope = await callBackendApi<unknown>({
      baseUrl: backendApiBaseUrl,
      path: `/api/companies/${encodeURIComponent(companyId)}/members/${encodeURIComponent(memberUid)}`,
      method: "DELETE",
    });
    return ensureRemoveCompanyMemberResponse(envelope.data, "removeCompanyMember");
  }

  const envelope = await callFirebaseCallable<typeof input, unknown>(
    "removeCompanyMember",
    input,
  );
  return ensureRemoveCompanyMemberResponse(envelope.data, "removeCompanyMember");
}

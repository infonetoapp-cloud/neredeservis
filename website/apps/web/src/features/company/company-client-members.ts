"use client";

import { callBackendApi } from "@/lib/backend-api/client";
import { requireBackendApiBaseUrl } from "@/lib/env/public-env";

import {
  type CompanyDriverCredentialBundle,
  type CompanyDriverItem,
  type CompanyInviteItem,
  type CompanyMemberItem,
  type CompanyMemberRole,
  type CompanyMembershipItem,
  parseCompanyDriverItems,
  parseCompanyDriverCredentialBundle,
  parseCompanyInviteItems,
  parseCompanyMemberItems,
  parseMembershipItems,
  toFriendlyErrorMessage,
} from "./company-client-shared";

function getCompanyBackendApiBaseUrl() {
  return requireBackendApiBaseUrl();
}

function mapMembershipRecord(item: unknown) {
  const record = item as Record<string, unknown>;
  return {
    companyId: record.companyId,
    companyName: record.companyName ?? record.name,
    memberRole: record.memberRole ?? record.role,
    membershipStatus: record.membershipStatus ?? record.memberStatus,
    companyStatus: record.companyStatus ?? "active",
    billingStatus: record.billingStatus ?? "active",
  };
}

function mapInviteRecord(item: unknown) {
  const record = item as Record<string, unknown>;
  return {
    ...record,
    email: record.email ?? record.invitedEmail,
    targetUid: record.targetUid ?? record.invitedUid ?? record.memberUid,
  };
}

export async function listMyCompaniesForCurrentUser(): Promise<CompanyMembershipItem[]> {
  try {
    const response = await callBackendApi<{ items?: unknown[] }>({
      baseUrl: getCompanyBackendApiBaseUrl(),
      path: "/api/my/companies",
    });
    return parseMembershipItems((response.data?.items ?? []).map(mapMembershipRecord));
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function createCompanyForCurrentUser(input: {
  name: string;
}): Promise<CompanyMembershipItem> {
  try {
    const name = input.name.trim();
    const response = await callBackendApi<{
      companyId?: string;
      ownerMember?: {
        role?: string;
        status?: string;
      };
    }>({
      baseUrl: getCompanyBackendApiBaseUrl(),
      path: "/api/my/companies",
      method: "POST",
      body: { name },
    });
    const membership = parseMembershipItems([
      {
        companyId: response.data?.companyId ?? "",
        companyName: name,
        memberRole: response.data?.ownerMember?.role ?? "owner",
        membershipStatus: response.data?.ownerMember?.status ?? "active",
        companyStatus: "active",
        billingStatus: "active",
      },
    ])[0];
    if (!membership) {
      throw new Error("COMPANY_CREATE_RESPONSE_INVALID");
    }
    return membership;
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function listCompanyMembersForCompany(input: {
  companyId: string;
  limit?: number;
}): Promise<CompanyMemberItem[]> {
  try {
    const companyId = input.companyId.trim();
    const query = new URLSearchParams();
    if (typeof input.limit === "number" && Number.isFinite(input.limit)) {
      query.set("limit", String(Math.trunc(input.limit)));
    }

    const response = await callBackendApi<{ items?: unknown }>({
      baseUrl: getCompanyBackendApiBaseUrl(),
      path: `/api/companies/${encodeURIComponent(companyId)}/members${
        query.size > 0 ? `?${query.toString()}` : ""
      }`,
    });
    return parseCompanyMemberItems(response.data?.items);
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function inviteCompanyMemberForCompany(input: {
  companyId: string;
  memberUid: string;
  role: CompanyMemberRole;
}): Promise<CompanyMemberItem> {
  try {
    const companyId = input.companyId.trim();
    const memberUid = input.memberUid.trim();
    const response = await callBackendApi<{
      companyId?: string;
      memberUid?: string;
      role?: string;
      createdAt?: string;
    }>({
      baseUrl: getCompanyBackendApiBaseUrl(),
      path: `/api/companies/${encodeURIComponent(companyId)}/members`,
      method: "POST",
      body: {
        memberUid,
        role: input.role,
      },
    });

    const invitedMember = parseCompanyMemberItems([
      {
        uid: response.data?.memberUid ?? memberUid,
        displayName: null,
        email: null,
        phone: null,
        role: response.data?.role ?? input.role,
        status: "invited",
        companyId: response.data?.companyId ?? companyId,
        createdAt: response.data?.createdAt ?? null,
        updatedAt: response.data?.createdAt ?? null,
      },
    ])[0];
    if (!invitedMember) {
      throw new Error("INVITE_COMPANY_MEMBER_RESPONSE_INVALID");
    }
    return invitedMember;
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function setCompanyMemberRoleForCompany(input: {
  companyId: string;
  memberUid: string;
  role: CompanyMemberRole;
}): Promise<CompanyMemberItem> {
  try {
    const companyId = input.companyId.trim();
    const memberUid = input.memberUid.trim();
    const response = await callBackendApi<{
      companyId?: string;
      memberUid?: string;
      role?: string;
      memberStatus?: string;
      updatedAt?: string;
    }>({
      baseUrl: getCompanyBackendApiBaseUrl(),
      path: `/api/companies/${encodeURIComponent(companyId)}/members/${encodeURIComponent(memberUid)}`,
      method: "PATCH",
      body: {
        patch: { role: input.role },
      },
    });
    const member = parseCompanyMemberItems([
      {
        uid: response.data?.memberUid,
        displayName: null,
        email: null,
        phone: null,
        role: response.data?.role ?? input.role,
        status: response.data?.memberStatus ?? "active",
        companyId: response.data?.companyId ?? companyId,
        createdAt: null,
        updatedAt: response.data?.updatedAt ?? null,
      },
    ])[0];
    if (!member) {
      throw new Error("SET_COMPANY_MEMBER_ROLE_RESPONSE_INVALID");
    }
    return member;
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function listCompanyDriversForCompany(input: {
  companyId: string;
  limit?: number;
}): Promise<CompanyDriverItem[]> {
  try {
    const companyId = input.companyId.trim();
    const query = new URLSearchParams();
    if (typeof input.limit === "number" && Number.isFinite(input.limit)) {
      query.set("limit", String(Math.trunc(input.limit)));
    }

    const response = await callBackendApi<{ items?: unknown }>({
      baseUrl: getCompanyBackendApiBaseUrl(),
      path: `/api/companies/${encodeURIComponent(companyId)}/drivers${
        query.size > 0 ? `?${query.toString()}` : ""
      }`,
    });
    return parseCompanyDriverItems(response.data?.items);
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function createCompanyDriverAccountForCompany(input: {
  companyId: string;
  name: string;
  phone?: string;
  plate?: string;
}): Promise<CompanyDriverCredentialBundle> {
  try {
    const companyId = input.companyId.trim();
    const payload: {
      name: string;
      phone?: string;
      plate?: string;
    } = {
      name: input.name.trim(),
    };
    const phone = input.phone?.trim();
    const plate = input.plate?.trim();
    if (phone) {
      payload.phone = phone;
    }
    if (plate) {
      payload.plate = plate;
    }

    const response = await callBackendApi<{ credentials?: unknown }>({
      baseUrl: getCompanyBackendApiBaseUrl(),
      path: `/api/companies/${encodeURIComponent(companyId)}/drivers`,
      method: "POST",
      body: payload,
    });
    const credentials = parseCompanyDriverCredentialBundle(response.data?.credentials);
    if (!credentials) {
      throw new Error("CREATE_COMPANY_DRIVER_ACCOUNT_RESPONSE_INVALID");
    }
    return credentials;
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function assignCompanyDriverToRouteForCompany(input: {
  companyId: string;
  driverId: string;
  routeId: string;
}): Promise<void> {
  try {
    const companyId = input.companyId.trim();
    const driverId = input.driverId.trim();
    const routeId = input.routeId.trim();
    await callBackendApi<{ route?: unknown }>({
      baseUrl: getCompanyBackendApiBaseUrl(),
      path: `/api/companies/${encodeURIComponent(companyId)}/drivers/${encodeURIComponent(driverId)}/routes/${encodeURIComponent(routeId)}`,
      method: "POST",
    });
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function unassignCompanyDriverFromRouteForCompany(input: {
  companyId: string;
  driverId: string;
  routeId: string;
}): Promise<void> {
  try {
    const companyId = input.companyId.trim();
    const driverId = input.driverId.trim();
    const routeId = input.routeId.trim();
    await callBackendApi<{ route?: unknown }>({
      baseUrl: getCompanyBackendApiBaseUrl(),
      path: `/api/companies/${encodeURIComponent(companyId)}/drivers/${encodeURIComponent(driverId)}/routes/${encodeURIComponent(routeId)}`,
      method: "DELETE",
    });
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function updateCompanyDriverStatusForCompany(input: {
  companyId: string;
  driverId: string;
  status: "active" | "passive";
}): Promise<void> {
  try {
    const companyId = input.companyId.trim();
    const driverId = input.driverId.trim();
    await callBackendApi<{ driverId?: string; status?: string }>({
      baseUrl: getCompanyBackendApiBaseUrl(),
      path: `/api/companies/${encodeURIComponent(companyId)}/drivers/${encodeURIComponent(driverId)}/status`,
      method: "PATCH",
      body: {
        status: input.status,
      },
    });
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function inviteCompanyMemberByEmailForCompany(input: {
  companyId: string;
  email: string;
  role: CompanyMemberRole;
}): Promise<CompanyInviteItem> {
  try {
    const companyId = input.companyId.trim();
    const response = await callBackendApi<{
      companyId?: string;
      inviteId?: string;
      memberUid?: string;
      invitedEmail?: string;
      role?: string;
      status?: string;
      createdAt?: string;
    }>({
      baseUrl: getCompanyBackendApiBaseUrl(),
      path: `/api/companies/${encodeURIComponent(companyId)}/members`,
      method: "POST",
      body: {
        email: input.email.trim(),
        role: input.role,
      },
    });
    const invite = parseCompanyInviteItems([
      {
        inviteId: response.data?.inviteId,
        companyId: response.data?.companyId ?? companyId,
        companyName: "",
        email: response.data?.invitedEmail,
        role: response.data?.role ?? input.role,
        status: response.data?.status ?? "pending",
        targetUid: response.data?.memberUid ?? null,
        invitedBy: null,
        createdAt: response.data?.createdAt ?? null,
        updatedAt: null,
      },
    ])[0];
    if (!invite) {
      throw new Error("INVITE_COMPANY_MEMBER_BY_EMAIL_RESPONSE_INVALID");
    }
    return invite;
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function listCompanyInvitesForCompany(input: {
  companyId: string;
  limit?: number;
}): Promise<CompanyInviteItem[]> {
  try {
    const companyId = input.companyId.trim();
    const query = new URLSearchParams();
    if (typeof input.limit === "number" && Number.isFinite(input.limit)) {
      query.set("limit", String(Math.trunc(input.limit)));
    }

    const response = await callBackendApi<{ invites?: unknown[] }>({
      baseUrl: getCompanyBackendApiBaseUrl(),
      path: `/api/companies/${encodeURIComponent(companyId)}/invites${
        query.size > 0 ? `?${query.toString()}` : ""
      }`,
    });
    return parseCompanyInviteItems((response.data?.invites ?? []).map(mapInviteRecord));
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function revokeCompanyInviteForCompany(input: {
  companyId: string;
  inviteId: string;
}): Promise<CompanyInviteItem> {
  try {
    const companyId = input.companyId.trim();
    const inviteId = input.inviteId.trim();
    const response = await callBackendApi<{
      inviteId?: string;
      companyId?: string;
      companyName?: string;
      invitedEmail?: string;
      role?: string;
      revokedAt?: string;
    }>({
      baseUrl: getCompanyBackendApiBaseUrl(),
      path: `/api/companies/${encodeURIComponent(companyId)}/invites/${encodeURIComponent(inviteId)}`,
      method: "DELETE",
    });
    const invite = parseCompanyInviteItems([
      {
        inviteId: response.data?.inviteId,
        companyId: response.data?.companyId ?? companyId,
        companyName: response.data?.companyName ?? "",
        email: response.data?.invitedEmail,
        role: response.data?.role ?? "viewer",
        status: "revoked",
        targetUid: null,
        invitedBy: null,
        createdAt: null,
        updatedAt: response.data?.revokedAt ?? null,
      },
    ])[0];
    if (!invite) {
      throw new Error("REVOKE_COMPANY_INVITE_RESPONSE_INVALID");
    }
    return invite;
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function listMyPendingCompanyInvitesForCurrentUser(): Promise<CompanyInviteItem[]> {
  try {
    const response = await callBackendApi<{ invites?: unknown }>({
      baseUrl: getCompanyBackendApiBaseUrl(),
      path: "/api/my/company-invites",
    });
    return parseCompanyInviteItems(response.data?.invites);
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function acceptCompanyInviteForCurrentUser(input: {
  companyId: string;
}): Promise<CompanyMembershipItem> {
  try {
    const companyId = input.companyId.trim();
    const response = await callBackendApi<{
      companyId?: string;
      companyName?: string;
      companyStatus?: string;
      billingStatus?: string;
      role?: string;
      memberStatus?: string;
    }>({
      baseUrl: getCompanyBackendApiBaseUrl(),
      path: `/api/my/company-invites/${encodeURIComponent(companyId)}/accept`,
      method: "POST",
    });
    const membership = parseMembershipItems([
      {
        companyId: response.data?.companyId ?? companyId,
        companyName: response.data?.companyName ?? companyId,
        memberRole: response.data?.role,
        membershipStatus: response.data?.memberStatus,
        companyStatus: response.data?.companyStatus ?? "active",
        billingStatus: response.data?.billingStatus ?? "active",
      },
    ])[0];
    if (!membership) {
      throw new Error("ACCEPT_COMPANY_INVITE_RESPONSE_INVALID");
    }
    return membership;
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

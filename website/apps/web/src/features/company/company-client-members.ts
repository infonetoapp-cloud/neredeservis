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
  parseCompanyDriverCredentialBundle,
  parseCompanyDriverItems,
  parseCompanyInviteItems,
  parseCompanyMemberItems,
  parseMembershipItems,
  toFriendlyErrorMessage,
} from "./company-client-shared";

function mapMembershipRecord(value: {
  companyId?: string;
  name?: string;
  role?: string;
  memberStatus?: string;
  companyStatus?: string;
  billingStatus?: string;
}): CompanyMembershipItem {
  const membership = parseMembershipItems([
    {
      companyId: value.companyId ?? "",
      companyName: value.name ?? value.companyId ?? "",
      memberRole: value.role,
      membershipStatus: value.memberStatus,
      companyStatus: value.companyStatus ?? "active",
      billingStatus: value.billingStatus ?? "active",
    },
  ])[0];

  if (!membership) {
    throw new Error("COMPANY_MEMBERSHIP_RESPONSE_INVALID");
  }

  return membership;
}

export async function listMyCompaniesForCurrentUser(): Promise<CompanyMembershipItem[]> {
  try {
    const response = await callBackendApi<{ items?: Array<Record<string, unknown>> }>({
      baseUrl: requireBackendApiBaseUrl(),
      path: "/api/my/companies",
    });
    const rawItems = Array.isArray(response.data?.items) ? response.data.items : [];
    return parseMembershipItems(
      rawItems.map((item) => ({
        companyId: item.companyId,
        companyName: item.name,
        memberRole: item.role,
        membershipStatus: item.memberStatus,
        companyStatus: item.companyStatus ?? "active",
        billingStatus: item.billingStatus ?? "active",
      })),
    );
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
      baseUrl: requireBackendApiBaseUrl(),
      path: "/api/my/companies",
      method: "POST",
      body: { name },
    });
    return mapMembershipRecord({
      companyId: response.data?.companyId,
      name,
      role: response.data?.ownerMember?.role ?? "owner",
      memberStatus: response.data?.ownerMember?.status ?? "active",
      companyStatus: "active",
      billingStatus: "active",
    });
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
      baseUrl: requireBackendApiBaseUrl(),
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
  throw new Error(
    "Dogrudan uye UID daveti desteklenmiyor. E-posta ile davet akisini kullan.",
  );
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
      baseUrl: requireBackendApiBaseUrl(),
      path: `/api/companies/${encodeURIComponent(companyId)}/members/${encodeURIComponent(memberUid)}`,
      method: "PATCH",
      body: {
        patch: { role: input.role },
      },
    });
    const data = response.data;
    if (!data?.memberUid) {
      throw new Error("SET_COMPANY_MEMBER_ROLE_RESPONSE_INVALID");
    }
    return {
      uid: data.memberUid,
      displayName: null,
      email: null,
      phone: null,
      role: (data.role as CompanyMemberRole) ?? input.role,
      status: (data.memberStatus as CompanyMemberItem["status"]) ?? "active",
      companyId: data.companyId ?? input.companyId,
      createdAt: null,
      updatedAt: data.updatedAt ?? null,
    };
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
      baseUrl: requireBackendApiBaseUrl(),
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
      baseUrl: requireBackendApiBaseUrl(),
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
    await callBackendApi({
      baseUrl: requireBackendApiBaseUrl(),
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
    await callBackendApi({
      baseUrl: requireBackendApiBaseUrl(),
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
    await callBackendApi({
      baseUrl: requireBackendApiBaseUrl(),
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
      baseUrl: requireBackendApiBaseUrl(),
      path: `/api/companies/${encodeURIComponent(companyId)}/members`,
      method: "POST",
      body: {
        email: input.email.trim(),
        role: input.role,
      },
    });
    const data = response.data;
    if (!data?.inviteId || !data?.invitedEmail) {
      throw new Error("INVITE_COMPANY_MEMBER_BY_EMAIL_RESPONSE_INVALID");
    }
    return {
      inviteId: data.inviteId,
      companyId: data.companyId ?? input.companyId,
      companyName: "",
      email: data.invitedEmail,
      role: (data.role as CompanyMemberRole) ?? input.role,
      status: (data.status as CompanyInviteItem["status"]) ?? "pending",
      targetUid: data.memberUid ?? null,
      invitedBy: null,
      createdAt: data.createdAt ?? null,
      updatedAt: null,
    };
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
      baseUrl: requireBackendApiBaseUrl(),
      path: `/api/companies/${encodeURIComponent(companyId)}/invites${
        query.size > 0 ? `?${query.toString()}` : ""
      }`,
    });
    const rawInvites = Array.isArray(response.data?.invites) ? response.data.invites : [];
    return parseCompanyInviteItems(
      rawInvites.map((item) => {
        const record = (item ?? {}) as Record<string, unknown>;
        return {
          ...record,
          email: record.email ?? record.invitedEmail,
          targetUid: record.targetUid ?? record.invitedUid,
        };
      }),
    );
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
      baseUrl: requireBackendApiBaseUrl(),
      path: `/api/companies/${encodeURIComponent(companyId)}/invites/${encodeURIComponent(inviteId)}`,
      method: "DELETE",
    });
    const data = response.data;
    if (!data?.inviteId || !data?.invitedEmail) {
      throw new Error("REVOKE_COMPANY_INVITE_RESPONSE_INVALID");
    }
    return {
      inviteId: data.inviteId,
      companyId: data.companyId ?? input.companyId,
      companyName: data.companyName ?? "",
      email: data.invitedEmail,
      role: (data.role as CompanyMemberRole) ?? "viewer",
      status: "revoked",
      targetUid: null,
      invitedBy: null,
      createdAt: null,
      updatedAt: data.revokedAt ?? null,
    };
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function listMyPendingCompanyInvitesForCurrentUser(): Promise<CompanyInviteItem[]> {
  try {
    const response = await callBackendApi<{ invites?: unknown }>({
      baseUrl: requireBackendApiBaseUrl(),
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
      baseUrl: requireBackendApiBaseUrl(),
      path: `/api/my/company-invites/${encodeURIComponent(companyId)}/accept`,
      method: "POST",
    });
    return mapMembershipRecord({
      companyId: response.data?.companyId ?? companyId,
      name: response.data?.companyName ?? companyId,
      role: response.data?.role,
      memberStatus: response.data?.memberStatus,
      companyStatus: response.data?.companyStatus ?? "active",
      billingStatus: response.data?.billingStatus ?? "active",
    });
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

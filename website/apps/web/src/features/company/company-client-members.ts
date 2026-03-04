"use client";

import { httpsCallable } from "firebase/functions";

import { getFirebaseClientFunctions } from "@/lib/firebase/client";

import {
  type ApiOk,
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
export async function listMyCompaniesForCurrentUser(): Promise<CompanyMembershipItem[]> {
  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<unknown, ApiOk<{ items?: unknown[] }>>(functions, "listMyCompanies");
  try {
    const response = await callable({});
    const rawItems = response.data?.data?.items ?? [];
    // Backend returns { companyId, name, role, memberStatus } — map to CompanyMembershipItem
    const mapped = rawItems.map((item: unknown) => {
      const r = item as Record<string, unknown>;
      return {
        companyId: r.companyId,
        companyName: r.name,
        memberRole: r.role,
        membershipStatus: r.memberStatus,
        companyStatus: r.companyStatus ?? "active",
        billingStatus: r.billingStatus ?? "active",
      };
    });
    return parseMembershipItems(mapped);
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function createCompanyForCurrentUser(input: {
  name: string;
}): Promise<CompanyMembershipItem> {
  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<{ name: string }, ApiOk<{ membership?: unknown }>>(
    functions,
    "createCompany",
  );

  try {
    const response = await callable({ name: input.name.trim() });
    const membershipList = parseMembershipItems([response.data?.data?.membership]);
    const firstMembership = membershipList[0];
    if (!firstMembership) {
      throw new Error("COMPANY_CREATE_RESPONSE_INVALID");
    }
    return firstMembership;
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function listCompanyMembersForCompany(input: {
  companyId: string;
  limit?: number;
}): Promise<CompanyMemberItem[]> {
  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<{ companyId: string; limit?: number }, ApiOk<{ items?: unknown }>>(
    functions,
    "listCompanyMembers",
  );

  try {
    const response = await callable({
      companyId: input.companyId.trim(),
      limit: input.limit,
    });
    return parseCompanyMemberItems(response.data?.data?.items);
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function inviteCompanyMemberForCompany(input: {
  companyId: string;
  memberUid: string;
  role: CompanyMemberRole;
}): Promise<CompanyMemberItem> {
  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<
    { companyId: string; memberUid: string; role: CompanyMemberRole },
    ApiOk<{ member?: unknown }>
  >(functions, "inviteCompanyMember");

  try {
    const response = await callable({
      companyId: input.companyId.trim(),
      memberUid: input.memberUid.trim(),
      role: input.role,
    });
    const members = parseCompanyMemberItems([response.data?.data?.member]);
    const member = members[0];
    if (!member) {
      throw new Error("INVITE_COMPANY_MEMBER_RESPONSE_INVALID");
    }
    return member;
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function setCompanyMemberRoleForCompany(input: {
  companyId: string;
  memberUid: string;
  role: CompanyMemberRole;
}): Promise<CompanyMemberItem> {
  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<
    { companyId: string; memberUid: string; patch: { role: CompanyMemberRole } },
    ApiOk<{ companyId?: string; memberUid?: string; role?: string; memberStatus?: string; updatedAt?: string }>
  >(functions, "updateCompanyMember");

  try {
    const response = await callable({
      companyId: input.companyId.trim(),
      memberUid: input.memberUid.trim(),
      patch: { role: input.role },
    });
    const data = response.data?.data;
    if (!data?.memberUid) {
      throw new Error("SET_COMPANY_MEMBER_ROLE_RESPONSE_INVALID");
    }
    // Build a partial CompanyMemberItem from the update response
    const item: CompanyMemberItem = {
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
    return item;
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function listCompanyDriversForCompany(input: {
  companyId: string;
  limit?: number;
}): Promise<CompanyDriverItem[]> {
  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<{ companyId: string; limit?: number }, ApiOk<{ items?: unknown }>>(
    functions,
    "listCompanyDrivers",
  );

  try {
    const response = await callable({
      companyId: input.companyId.trim(),
      limit: input.limit,
    });
    return parseCompanyDriverItems(response.data?.data?.items);
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function createCompanyDriverAccountForCompany(input: {
  companyId: string;
  name: string;
  phone?: string;
  plate?: string;
  loginEmail?: string;
  temporaryPassword?: string;
}): Promise<CompanyDriverCredentialBundle> {
  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<
    {
      companyId: string;
      name: string;
      phone?: string;
      plate?: string;
      loginEmail?: string;
      temporaryPassword?: string;
    },
    ApiOk<{ credentials?: unknown }>
  >(functions, "createCompanyDriverAccount");

  try {
    const response = await callable({
      companyId: input.companyId.trim(),
      name: input.name.trim(),
      phone: input.phone?.trim(),
      plate: input.plate?.trim(),
      loginEmail: input.loginEmail?.trim(),
      temporaryPassword: input.temporaryPassword?.trim(),
    });
    const credentials = parseCompanyDriverCredentialBundle(response.data?.data?.credentials);
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
  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<
    { companyId: string; driverId: string; routeId: string },
    ApiOk<{ route?: unknown }>
  >(functions, "assignCompanyDriverToRoute");

  try {
    await callable({
      companyId: input.companyId.trim(),
      driverId: input.driverId.trim(),
      routeId: input.routeId.trim(),
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
  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<
    { companyId: string; driverId: string; routeId: string },
    ApiOk<{ route?: unknown }>
  >(functions, "unassignCompanyDriverFromRoute");

  try {
    await callable({
      companyId: input.companyId.trim(),
      driverId: input.driverId.trim(),
      routeId: input.routeId.trim(),
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
  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<
    { companyId: string; driverId: string; status: "active" | "passive" },
    ApiOk<{ driverId?: string; status?: string }>
  >(functions, "updateCompanyDriverStatus");

  try {
    await callable({
      companyId: input.companyId.trim(),
      driverId: input.driverId.trim(),
      status: input.status,
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
  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<
    { companyId: string; email: string; role: CompanyMemberRole },
    ApiOk<{ companyId?: string; inviteId?: string; memberUid?: string; invitedEmail?: string; role?: string; status?: string; expiresAt?: string; createdAt?: string }>
  >(functions, "inviteCompanyMember");

  try {
    const response = await callable({
      companyId: input.companyId.trim(),
      email: input.email.trim(),
      role: input.role,
    });
    const data = response.data?.data;
    if (!data?.inviteId || !data?.invitedEmail) {
      throw new Error("INVITE_COMPANY_MEMBER_BY_EMAIL_RESPONSE_INVALID");
    }
    // Map backend field names to frontend CompanyInviteItem
    const invite: CompanyInviteItem = {
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
    return invite;
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function listCompanyInvitesForCompany(input: {
  companyId: string;
  limit?: number;
}): Promise<CompanyInviteItem[]> {
  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<{ companyId: string; limit?: number }, ApiOk<{ invites?: unknown[] }>>(
    functions,
    "listCompanyInvites",
  );

  try {
    const response = await callable({
      companyId: input.companyId.trim(),
      limit: input.limit,
    });
    const rawInvites = response.data?.data?.invites ?? [];
    // Map backend fields (invitedEmail→email, invitedUid→targetUid)
    const mapped = rawInvites.map((item: unknown) => {
      const r = item as Record<string, unknown>;
      return {
        ...r,
        email: r.email ?? r.invitedEmail,
        targetUid: r.targetUid ?? r.invitedUid,
      };
    });
    return parseCompanyInviteItems(mapped);
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function revokeCompanyInviteForCompany(input: {
  companyId: string;
  inviteId: string;
}): Promise<CompanyInviteItem> {
  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<
    { companyId: string; inviteId: string },
    ApiOk<{ inviteId?: string; companyId?: string; companyName?: string; invitedEmail?: string; role?: string; status?: string; revokedAt?: string }>
  >(functions, "revokeCompanyInvite");

  try {
    const response = await callable({
      companyId: input.companyId.trim(),
      inviteId: input.inviteId.trim(),
    });
    const data = response.data?.data;
    if (!data?.inviteId || !data?.invitedEmail) {
      throw new Error("REVOKE_COMPANY_INVITE_RESPONSE_INVALID");
    }
    const invite: CompanyInviteItem = {
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
    return invite;
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function listMyPendingCompanyInvitesForCurrentUser(): Promise<CompanyInviteItem[]> {
  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<unknown, ApiOk<{ invites?: unknown }>>(
    functions,
    "listMyPendingCompanyInvites",
  );

  try {
    const response = await callable({});
    return parseCompanyInviteItems(response.data?.data?.invites);
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function acceptCompanyInviteForCurrentUser(input: {
  companyId: string;
}): Promise<CompanyMembershipItem> {
  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<{ companyId: string }, ApiOk<{ membership?: unknown }>>(
    functions,
    "acceptCompanyInvite",
  );

  try {
    const response = await callable({
      companyId: input.companyId.trim(),
    });
    const memberships = parseMembershipItems([response.data?.data?.membership]);
    const membership = memberships[0];
    if (!membership) {
      throw new Error("ACCEPT_COMPANY_INVITE_RESPONSE_INVALID");
    }
    return membership;
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

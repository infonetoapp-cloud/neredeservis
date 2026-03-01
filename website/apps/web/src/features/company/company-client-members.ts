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

  const callable = httpsCallable<unknown, ApiOk<{ memberships?: unknown }>>(functions, "listMyCompanies");
  try {
    const response = await callable({});
    return parseMembershipItems(response.data?.data?.memberships);
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

  const callable = httpsCallable<{ companyId: string; limit?: number }, ApiOk<{ members?: unknown }>>(
    functions,
    "listCompanyMembers",
  );

  try {
    const response = await callable({
      companyId: input.companyId.trim(),
      limit: input.limit,
    });
    return parseCompanyMemberItems(response.data?.data?.members);
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
    { companyId: string; memberUid: string; role: CompanyMemberRole },
    ApiOk<{ member?: unknown }>
  >(functions, "setCompanyMemberRole");

  try {
    const response = await callable({
      companyId: input.companyId.trim(),
      memberUid: input.memberUid.trim(),
      role: input.role,
    });
    const members = parseCompanyMemberItems([response.data?.data?.member]);
    const member = members[0];
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
  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<{ companyId: string; limit?: number }, ApiOk<{ drivers?: unknown }>>(
    functions,
    "listCompanyDrivers",
  );

  try {
    const response = await callable({
      companyId: input.companyId.trim(),
      limit: input.limit,
    });
    return parseCompanyDriverItems(response.data?.data?.drivers);
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
    ApiOk<{ invite?: unknown }>
  >(functions, "inviteCompanyMemberByEmail");

  try {
    const response = await callable({
      companyId: input.companyId.trim(),
      email: input.email.trim(),
      role: input.role,
    });
    const invites = parseCompanyInviteItems([response.data?.data?.invite]);
    const invite = invites[0];
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
  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<{ companyId: string; limit?: number }, ApiOk<{ invites?: unknown }>>(
    functions,
    "listCompanyInvites",
  );

  try {
    const response = await callable({
      companyId: input.companyId.trim(),
      limit: input.limit,
    });
    return parseCompanyInviteItems(response.data?.data?.invites);
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

  const callable = httpsCallable<{ companyId: string; inviteId: string }, ApiOk<{ invite?: unknown }>>(
    functions,
    "revokeCompanyInvite",
  );

  try {
    const response = await callable({
      companyId: input.companyId.trim(),
      inviteId: input.inviteId.trim(),
    });
    const invites = parseCompanyInviteItems([response.data?.data?.invite]);
    const invite = invites[0];
    if (!invite) {
      throw new Error("REVOKE_COMPANY_INVITE_RESPONSE_INVALID");
    }
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

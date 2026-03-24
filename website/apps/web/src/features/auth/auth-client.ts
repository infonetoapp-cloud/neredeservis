"use client";

import { callBackendApi } from "@/lib/backend-api/client";
import type { AuthSessionProviderInfo, AuthSessionUser } from "@/features/auth/auth-session-types";
import { setClientSessionCookie } from "@/lib/auth/session-cookie-client";
import { getBackendApiBaseUrl } from "@/lib/env/public-env";

export type AuthStateSnapshot = {
  user: AuthSessionUser | null;
  resolved: boolean;
};

export type AuthStateListener = (snapshot: AuthStateSnapshot) => void;
export type WebAccessBlockReason = "DRIVER_MOBILE_ONLY_WEB_BLOCK";

export type CurrentUserWebAccessPolicy = {
  role: string | null;
  allowWebPanel: boolean;
  reason: WebAccessBlockReason | null;
};

type LoginOrRegisterResponse = {
  user?: unknown;
  verificationEmailSent?: boolean;
};

type PasswordResetResponse = {
  success?: boolean;
  delivery?: string;
  resetUrl?: string;
};

type AuthProfileResponse = {
  user?: unknown;
};

const authStateListeners = new Set<AuthStateListener>();
let currentAuthSessionUser: AuthSessionUser | null = null;
let currentAuthSessionResolved = false;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeProviderData(value: unknown): AuthSessionProviderInfo[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const providers: AuthSessionProviderInfo[] = [];
  for (const item of value) {
    if (!isRecord(item)) {
      continue;
    }
    const providerId = typeof item.providerId === "string" ? item.providerId.trim() : "";
    if (providerId) {
      providers.push({ providerId });
    }
  }
  return providers;
}

function normalizeAuthSessionUser(value: unknown): AuthSessionUser | null {
  if (!isRecord(value)) {
    return null;
  }

  const uid = typeof value.uid === "string" ? value.uid.trim() : "";
  if (!uid) {
    return null;
  }

  return {
    uid,
    email: typeof value.email === "string" ? value.email : null,
    displayName: typeof value.displayName === "string" ? value.displayName : null,
    emailVerified: value.emailVerified === true,
    providerData: normalizeProviderData(value.providerData),
    signInProvider: typeof value.signInProvider === "string" ? value.signInProvider : null,
    role: typeof value.role === "string" ? value.role : null,
    phone: typeof value.phone === "string" ? value.phone : null,
    photoUrl: typeof value.photoUrl === "string" ? value.photoUrl : null,
    photoPath: typeof value.photoPath === "string" ? value.photoPath : null,
    mobileOnlyAuth: value.mobileOnlyAuth === true,
    webPanelAccess: typeof value.webPanelAccess === "boolean" ? value.webPanelAccess : null,
    isAnonymous: value.isAnonymous === true,
  };
}

function emitAuthState() {
  const snapshot = readAuthStateSnapshot();
  for (const listener of authStateListeners) {
    listener(snapshot);
  }
}

function commitAuthState(user: AuthSessionUser | null, resolved = true) {
  currentAuthSessionUser = user;
  currentAuthSessionResolved = resolved;
  setClientSessionCookie(Boolean(user));
  emitAuthState();
}

function buildBackendUnavailableError(): Error & { code: string } {
  const error = new Error("Backend auth baglantisi eksik.") as Error & { code: string };
  error.code = "BACKEND_API_MISSING";
  return error;
}

function buildUnsupportedAuthMethodError(): Error & { code: string } {
  const error = new Error("Bu giris yontemi web panelde desteklenmiyor.") as Error & {
    code: string;
  };
  error.code = "auth/operation-not-supported-in-this-environment";
  return error;
}

async function callAuthApi<T>(input: {
  path: string;
  method?: string;
  body?: unknown;
  auth?: boolean;
}): Promise<T | null> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (!backendApiBaseUrl) {
    throw buildBackendUnavailableError();
  }

  const response = await callBackendApi<T>({
    baseUrl: backendApiBaseUrl,
    path: input.path,
    method: input.method,
    body: input.body,
    auth: input.auth,
  });
  return response.data ?? null;
}

export function readAuthStateSnapshot(): AuthStateSnapshot {
  return {
    user: currentAuthSessionUser,
    resolved: currentAuthSessionResolved,
  };
}

export function subscribeAuthState(listener: AuthStateListener): (() => void) | null {
  authStateListeners.add(listener);
  listener(readAuthStateSnapshot());
  return () => {
    authStateListeners.delete(listener);
  };
}

export async function refreshCurrentAuthSession(): Promise<AuthSessionUser | null> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (!backendApiBaseUrl) {
    commitAuthState(null, true);
    return null;
  }

  try {
    const sessionData = await callAuthApi<{ user?: unknown }>({
      path: "api/auth/session",
    });
    const user = normalizeAuthSessionUser(sessionData?.user);
    commitAuthState(user, true);
    return user;
  } catch (error) {
    const status = (error as { status?: number } | null)?.status;
    const code = (error as { code?: string } | null)?.code;
    if (status === 401 || code === "unauthenticated") {
      commitAuthState(null, true);
      return null;
    }
    throw error;
  }
}

export async function signInWithEmailPassword(input: {
  email: string;
  password: string;
}): Promise<void> {
  const response = await callAuthApi<LoginOrRegisterResponse>({
    path: "api/auth/login",
    method: "POST",
    auth: false,
    body: {
      email: input.email.trim(),
      password: input.password,
    },
  });
  const user = normalizeAuthSessionUser(response?.user);
  if (!user) {
    throw new Error("AUTH_LOGIN_RESPONSE_INVALID");
  }
  commitAuthState(user, true);
}

export async function registerWithEmailPassword(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<{ verificationEmailSent: boolean }> {
  const response = await callAuthApi<LoginOrRegisterResponse>({
    path: "api/auth/register",
    method: "POST",
    auth: false,
    body: {
      email: input.email.trim(),
      password: input.password,
      ...(input.displayName.trim() ? { displayName: input.displayName.trim() } : {}),
    },
  });
  const user = normalizeAuthSessionUser(response?.user);
  if (!user) {
    throw new Error("AUTH_REGISTER_RESPONSE_INVALID");
  }
  commitAuthState(user, true);
  return {
    verificationEmailSent: response?.verificationEmailSent === true,
  };
}

export async function signInWithGooglePopup(): Promise<void> {
  throw buildUnsupportedAuthMethodError();
}

export async function signInWithMicrosoftPopup(): Promise<void> {
  throw buildUnsupportedAuthMethodError();
}

export async function signOutCurrentUser(): Promise<void> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (!backendApiBaseUrl) {
    commitAuthState(null, true);
    return;
  }

  try {
    await callAuthApi<{ success?: boolean }>({
      path: "api/auth/logout",
      method: "POST",
      auth: false,
      body: {},
    });
  } finally {
    commitAuthState(null, true);
  }
}

export async function sendEmailVerificationForCurrentUser(): Promise<void> {
  throw buildUnsupportedAuthMethodError();
}

export async function reloadCurrentUserSession(): Promise<AuthSessionUser | null> {
  return refreshCurrentAuthSession();
}

export async function updateCurrentUserProfile(input: {
  displayName: string;
}): Promise<void> {
  const response = await callAuthApi<AuthProfileResponse>({
    path: "api/auth/profile",
    method: "PATCH",
    body: {
      displayName: input.displayName.trim(),
    },
  });
  const user = normalizeAuthSessionUser(response?.user);
  if (!user) {
    throw new Error("AUTH_PROFILE_RESPONSE_INVALID");
  }
  commitAuthState(user, true);
}

export async function sendPasswordResetEmailForAddress(email: string): Promise<PasswordResetResponse> {
  const normalized = email.trim();
  if (!normalized) {
    const error = new Error("EMAIL_REQUIRED");
    (error as { code?: string }).code = "auth/missing-email";
    throw error;
  }

  const response = await callAuthApi<PasswordResetResponse>({
    path: "api/auth/password-reset",
    method: "POST",
    auth: false,
    body: { email: normalized },
  });
  return response ?? { success: true };
}

export async function readCurrentUserWebAccessPolicy(): Promise<CurrentUserWebAccessPolicy> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (!backendApiBaseUrl) {
    return {
      role: null,
      allowWebPanel: true,
      reason: null,
    };
  }

  try {
    const response = await callBackendApi<CurrentUserWebAccessPolicy>({
      baseUrl: backendApiBaseUrl,
      path: "api/auth/web-access-policy",
    });
    return response.data ?? {
      role: null,
      allowWebPanel: true,
      reason: null,
    };
  } catch {
    return {
      role: null,
      allowWebPanel: true,
      reason: null,
    };
  }
}

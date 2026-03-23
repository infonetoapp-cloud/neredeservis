"use client";

import { callBackendApi } from "@/lib/backend-api/client";
import { setClientSessionCookie } from "@/lib/auth/session-cookie-client";
import { getBackendApiBaseUrl } from "@/lib/env/public-env";

import type { AuthSessionUser } from "./auth-session-types";

export type AuthStateListener = (user: AuthSessionUser | null) => void;
export type WebAccessBlockReason = "DRIVER_MOBILE_ONLY_WEB_BLOCK";

export type CurrentUserWebAccessPolicy = {
  role: string | null;
  allowWebPanel: boolean;
  reason: WebAccessBlockReason | null;
};

export type EmailPasswordRegistrationResult = {
  verificationEmailSent: boolean;
};

export type PasswordResetRequestResult = {
  delivery: "email" | "manual";
  resetUrl: string | null;
};

export const AUTH_SESSION_CHANGED_EVENT_NAME = "ns-auth-session-changed";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function createAuthClientError(message: string, code?: string) {
  const error = new Error(message) as Error & { code?: string };
  if (code) {
    error.code = code;
  }
  return error;
}

function requireAuthBackendApiBaseUrl(): string {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (!backendApiBaseUrl) {
    throw createAuthClientError(
      "BACKEND_AUTH_UNAVAILABLE",
      "auth/operation-not-supported-in-this-environment",
    );
  }
  return backendApiBaseUrl;
}

function parseBackendSessionUser(value: unknown): AuthSessionUser | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const uid = typeof record.uid === "string" ? record.uid.trim() : "";
  if (!uid) {
    return null;
  }

  const providerData = Array.isArray(record.providerData)
    ? record.providerData
        .map((provider) => {
          const providerRecord = asRecord(provider);
          if (!providerRecord) {
            return null;
          }

          return {
            providerId:
              typeof providerRecord.providerId === "string" ? providerRecord.providerId : null,
          };
        })
        .filter((provider): provider is { providerId: string | null } => provider !== null)
    : [];

  return {
    uid,
    email: typeof record.email === "string" ? record.email : null,
    displayName: typeof record.displayName === "string" ? record.displayName : null,
    emailVerified: record.emailVerified === true,
    providerData,
  };
}

export function notifyAuthSessionChanged(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT_NAME));
}

export async function readCurrentAuthSessionFromBackend(): Promise<AuthSessionUser | null> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (!backendApiBaseUrl) {
    return null;
  }

  try {
    const response = await callBackendApi<{ user?: unknown }>({
      baseUrl: backendApiBaseUrl,
      path: "api/auth/session",
    });
    return parseBackendSessionUser(asRecord(response.data)?.user);
  } catch (error) {
    const status = (error as { status?: number } | null)?.status ?? null;
    const code = (error as { code?: string } | null)?.code ?? null;
    if (status === 401 || code === "unauthenticated") {
      return null;
    }
    throw error;
  }
}

export function subscribeAuthState(_listener: AuthStateListener): (() => void) | null {
  return null;
}

export async function signInWithEmailPassword(input: {
  email: string;
  password: string;
}): Promise<void> {
  await callBackendApi<{ user?: unknown }>({
    baseUrl: requireAuthBackendApiBaseUrl(),
    path: "api/auth/login",
    method: "POST",
    auth: false,
    body: {
      email: input.email.trim(),
      password: input.password,
    },
  });
  setClientSessionCookie(true);
  notifyAuthSessionChanged();
}

export async function registerWithEmailPassword(input: {
  email: string;
  password: string;
  displayName?: string;
}): Promise<EmailPasswordRegistrationResult> {
  const response = await callBackendApi<{ verificationEmailSent?: unknown }>({
    baseUrl: requireAuthBackendApiBaseUrl(),
    path: "api/auth/register",
    method: "POST",
    auth: false,
    body: {
      email: input.email.trim(),
      password: input.password,
      displayName: input.displayName?.trim() || undefined,
    },
  });
  setClientSessionCookie(true);
  notifyAuthSessionChanged();
  return {
    verificationEmailSent: asRecord(response.data)?.verificationEmailSent === true,
  };
}

export async function signInWithGooglePopup(): Promise<void> {
  throw createAuthClientError(
    "SOCIAL_LOGIN_UNAVAILABLE",
    "auth/operation-not-supported-in-this-environment",
  );
}

export async function signInWithMicrosoftPopup(): Promise<void> {
  throw createAuthClientError(
    "SOCIAL_LOGIN_UNAVAILABLE",
    "auth/operation-not-supported-in-this-environment",
  );
}

export async function signOutCurrentUser(): Promise<void> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    try {
      await callBackendApi<{ success?: boolean }>({
        baseUrl: backendApiBaseUrl,
        path: "api/auth/logout",
        method: "POST",
        auth: false,
      });
    } catch {
      // Continue with local cleanup even if logout request fails.
    }
  }

  setClientSessionCookie(false);
  notifyAuthSessionChanged();
}

export async function sendEmailVerificationForCurrentUser(): Promise<void> {
  throw createAuthClientError(
    "EMAIL_VERIFICATION_RESEND_UNAVAILABLE",
    "auth/operation-not-supported-in-this-environment",
  );
}

export async function reloadCurrentUserSession(): Promise<AuthSessionUser | null> {
  const backendUser = await readCurrentAuthSessionFromBackend();
  setClientSessionCookie(Boolean(backendUser));
  notifyAuthSessionChanged();
  return backendUser;
}

export async function updateCurrentUserProfile(input: {
  displayName: string;
}): Promise<void> {
  await callBackendApi<{ user?: unknown }>({
    baseUrl: requireAuthBackendApiBaseUrl(),
    path: "api/auth/profile",
    method: "PATCH",
    auth: false,
    body: {
      displayName: input.displayName.trim(),
    },
  });
  setClientSessionCookie(true);
  notifyAuthSessionChanged();
}

export async function sendPasswordResetEmailForAddress(
  email: string,
): Promise<PasswordResetRequestResult> {
  const normalized = email.trim();
  if (!normalized) {
    throw createAuthClientError("EMAIL_REQUIRED", "auth/missing-email");
  }

  const response = await callBackendApi<{
    success?: unknown;
    delivery?: unknown;
    resetUrl?: unknown;
  }>({
    baseUrl: requireAuthBackendApiBaseUrl(),
    path: "api/auth/password-reset",
    method: "POST",
    auth: false,
    body: { email: normalized },
  });

  const responseData = asRecord(response.data);
  return {
    delivery: responseData?.delivery === "manual" ? "manual" : "email",
    resetUrl: typeof responseData?.resetUrl === "string" ? responseData.resetUrl : null,
  };
}

export async function verifyPasswordResetCodeForFlow(
  oobCode: string,
): Promise<{ email: string | null }> {
  const normalizedCode = oobCode.trim();
  if (!normalizedCode) {
    throw createAuthClientError("OOB_CODE_REQUIRED", "auth/invalid-action-code");
  }

  const response = await callBackendApi<{ email?: unknown }>({
    baseUrl: requireAuthBackendApiBaseUrl(),
    path: "api/auth/password-reset/verify",
    method: "POST",
    auth: false,
    body: { oobCode: normalizedCode },
  });
  const responseData = asRecord(response.data);
  return {
    email: typeof responseData?.email === "string" ? responseData.email : null,
  };
}

export async function confirmPasswordResetForFlow(input: {
  oobCode: string;
  password: string;
}): Promise<void> {
  const normalizedCode = input.oobCode.trim();
  if (!normalizedCode) {
    throw createAuthClientError("OOB_CODE_REQUIRED", "auth/invalid-action-code");
  }

  await callBackendApi<{ success?: boolean }>({
    baseUrl: requireAuthBackendApiBaseUrl(),
    path: "api/auth/password-reset/confirm",
    method: "POST",
    auth: false,
    body: { oobCode: normalizedCode, password: input.password },
  });
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

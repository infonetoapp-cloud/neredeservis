"use client";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  reload,
  sendEmailVerification,
  type User,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { callBackendApi } from "@/lib/backend-api/client";
import { setClientSessionCookie } from "@/lib/auth/session-cookie-client";
import { getBackendApiBaseUrl } from "@/lib/env/public-env";
import { getFirebaseClientAuth, getFirebaseClientFirestore } from "@/lib/firebase/client";

import type { AuthSessionUser } from "./auth-session-types";

export type AuthStateListener = (user: AuthSessionUser | null) => void;
export type WebAccessBlockReason = "DRIVER_MOBILE_ONLY_WEB_BLOCK";

export type CurrentUserWebAccessPolicy = {
  role: string | null;
  allowWebPanel: boolean;
  reason: WebAccessBlockReason | null;
};

export const AUTH_SESSION_CHANGED_EVENT_NAME = "ns-auth-session-changed";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function mapFirebaseUserToAuthSessionUser(user: User | null): AuthSessionUser | null {
  if (!user) {
    return null;
  }

  return {
    uid: user.uid,
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    emailVerified: user.emailVerified === true,
    providerData: Array.isArray(user.providerData)
      ? user.providerData.map((provider) => ({
          providerId: typeof provider.providerId === "string" ? provider.providerId : null,
        }))
      : [],
  };
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

async function exchangeCurrentFirebaseSessionForBackendCookie(): Promise<void> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  const auth = getFirebaseClientAuth();
  const currentUser = auth?.currentUser;

  if (!currentUser) {
    setClientSessionCookie(false);
    notifyAuthSessionChanged();
    return;
  }

  if (!backendApiBaseUrl) {
    setClientSessionCookie(true);
    notifyAuthSessionChanged();
    return;
  }

  const idToken = await currentUser.getIdToken();
  await callBackendApi<{ user?: unknown }>({
    baseUrl: backendApiBaseUrl,
    path: "api/auth/session/exchange",
    method: "POST",
    auth: false,
    body: { idToken },
  });
  setClientSessionCookie(true);
  notifyAuthSessionChanged();
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

export function subscribeAuthState(listener: AuthStateListener): (() => void) | null {
  const auth = getFirebaseClientAuth();
  if (!auth) {
    return null;
  }
  return onAuthStateChanged(auth, (user) => listener(mapFirebaseUserToAuthSessionUser(user)));
}

export async function signInWithEmailPassword(input: {
  email: string;
  password: string;
}): Promise<void> {
  const auth = getFirebaseClientAuth();
  if (!auth) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  await signInWithEmailAndPassword(auth, input.email.trim(), input.password);
  await exchangeCurrentFirebaseSessionForBackendCookie();
}

export async function registerWithEmailPassword(input: {
  email: string;
  password: string;
}): Promise<void> {
  const auth = getFirebaseClientAuth();
  if (!auth) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
  await exchangeCurrentFirebaseSessionForBackendCookie();
}

export async function signInWithGooglePopup(): Promise<void> {
  const auth = getFirebaseClientAuth();
  if (!auth) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  await signInWithPopup(auth, provider);
  await exchangeCurrentFirebaseSessionForBackendCookie();
}

export async function signInWithMicrosoftPopup(): Promise<void> {
  const auth = getFirebaseClientAuth();
  if (!auth) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const provider = new OAuthProvider("microsoft.com");
  provider.setCustomParameters({ prompt: "select_account" });
  await signInWithPopup(auth, provider);
  await exchangeCurrentFirebaseSessionForBackendCookie();
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
      // Continue with local sign-out cleanup.
    }
  }

  const auth = getFirebaseClientAuth();
  if (auth) {
    await signOut(auth);
  }

  setClientSessionCookie(false);
  notifyAuthSessionChanged();
}

export async function sendEmailVerificationForCurrentUser(): Promise<void> {
  const auth = getFirebaseClientAuth();
  if (!auth) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    const error = new Error("USER_NOT_AUTHENTICATED");
    (error as { code?: string }).code = "auth/user-not-found";
    throw error;
  }

  await sendEmailVerification(currentUser);
}

export async function reloadCurrentUserSession(): Promise<AuthSessionUser | null> {
  const auth = getFirebaseClientAuth();
  const currentUser = auth?.currentUser ?? null;

  if (currentUser) {
    await reload(currentUser);
  }

  const backendUser = await readCurrentAuthSessionFromBackend();
  if (backendUser) {
    setClientSessionCookie(true);
    notifyAuthSessionChanged();
    return backendUser;
  }

  const mappedUser = mapFirebaseUserToAuthSessionUser(auth?.currentUser ?? null);
  setClientSessionCookie(Boolean(mappedUser));
  notifyAuthSessionChanged();
  return mappedUser;
}

export async function updateCurrentUserProfile(input: {
  displayName: string;
}): Promise<void> {
  const auth = getFirebaseClientAuth();
  if (!auth) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    const error = new Error("USER_NOT_AUTHENTICATED");
    (error as { code?: string }).code = "auth/user-not-found";
    throw error;
  }

  await updateProfile(currentUser, { displayName: input.displayName.trim() });
  await reload(currentUser);
  notifyAuthSessionChanged();
}

export async function sendPasswordResetEmailForAddress(email: string): Promise<void> {
  const normalized = email.trim();
  if (!normalized) {
    const error = new Error("EMAIL_REQUIRED");
    (error as { code?: string }).code = "auth/missing-email";
    throw error;
  }

  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    await callBackendApi<{ success: boolean }>({
      baseUrl: backendApiBaseUrl,
      path: "api/auth/password-reset",
      method: "POST",
      auth: false,
      body: { email: normalized },
    });
    return;
  }

  const auth = getFirebaseClientAuth();
  if (!auth) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  await sendPasswordResetEmail(auth, normalized);
}

export async function readCurrentUserWebAccessPolicy(): Promise<CurrentUserWebAccessPolicy> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
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

  const auth = getFirebaseClientAuth();
  const currentUser = auth?.currentUser;
  if (!auth || !currentUser) {
    return {
      role: null,
      allowWebPanel: true,
      reason: null,
    };
  }

  const firestore = getFirebaseClientFirestore();
  if (!firestore) {
    return {
      role: null,
      allowWebPanel: true,
      reason: null,
    };
  }

  try {
    const userSnap = await getDoc(doc(firestore, "users", currentUser.uid));
    const userData = userSnap.data();
    const rawRole = typeof userData?.role === "string" ? userData.role.trim().toLowerCase() : null;
    const forceMobileOnly = userData?.mobileOnlyAuth === true || userData?.webPanelAccess === false;
    if (rawRole === "driver" && forceMobileOnly) {
      return {
        role: rawRole,
        allowWebPanel: false,
        reason: "DRIVER_MOBILE_ONLY_WEB_BLOCK",
      };
    }
    if (rawRole === "driver") {
      return {
        role: rawRole,
        allowWebPanel: false,
        reason: "DRIVER_MOBILE_ONLY_WEB_BLOCK",
      };
    }

    return {
      role: rawRole,
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

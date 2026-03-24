"use client";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  reload,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
  updateProfile,
} from "firebase/auth";

import { callBackendApi } from "@/lib/backend-api/client";
import { setClientSessionCookie } from "@/lib/auth/session-cookie-client";
import { getBackendApiBaseUrl } from "@/lib/env/public-env";
import { getFirebaseClientAuth } from "@/lib/firebase/client";

export type AuthStateListener = (user: User | null) => void;
export type WebAccessBlockReason = "DRIVER_MOBILE_ONLY_WEB_BLOCK";

export type CurrentUserWebAccessPolicy = {
  role: string | null;
  allowWebPanel: boolean;
  reason: WebAccessBlockReason | null;
};

export function subscribeAuthState(listener: AuthStateListener): (() => void) | null {
  const auth = getFirebaseClientAuth();
  if (!auth) {
    return null;
  }
  return onAuthStateChanged(auth, listener);
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
  setClientSessionCookie(true);
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
  setClientSessionCookie(true);
}

export async function signInWithGooglePopup(): Promise<void> {
  const auth = getFirebaseClientAuth();
  if (!auth) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  await signInWithPopup(auth, provider);
  setClientSessionCookie(true);
}

export async function signInWithMicrosoftPopup(): Promise<void> {
  const auth = getFirebaseClientAuth();
  if (!auth) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const provider = new OAuthProvider("microsoft.com");
  provider.setCustomParameters({ prompt: "select_account" });
  await signInWithPopup(auth, provider);
  setClientSessionCookie(true);
}

export async function signOutCurrentUser(): Promise<void> {
  const auth = getFirebaseClientAuth();
  if (!auth) {
    return;
  }
  await signOut(auth);
  setClientSessionCookie(false);
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

export async function reloadCurrentUserSession(): Promise<User | null> {
  const auth = getFirebaseClientAuth();
  if (!auth) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    return null;
  }

  await reload(currentUser);
  return auth.currentUser;
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
  const auth = getFirebaseClientAuth();
  const currentUser = auth?.currentUser;
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (!auth || !currentUser || !backendApiBaseUrl) {
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

"use client";

import { callBackendApi } from "@/lib/backend-api/client";
import { setClientSessionCookie } from "@/lib/auth/session-cookie-client";
import { getBackendApiBaseUrl } from "@/lib/env/public-env";

import type { AuthSessionUser } from "./auth-session-types";

type FirebaseAuthModule = typeof import("firebase/auth");
type FirebaseFirestoreModule = typeof import("firebase/firestore");
type FirebaseClientModule = typeof import("@/lib/firebase/client");
type FirebaseRuntime = {
  authModule: FirebaseAuthModule;
  firestoreModule: FirebaseFirestoreModule;
  clientModule: FirebaseClientModule;
};
type FirebaseUserLike = {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  providerData: Array<{ providerId: string | null }>;
  getIdToken?: () => Promise<string>;
};

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

export const AUTH_SESSION_CHANGED_EVENT_NAME = "ns-auth-session-changed";

let firebaseRuntimePromise: Promise<FirebaseRuntime> | null = null;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function mapFirebaseUserToAuthSessionUser(user: FirebaseUserLike | null): AuthSessionUser | null {
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

async function loadFirebaseRuntime(): Promise<FirebaseRuntime> {
  if (!firebaseRuntimePromise) {
    firebaseRuntimePromise = Promise.all([
      import("firebase/auth"),
      import("firebase/firestore"),
      import("@/lib/firebase/client"),
    ]).then(([authModule, firestoreModule, clientModule]) => ({
      authModule,
      firestoreModule,
      clientModule,
    }));
  }

  return firebaseRuntimePromise;
}

async function readCurrentFirebaseUser(): Promise<FirebaseUserLike | null> {
  const { clientModule } = await loadFirebaseRuntime();
  const auth = clientModule.getFirebaseClientAuth();
  return (auth?.currentUser as FirebaseUserLike | null | undefined) ?? null;
}

export function notifyAuthSessionChanged(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT_NAME));
}

async function exchangeCurrentFirebaseSessionForBackendCookie(): Promise<void> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  const currentUser = await readCurrentFirebaseUser();

  if (!currentUser?.getIdToken) {
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
  let unsubscribe: (() => void) | null = null;
  let cancelled = false;

  void loadFirebaseRuntime()
    .then(({ authModule, clientModule }) => {
      if (cancelled) {
        return;
      }
      const auth = clientModule.getFirebaseClientAuth();
      if (!auth) {
        return;
      }
      unsubscribe = authModule.onAuthStateChanged(auth, (user) =>
        listener(mapFirebaseUserToAuthSessionUser(user as FirebaseUserLike | null)),
      );
    })
    .catch(() => {
      unsubscribe = null;
    });

  return () => {
    cancelled = true;
    unsubscribe?.();
  };
}

export async function signInWithEmailPassword(input: {
  email: string;
  password: string;
}): Promise<void> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    await callBackendApi<{ user?: unknown }>({
      baseUrl: backendApiBaseUrl,
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
    return;
  }

  const { authModule, clientModule } = await loadFirebaseRuntime();
  const auth = clientModule.getFirebaseClientAuth();
  if (!auth) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  await authModule.signInWithEmailAndPassword(auth, input.email.trim(), input.password);
  await exchangeCurrentFirebaseSessionForBackendCookie();
}

export async function registerWithEmailPassword(input: {
  email: string;
  password: string;
  displayName?: string;
}): Promise<EmailPasswordRegistrationResult> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const response = await callBackendApi<{ verificationEmailSent?: unknown }>({
      baseUrl: backendApiBaseUrl,
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

  const { authModule, clientModule } = await loadFirebaseRuntime();
  const auth = clientModule.getFirebaseClientAuth();
  if (!auth) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  await authModule.createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
  await exchangeCurrentFirebaseSessionForBackendCookie();
  return { verificationEmailSent: false };
}

export async function signInWithGooglePopup(): Promise<void> {
  const { authModule, clientModule } = await loadFirebaseRuntime();
  const auth = clientModule.getFirebaseClientAuth();
  if (!auth) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const provider = new authModule.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  await authModule.signInWithPopup(auth, provider);
  await exchangeCurrentFirebaseSessionForBackendCookie();
}

export async function signInWithMicrosoftPopup(): Promise<void> {
  const { authModule, clientModule } = await loadFirebaseRuntime();
  const auth = clientModule.getFirebaseClientAuth();
  if (!auth) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const provider = new authModule.OAuthProvider("microsoft.com");
  provider.setCustomParameters({ prompt: "select_account" });
  await authModule.signInWithPopup(auth, provider);
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

  const { authModule, clientModule } = await loadFirebaseRuntime().catch(() => ({
    authModule: null,
    clientModule: null,
  }));
  const auth = clientModule?.getFirebaseClientAuth?.();
  if (auth && authModule) {
    await authModule.signOut(auth);
  }

  setClientSessionCookie(false);
  notifyAuthSessionChanged();
}

export async function sendEmailVerificationForCurrentUser(): Promise<void> {
  if (getBackendApiBaseUrl()) {
    const error = new Error("EMAIL_VERIFICATION_RESEND_UNAVAILABLE");
    (error as { code?: string }).code = "auth/operation-not-supported-in-this-environment";
    throw error;
  }

  const { authModule, clientModule } = await loadFirebaseRuntime();
  const auth = clientModule.getFirebaseClientAuth();
  if (!auth) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    const error = new Error("USER_NOT_AUTHENTICATED");
    (error as { code?: string }).code = "auth/user-not-found";
    throw error;
  }

  await authModule.sendEmailVerification(currentUser);
}

export async function reloadCurrentUserSession(): Promise<AuthSessionUser | null> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const backendUser = await readCurrentAuthSessionFromBackend();
    setClientSessionCookie(Boolean(backendUser));
    notifyAuthSessionChanged();
    return backendUser;
  }

  const { authModule, clientModule } = await loadFirebaseRuntime();
  const auth = clientModule.getFirebaseClientAuth();
  const currentUser = auth?.currentUser ?? null;

  if (currentUser) {
    await authModule.reload(currentUser);
  }

  const mappedUser = mapFirebaseUserToAuthSessionUser(
    (auth?.currentUser as FirebaseUserLike | null | undefined) ?? null,
  );
  setClientSessionCookie(Boolean(mappedUser));
  notifyAuthSessionChanged();
  return mappedUser;
}

export async function updateCurrentUserProfile(input: {
  displayName: string;
}): Promise<void> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    await callBackendApi<{ user?: unknown }>({
      baseUrl: backendApiBaseUrl,
      path: "api/auth/profile",
      method: "PATCH",
      auth: false,
      body: {
        displayName: input.displayName.trim(),
      },
    });
    setClientSessionCookie(true);
    notifyAuthSessionChanged();
    return;
  }

  const { authModule, clientModule } = await loadFirebaseRuntime();
  const auth = clientModule.getFirebaseClientAuth();
  if (!auth) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    const error = new Error("USER_NOT_AUTHENTICATED");
    (error as { code?: string }).code = "auth/user-not-found";
    throw error;
  }

  await authModule.updateProfile(currentUser, { displayName: input.displayName.trim() });
  await authModule.reload(currentUser);
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

  const { authModule, clientModule } = await loadFirebaseRuntime();
  const auth = clientModule.getFirebaseClientAuth();
  if (!auth) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  await authModule.sendPasswordResetEmail(auth, normalized);
}

export async function verifyPasswordResetCodeForFlow(
  oobCode: string,
): Promise<{ email: string | null }> {
  const normalizedCode = oobCode.trim();
  if (!normalizedCode) {
    const error = new Error("OOB_CODE_REQUIRED");
    (error as { code?: string }).code = "auth/invalid-action-code";
    throw error;
  }

  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const response = await callBackendApi<{ email?: unknown }>({
      baseUrl: backendApiBaseUrl,
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

  const { authModule, clientModule } = await loadFirebaseRuntime();
  const auth = clientModule.getFirebaseClientAuth();
  if (!auth) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const email = await authModule.verifyPasswordResetCode(auth, normalizedCode);
  return { email: typeof email === "string" ? email : null };
}

export async function confirmPasswordResetForFlow(input: {
  oobCode: string;
  password: string;
}): Promise<void> {
  const normalizedCode = input.oobCode.trim();
  if (!normalizedCode) {
    const error = new Error("OOB_CODE_REQUIRED");
    (error as { code?: string }).code = "auth/invalid-action-code";
    throw error;
  }

  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    await callBackendApi<{ success?: boolean }>({
      baseUrl: backendApiBaseUrl,
      path: "api/auth/password-reset/confirm",
      method: "POST",
      auth: false,
      body: { oobCode: normalizedCode, password: input.password },
    });
    return;
  }

  const { authModule, clientModule } = await loadFirebaseRuntime();
  const auth = clientModule.getFirebaseClientAuth();
  if (!auth) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  await authModule.confirmPasswordReset(auth, normalizedCode, input.password);
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

  const { firestoreModule, clientModule } = await loadFirebaseRuntime();
  const auth = clientModule.getFirebaseClientAuth();
  const currentUser = auth?.currentUser;
  if (!auth || !currentUser) {
    return {
      role: null,
      allowWebPanel: true,
      reason: null,
    };
  }

  const firestore = clientModule.getFirebaseClientFirestore();
  if (!firestore) {
    return {
      role: null,
      allowWebPanel: true,
      reason: null,
    };
  }

  try {
    const userSnap = await firestoreModule.getDoc(
      firestoreModule.doc(firestore, "users", currentUser.uid),
    );
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

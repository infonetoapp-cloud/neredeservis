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

import { setClientSessionCookie } from "@/lib/auth/session-cookie-client";
import { getFirebaseClientAuth, getFirebaseClientFirestore } from "@/lib/firebase/client";

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
  const auth = getFirebaseClientAuth();
  if (!auth) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const normalized = email.trim();
  if (!normalized) {
    const error = new Error("EMAIL_REQUIRED");
    (error as { code?: string }).code = "auth/missing-email";
    throw error;
  }

  await sendPasswordResetEmail(auth, normalized);
}

export async function readCurrentUserWebAccessPolicy(): Promise<CurrentUserWebAccessPolicy> {
  const auth = getFirebaseClientAuth();
  const firestore = getFirebaseClientFirestore();
  const currentUser = auth?.currentUser;
  if (!auth || !firestore || !currentUser) {
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

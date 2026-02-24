"use client";

import {
  GoogleAuthProvider,
  type User,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";

import { getFirebaseClientAuth } from "@/lib/firebase/client";

export type AuthStateListener = (user: User | null) => void;

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
}

export async function signInWithGooglePopup(): Promise<void> {
  const auth = getFirebaseClientAuth();
  if (!auth) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  await signInWithPopup(auth, provider);
}

export async function signOutCurrentUser(): Promise<void> {
  const auth = getFirebaseClientAuth();
  if (!auth) {
    return;
  }
  await signOut(auth);
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

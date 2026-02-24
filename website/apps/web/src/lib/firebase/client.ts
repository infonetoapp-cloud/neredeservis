import "client-only";

import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

import { getFirebasePublicConfigOrNull } from "@/lib/env/firebase-public-config";

let authSingleton: Auth | null = null;

export function getFirebaseClientApp(): FirebaseApp | null {
  const config = getFirebasePublicConfigOrNull();
  if (!config) {
    return null;
  }

  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp(config);
}

export function getFirebaseClientAuth(): Auth | null {
  if (authSingleton) {
    return authSingleton;
  }

  const app = getFirebaseClientApp();
  if (!app) {
    return null;
  }

  authSingleton = getAuth(app);
  return authSingleton;
}

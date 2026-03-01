import "client-only";

import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getDatabase, type Database } from "firebase/database";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFunctions, type Functions } from "firebase/functions";

import { getFirebasePublicConfigOrNull } from "@/lib/env/firebase-public-config";
import { getFirebaseFunctionsRegion } from "@/lib/env/public-env";

let authSingleton: Auth | null = null;
let databaseSingleton: Database | null = null;
let firestoreSingleton: Firestore | null = null;
let functionsSingleton: Functions | null = null;

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

export function getFirebaseClientDatabase(): Database | null {
  if (databaseSingleton) {
    return databaseSingleton;
  }

  const app = getFirebaseClientApp();
  if (!app) {
    return null;
  }

  databaseSingleton = getDatabase(app);
  return databaseSingleton;
}

export function getFirebaseClientFirestore(): Firestore | null {
  if (firestoreSingleton) {
    return firestoreSingleton;
  }

  const app = getFirebaseClientApp();
  if (!app) {
    return null;
  }

  firestoreSingleton = getFirestore(app);
  return firestoreSingleton;
}

export function getFirebaseClientFunctions(): Functions | null {
  if (functionsSingleton) {
    return functionsSingleton;
  }

  const app = getFirebaseClientApp();
  if (!app) {
    return null;
  }

  functionsSingleton = getFunctions(app, getFirebaseFunctionsRegion());
  return functionsSingleton;
}

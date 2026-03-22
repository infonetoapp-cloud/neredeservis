import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import { getFirestore } from "firebase-admin/firestore";

function readServiceAccountFromEnv() {
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64?.trim();
  if (base64) {
    return JSON.parse(Buffer.from(base64, "base64").toString("utf8"));
  }

  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (rawJson) {
    return JSON.parse(rawJson);
  }

  return null;
}

function resolveProjectId(serviceAccount) {
  return (
    serviceAccount?.project_id?.trim?.() ||
    process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    null
  );
}

function resolveDatabaseUrl() {
  return (
    process.env.FIREBASE_DATABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL?.trim() ||
    null
  );
}

function initializeFirebaseAdminApp() {
  const serviceAccount = readServiceAccountFromEnv();
  const projectId = resolveProjectId(serviceAccount);
  const databaseURL = resolveDatabaseUrl();

  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount),
      databaseURL: databaseURL ?? undefined,
      projectId: projectId ?? undefined,
    });
  }

  return initializeApp({
    databaseURL: databaseURL ?? undefined,
    projectId: projectId ?? undefined,
  });
}

export function getFirebaseAdminApp() {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeFirebaseAdminApp();
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}

export function getFirebaseAdminRtdb() {
  return getDatabase(getFirebaseAdminApp());
}

let optionalRtdbResolved = false;
let optionalRtdb = null;
let optionalDbResolved = false;
let optionalDb = null;

export function getOptionalFirebaseAdminDb() {
  if (optionalDbResolved) {
    return optionalDb;
  }

  optionalDbResolved = true;
  try {
    optionalDb = getFirebaseAdminDb();
  } catch (error) {
    console.warn(
      JSON.stringify({
        level: "warn",
        event: "firebase_firestore_unavailable",
        message: error instanceof Error ? error.message : "unknown_error",
      }),
    );
    optionalDb = null;
  }

  return optionalDb;
}

export function getOptionalFirebaseAdminRtdb() {
  if (optionalRtdbResolved) {
    return optionalRtdb;
  }

  optionalRtdbResolved = true;
  try {
    optionalRtdb = getFirebaseAdminRtdb();
  } catch (error) {
    console.warn(
      JSON.stringify({
        level: "warn",
        event: "firebase_rtdb_unavailable",
        message: error instanceof Error ? error.message : "unknown_error",
      }),
    );
    optionalRtdb = null;
  }

  return optionalRtdb;
}

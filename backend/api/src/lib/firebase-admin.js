import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
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

function initializeFirebaseAdminApp() {
  const serviceAccount = readServiceAccountFromEnv();
  const projectId = resolveProjectId(serviceAccount);

  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: projectId ?? undefined,
    });
  }

  return initializeApp({
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

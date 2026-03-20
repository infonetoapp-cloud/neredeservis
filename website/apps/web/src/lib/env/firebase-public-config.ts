export type FirebasePublicConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  databaseURL: string;
  appId?: string;
  storageBucket?: string;
};

type RequiredKey =
  | "NEXT_PUBLIC_FIREBASE_API_KEY"
  | "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
  | "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
  | "NEXT_PUBLIC_FIREBASE_DATABASE_URL";

const REQUIRED_FIREBASE_KEYS: readonly RequiredKey[] = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_DATABASE_URL",
];

export type PublicConfigValidation = {
  ok: boolean;
  missingFirebaseKeys: RequiredKey[];
  missingNonBlockingKeys: string[];
};

const NEXT_PUBLIC_FIREBASE_API_KEY = (process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "").trim();
const NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "").trim();
const NEXT_PUBLIC_FIREBASE_PROJECT_ID = (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "").trim();
const NEXT_PUBLIC_FIREBASE_DATABASE_URL = (process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ?? "").trim();
const NEXT_PUBLIC_FIREBASE_APP_ID = (process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "").trim();
const NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "").trim();
const NEXT_PUBLIC_MAPBOX_TOKEN = (process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "").trim();
const NEXT_PUBLIC_APP_NAME = (process.env.NEXT_PUBLIC_APP_NAME ?? "").trim();
const NEXT_PUBLIC_APP_ENV = (process.env.NEXT_PUBLIC_APP_ENV ?? "").trim();

const REQUIRED_VALUE_MAP: Record<RequiredKey, string> = {
  NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

export function getPublicConfigValidation(): PublicConfigValidation {
  const missingFirebaseKeys = REQUIRED_FIREBASE_KEYS.filter((key) => !REQUIRED_VALUE_MAP[key]);

  const missingNonBlockingKeys: string[] = [];
  if (!NEXT_PUBLIC_MAPBOX_TOKEN) {
    missingNonBlockingKeys.push("NEXT_PUBLIC_MAPBOX_TOKEN");
  }
  if (!NEXT_PUBLIC_APP_NAME) {
    missingNonBlockingKeys.push("NEXT_PUBLIC_APP_NAME");
  }
  if (!NEXT_PUBLIC_APP_ENV) {
    missingNonBlockingKeys.push("NEXT_PUBLIC_APP_ENV");
  }
  if (!NEXT_PUBLIC_FIREBASE_APP_ID) {
    missingNonBlockingKeys.push("NEXT_PUBLIC_FIREBASE_APP_ID (web app registration pending / optional for auth+rtdb bootstrap)");
  }

  return {
    ok: missingFirebaseKeys.length === 0,
    missingFirebaseKeys,
    missingNonBlockingKeys,
  };
}

export function getFirebasePublicConfigOrNull(): FirebasePublicConfig | null {
  const validation = getPublicConfigValidation();
  if (!validation.ok) {
    return null;
  }

  const appId = NEXT_PUBLIC_FIREBASE_APP_ID;
  const storageBucket = NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  return {
    apiKey: NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    databaseURL: NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    ...(appId ? { appId } : {}),
    ...(storageBucket ? { storageBucket } : {}),
  };
}

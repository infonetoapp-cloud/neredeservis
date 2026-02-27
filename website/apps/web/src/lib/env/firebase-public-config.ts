import type { FirebaseOptions } from "firebase/app";

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

const PUBLIC_ENV = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  NEXT_PUBLIC_FIREBASE_DATABASE_URL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ?? "",
  NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "",
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ?? "",
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV ?? "",
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
} as const;

function read(name: keyof typeof PUBLIC_ENV): string {
  return PUBLIC_ENV[name].trim();
}

export function getPublicConfigValidation(): PublicConfigValidation {
  const missingFirebaseKeys = REQUIRED_FIREBASE_KEYS.filter((key) => !read(key));

  const missingNonBlockingKeys: string[] = [];
  if (!read("NEXT_PUBLIC_MAPBOX_TOKEN")) {
    missingNonBlockingKeys.push("NEXT_PUBLIC_MAPBOX_TOKEN");
  }
  if (!read("NEXT_PUBLIC_APP_NAME")) {
    missingNonBlockingKeys.push("NEXT_PUBLIC_APP_NAME");
  }
  if (!read("NEXT_PUBLIC_APP_ENV")) {
    missingNonBlockingKeys.push("NEXT_PUBLIC_APP_ENV");
  }
  if (!read("NEXT_PUBLIC_FIREBASE_APP_ID")) {
    missingNonBlockingKeys.push("NEXT_PUBLIC_FIREBASE_APP_ID (web app registration pending / optional for auth+rtdb bootstrap)");
  }

  return {
    ok: missingFirebaseKeys.length === 0,
    missingFirebaseKeys,
    missingNonBlockingKeys,
  };
}

export function getFirebasePublicConfigOrNull(): FirebaseOptions | null {
  const validation = getPublicConfigValidation();
  if (!validation.ok) {
    return null;
  }

  const appId = read("NEXT_PUBLIC_FIREBASE_APP_ID");
  const storageBucket = read("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");

  return {
    apiKey: read("NEXT_PUBLIC_FIREBASE_API_KEY"),
    authDomain: read("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
    projectId: read("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
    databaseURL: read("NEXT_PUBLIC_FIREBASE_DATABASE_URL"),
    ...(appId ? { appId } : {}),
    ...(storageBucket ? { storageBucket } : {}),
  };
}

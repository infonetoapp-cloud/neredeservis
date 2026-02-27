const appEnv = (process.env.NEXT_PUBLIC_APP_ENV ?? "dev").trim().toLowerCase();
const appName = (process.env.NEXT_PUBLIC_APP_NAME ?? "NeredeServis Web").trim();
const googleLoginFlag = (process.env.NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN ?? "true")
  .trim()
  .toLowerCase();
const emailLoginFlag = (process.env.NEXT_PUBLIC_ENABLE_EMAIL_LOGIN ?? "true")
  .trim()
  .toLowerCase();
const microsoftLoginFlag = (process.env.NEXT_PUBLIC_ENABLE_MICROSOFT_LOGIN ?? "true")
  .trim()
  .toLowerCase();
const devFastLoginEmail = (process.env.NEXT_PUBLIC_DEV_FAST_LOGIN_EMAIL ?? "").trim();
const devFastLoginPassword = (
  process.env.NEXT_PUBLIC_DEV_FAST_LOGIN_PASSWORD ?? ""
).trim();
const publicMapboxToken = (process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "").trim();
const adminSurfaceFlag = (process.env.NEXT_PUBLIC_ENABLE_ADMIN_SURFACE ?? "false")
  .trim()
  .toLowerCase();

export function getPublicAppEnv(): string {
  return appEnv;
}

export function isDevAppEnv(): boolean {
  return appEnv === "dev";
}

export function getPublicAppName(): string {
  return appName || "NeredeServis Web";
}

export function isGoogleLoginEnabled(): boolean {
  return googleLoginFlag !== "false";
}

export function isEmailLoginEnabled(): boolean {
  return emailLoginFlag !== "false";
}

export function isMicrosoftLoginEnabled(): boolean {
  return microsoftLoginFlag !== "false";
}

export function getDevFastLoginCredentials():
  | { email: string; password: string }
  | null {
  if (!isDevAppEnv()) {
    return null;
  }
  if (!devFastLoginEmail || !devFastLoginPassword) {
    return null;
  }
  return {
    email: devFastLoginEmail,
    password: devFastLoginPassword,
  };
}

export function getPublicMapboxToken(): string | null {
  return publicMapboxToken.length > 0 ? publicMapboxToken : null;
}

export function isAdminSurfaceEnabled(): boolean {
  return adminSurfaceFlag === "true";
}

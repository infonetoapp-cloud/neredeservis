const appEnv = (process.env.NEXT_PUBLIC_APP_ENV ?? "dev").trim().toLowerCase();
const appName = (process.env.NEXT_PUBLIC_APP_NAME ?? "NeredeServis Web").trim();
const googleLoginFlag = (process.env.NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN ?? "true")
  .trim()
  .toLowerCase();
const microsoftLoginFlag = (process.env.NEXT_PUBLIC_ENABLE_MICROSOFT_LOGIN ?? "true")
  .trim()
  .toLowerCase();
const emailLoginFlag = (process.env.NEXT_PUBLIC_ENABLE_EMAIL_LOGIN ?? "true")
  .trim()
  .toLowerCase();
const requireEmailVerificationFlag = (process.env.NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION ?? "true")
  .trim()
  .toLowerCase();
const requireProfileOnboardingFlag = (process.env.NEXT_PUBLIC_REQUIRE_PROFILE_ONBOARDING ?? "true")
  .trim()
  .toLowerCase();
const devFastLoginEmail = (process.env.NEXT_PUBLIC_DEV_FAST_LOGIN_EMAIL ?? "").trim();
const devFastLoginPassword = (
  process.env.NEXT_PUBLIC_DEV_FAST_LOGIN_PASSWORD ?? ""
).trim();
const devCompanyIdsRaw = (process.env.NEXT_PUBLIC_DEV_COMPANY_IDS ?? "").trim();
const defaultLiveRouteId = (process.env.NEXT_PUBLIC_DEFAULT_LIVE_ROUTE_ID ?? "").trim();
const functionsRegion = (process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION ?? "europe-west3")
  .trim()
  .toLowerCase();
const mapboxToken = (process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "").trim();
const forceUpdateLockFlag = (process.env.NEXT_PUBLIC_FORCE_UPDATE_LOCK ?? "false")
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

export function isMicrosoftLoginEnabled(): boolean {
  return microsoftLoginFlag !== "false";
}

export function isEmailLoginEnabled(): boolean {
  return emailLoginFlag !== "false";
}

export function isEmailVerificationRequired(): boolean {
  return requireEmailVerificationFlag !== "false";
}

export function isProfileOnboardingRequired(): boolean {
  return requireProfileOnboardingFlag !== "false";
}

export function getDevCompanyIds(): string[] {
  if (!devCompanyIdsRaw) {
    return [];
  }
  return devCompanyIdsRaw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

export function getDefaultLiveRouteId(): string | null {
  return defaultLiveRouteId || null;
}

export function getFirebaseFunctionsRegion(): string {
  return functionsRegion || "europe-west3";
}

export function getMapboxToken(): string | null {
  return mapboxToken || null;
}

export function isForceUpdateLockEnabled(): boolean {
  return forceUpdateLockFlag === "true";
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

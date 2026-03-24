export function getPublicAppEnv(): string {
  return (process.env.NEXT_PUBLIC_APP_ENV ?? "dev").trim().toLowerCase();
}

export function getBackendApiBaseUrl(): string | null {
  const value = (process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL ?? "").trim();
  return value || null;
}

export function requireBackendApiBaseUrl(): string {
  const value = getBackendApiBaseUrl();
  if (!value) {
    throw new Error("BACKEND_API_BASE_URL_MISSING");
  }
  return value;
}

export function isDevAppEnv(): boolean {
  return getPublicAppEnv() === "dev";
}

export function getPublicAppName(): string {
  const appName = (process.env.NEXT_PUBLIC_APP_NAME ?? "NeredeServis Web").trim();
  return appName || "NeredeServis Web";
}

export function isGoogleLoginEnabled(): boolean {
  const flag = (process.env.NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN ?? "false").trim().toLowerCase();
  return flag === "true";
}

export function isMicrosoftLoginEnabled(): boolean {
  const flag = (process.env.NEXT_PUBLIC_ENABLE_MICROSOFT_LOGIN ?? "false")
    .trim()
    .toLowerCase();
  return flag === "true";
}

export function isEmailLoginEnabled(): boolean {
  const flag = (process.env.NEXT_PUBLIC_ENABLE_EMAIL_LOGIN ?? "true").trim().toLowerCase();
  return flag !== "false";
}

export function isEmailVerificationRequired(): boolean {
  const flag = (process.env.NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION ?? "true")
    .trim()
    .toLowerCase();
  return flag !== "false";
}

export function isProfileOnboardingRequired(): boolean {
  const flag = (process.env.NEXT_PUBLIC_REQUIRE_PROFILE_ONBOARDING ?? "true")
    .trim()
    .toLowerCase();
  return flag !== "false";
}

export function getDevCompanyIds(): string[] {
  const devCompanyIdsRaw = (process.env.NEXT_PUBLIC_DEV_COMPANY_IDS ?? "").trim();
  if (!devCompanyIdsRaw) {
    return [];
  }
  return devCompanyIdsRaw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

export function getDefaultLiveRouteId(): string | null {
  const defaultLiveRouteId = (process.env.NEXT_PUBLIC_DEFAULT_LIVE_ROUTE_ID ?? "").trim();
  return defaultLiveRouteId || null;
}

export function getFirebaseFunctionsRegion(): string {
  const functionsRegion = (
    process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION ?? "europe-west3"
  )
    .trim()
    .toLowerCase();
  return functionsRegion || "europe-west3";
}

export function getMapboxToken(): string | null {
  const mapboxToken = (process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "").trim();
  return mapboxToken || null;
}

export function getTurnstileSiteKey(): string | null {
  const siteKey = (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "").trim();
  return siteKey || null;
}

// Backward-compatible alias used by legacy dashboard components.
export function getPublicMapboxToken(): string | null {
  return getMapboxToken();
}

export function isAdminSurfaceEnabled(): boolean {
  const flag = (process.env.NEXT_PUBLIC_ENABLE_ADMIN_SURFACE ?? "false")
    .trim()
    .toLowerCase();
  return flag === "true";
}

export function getPlatformOwnerUid(): string | null {
  return null;
}

export function isPlatformOwner(uid: string | null | undefined): boolean {
  void uid;
  return false;
}

export function isForceUpdateLockEnabled(): boolean {
  const flag = (process.env.NEXT_PUBLIC_FORCE_UPDATE_LOCK ?? "false")
    .trim()
    .toLowerCase();
  return flag === "true";
}

export function getDevFastLoginCredentials():
  | { email: string; password: string }
  | null {
  const devFastLoginEmail = (process.env.NEXT_PUBLIC_DEV_FAST_LOGIN_EMAIL ?? "").trim();
  const devFastLoginPassword = (
    process.env.NEXT_PUBLIC_DEV_FAST_LOGIN_PASSWORD ?? ""
  ).trim();

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

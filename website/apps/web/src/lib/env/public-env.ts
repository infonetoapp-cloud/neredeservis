export function getPublicAppEnv(): string {
  return (process.env.NEXT_PUBLIC_APP_ENV ?? "dev").trim().toLowerCase();
}

const PROD_BACKEND_API_FALLBACK = "https://api.neredeservis.app";

export function getBackendApiBaseUrl(): string | null {
  const value = (process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL ?? "").trim();
  if (value) {
    return value;
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname.trim().toLowerCase();
    if (
      hostname === "app.neredeservis.app" ||
      hostname === "neredeservis.app" ||
      hostname.endsWith(".neredeservis.app")
    ) {
      return PROD_BACKEND_API_FALLBACK;
    }
  }

  if (getPublicAppEnv() === "prod") {
    return PROD_BACKEND_API_FALLBACK;
  }

  return null;
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

export function getPublicMapTileUrl(): string {
  const tileUrl = (process.env.NEXT_PUBLIC_MAP_TILE_URL ?? "").trim();
  return tileUrl || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
}

export function getPublicMapTileAttribution(): string {
  const attribution = (process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION ?? "").trim();
  return attribution || "&copy; OpenStreetMap contributors";
}

export function getPublicMapTileMaxZoom(): number {
  const raw = Number.parseInt(String(process.env.NEXT_PUBLIC_MAP_TILE_MAX_ZOOM ?? ""), 10);
  if (!Number.isFinite(raw)) {
    return 19;
  }
  return Math.max(1, Math.min(raw, 22));
}

export function getTurnstileSiteKey(): string | null {
  const siteKey = (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "").trim();
  return siteKey || null;
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

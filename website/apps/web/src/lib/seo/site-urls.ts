const DEFAULT_MARKETING_BASE_URL = "https://neredeservis.app";
const DEFAULT_PANEL_BASE_URL = "https://app.neredeservis.app";

function normalizeBaseUrl(rawValue: string | undefined, fallback: string): string {
  const trimmed = (rawValue ?? "").trim();
  if (!trimmed) return fallback;

  const candidate = trimmed.startsWith("http://") || trimmed.startsWith("https://")
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    parsed.pathname = "/";
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return fallback;
  }
}

const marketingBaseUrl = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_SITE_URL,
  DEFAULT_MARKETING_BASE_URL,
);
const panelBaseUrl = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_PANEL_URL,
  DEFAULT_PANEL_BASE_URL,
);

const PANEL_ROUTE_PREFIXES = [
  "/giris",
  "/login",
  "/register",
  "/forgot-password",
  "/set-password",
  "/verify-email",
  "/select-company",
  "/dashboard",
  "/drivers",
  "/vehicles",
  "/routes",
  "/live-ops",
  "/platform",
  "/select-mode",
  "/mode-select",
  "/onboarding/profile",
  "/c/",
] as const;

export function getMarketingBaseUrl(): string {
  return marketingBaseUrl;
}

export function getPanelBaseUrl(): string {
  return panelBaseUrl;
}

export function toAbsoluteUrl(baseUrl: string, path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (normalizedPath === "/") {
    return baseUrl;
  }
  return `${baseUrl}${normalizedPath}`;
}

function isPanelPath(pathname: string): boolean {
  return PANEL_ROUTE_PREFIXES.some((prefix) =>
    prefix.endsWith("/")
      ? pathname.startsWith(prefix)
      : pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function resolveMarketingHref(rawHref: string): string {
  const href = rawHref.trim();

  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return href;
  }

  try {
    const parsed = new URL(href, marketingBaseUrl);

    if (!isPanelPath(parsed.pathname)) {
      return href;
    }

    const normalizedPath =
      parsed.pathname === "/"
        ? "/"
        : `${parsed.pathname}${parsed.search}${parsed.hash}`;

    return toAbsoluteUrl(panelBaseUrl, normalizedPath);
  } catch {
    return href;
  }
}

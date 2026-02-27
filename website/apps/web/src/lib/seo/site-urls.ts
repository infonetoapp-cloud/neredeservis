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

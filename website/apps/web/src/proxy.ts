import { NextResponse, type NextRequest } from "next/server";

const APEX_HOST = "neredeservis.app";
const WWW_HOST = "www.neredeservis.app";
const APP_HOST = "app.neredeservis.app";

const PANEL_PATH_PREFIXES = [
  "/giris",
  "/login",
  "/select-company",
  "/dashboard",
  "/drivers",
  "/vehicles",
  "/routes",
  "/live-ops",
  "/platform",
] as const;

function getRequestHost(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host") ?? "";
  return host.split(":")[0].toLowerCase();
}

function isPanelPath(pathname: string): boolean {
  return PANEL_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function redirectToHost(request: NextRequest, hostname: string): NextResponse {
  const url = request.nextUrl.clone();
  url.hostname = hostname;
  url.protocol = "https:";
  url.port = "";
  return NextResponse.redirect(url, 308);
}

export function proxy(request: NextRequest): NextResponse {
  const host = getRequestHost(request);
  const pathname = request.nextUrl.pathname;

  if (host === WWW_HOST) {
    // Keep a single canonical marketing host.
    return redirectToHost(request, APEX_HOST);
  }

  if (host === APEX_HOST && isPanelPath(pathname)) {
    // Panel/auth routes should live under the panel subdomain.
    return redirectToHost(request, APP_HOST);
  }

  if (host === APP_HOST && (pathname === "/" || pathname === "/login")) {
    // Panel root and legacy login route should land on canonical auth entry.
    const url = request.nextUrl.clone();
    url.hostname = APP_HOST;
    url.pathname = "/giris";
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip framework/static assets and direct file requests.
    "/((?!_next|favicon.ico|.*\\..*).*)",
  ],
};

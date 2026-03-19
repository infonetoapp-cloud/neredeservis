import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const LOGIN_PATH = "/login";
const APP_LOCK_PATH = "/app-locked";
const DEFAULT_SIGNED_IN_PATH = "/select-company";
const WEB_AUTH_SESSION_COOKIE_NAME = "ns_session";
const WEB_AUTH_SESSION_COOKIE_SIGNED_IN_VALUE = "1";
const FORCE_UPDATE_LOCK_ENABLED =
  (process.env.NEXT_PUBLIC_FORCE_UPDATE_LOCK ?? "false").trim().toLowerCase() === "true";

function isProtectedPath(pathname: string): boolean {
  return (
    pathname === "/select-mode" ||
    pathname === "/mode-select" ||
    pathname === "/select-company" ||
    pathname === "/verify-email" ||
    pathname === "/onboarding/profile" ||
    pathname === "/dashboard" ||
    pathname.startsWith("/c/")
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const switchAccountRequested = request.nextUrl.searchParams.get("switch") === "1";
  if (FORCE_UPDATE_LOCK_ENABLED && pathname !== APP_LOCK_PATH) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = APP_LOCK_PATH;
    redirectUrl.search = "";
    redirectUrl.protocol = "https:";
    redirectUrl.port = "";
    redirectUrl.searchParams.set("reason", "force_update");
    return NextResponse.redirect(redirectUrl);
  }

  const hasSessionCookie =
    request.cookies.get(WEB_AUTH_SESSION_COOKIE_NAME)?.value ===
    WEB_AUTH_SESSION_COOKIE_SIGNED_IN_VALUE;

  if (pathname === LOGIN_PATH && hasSessionCookie && !switchAccountRequested) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = DEFAULT_SIGNED_IN_PATH;
    redirectUrl.search = "";
    redirectUrl.protocol = "https:";
    redirectUrl.port = "";
    return NextResponse.redirect(redirectUrl);
  }

  // NOTE:
  // Protected route auth is enforced by DashboardAuthGate on the client.
  // We intentionally do not hard-redirect from middleware based only on a JS-written
  // cookie to avoid redirect loops when the cookie is missing/blocked/stale.
  // The cookie is kept as a best-effort fast path for /login -> /select-company.
  void isProtectedPath;

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/app-locked",
    "/select-mode",
    "/mode-select",
    "/select-company",
    "/verify-email",
    "/onboarding/profile",
    "/dashboard",
    "/c/:path*",
  ],
};

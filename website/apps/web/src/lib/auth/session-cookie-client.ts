"use client";

import {
  WEB_AUTH_SESSION_COOKIE_MAX_AGE_SECONDS,
  WEB_AUTH_SESSION_COOKIE_NAME,
  WEB_AUTH_SESSION_COOKIE_SIGNED_IN_VALUE,
} from "@/lib/auth/session-cookie-constants";

function cookieSecuritySuffix(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return window.location.protocol === "https:" ? "; Secure" : "";
}

export function setClientSessionCookie(signedIn: boolean): void {
  if (typeof document === "undefined") {
    return;
  }

  if (signedIn) {
    document.cookie = `${WEB_AUTH_SESSION_COOKIE_NAME}=${WEB_AUTH_SESSION_COOKIE_SIGNED_IN_VALUE}; Path=/; Max-Age=${WEB_AUTH_SESSION_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${cookieSecuritySuffix()}`;
    return;
  }

  document.cookie = `${WEB_AUTH_SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${cookieSecuritySuffix()}`;
}

"use client";

import {
  WEB_AUTH_SESSION_COOKIE_NAME,
  WEB_AUTH_SESSION_COOKIE_SIGNED_IN_VALUE,
} from "@/lib/auth/session-cookie-constants";

type BackendApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
  };
};

export type BackendApiEnvelope<T> = {
  requestId?: string;
  serverTime?: string;
  data?: T;
};

export async function callBackendApi<T>(input: {
  baseUrl: string;
  path: string;
  method?: string;
  body?: unknown;
  auth?: boolean;
}): Promise<BackendApiEnvelope<T>> {
  const authRequired = input.auth !== false;
  const requestUrl = new URL(input.path, ensureTrailingSlash(input.baseUrl));
  let response = await fetchWithOptionalIdToken(requestUrl.toString(), input, null);

  if (authRequired && response.status === 401) {
    const fallbackIdToken = await readFallbackFirebaseIdToken();
    if (fallbackIdToken) {
      response = await fetchWithOptionalIdToken(requestUrl.toString(), input, fallbackIdToken);
    }
  }

  const payload = (await response.json().catch(() => null)) as
    | BackendApiEnvelope<T>
    | BackendApiErrorPayload
    | null;

  if (!response.ok) {
    const errorCode =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      payload.error &&
      typeof payload.error === "object" &&
      typeof payload.error.code === "string"
        ? payload.error.code
        : null;
    const errorMessage =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      payload.error &&
      typeof payload.error === "object" &&
      typeof payload.error.message === "string"
        ? payload.error.message
        : "Beklenmeyen bir API hatasi olustu.";
    const error = new Error(errorMessage) as Error & { code?: string; status?: number };
    if (errorCode) {
      error.code = errorCode;
    }
    error.status = response.status;
    throw error;
  }

  return (payload as BackendApiEnvelope<T> | null) ?? {};
}

async function fetchWithOptionalIdToken(
  requestUrl: string,
  input: {
    method?: string;
    body?: unknown;
  },
  idToken: string | null,
): Promise<Response> {
  return fetch(requestUrl, {
    method: input.method ?? "GET",
    credentials: "include",
    headers: {
      ...(idToken ? { authorization: `Bearer ${idToken}` } : {}),
      ...(input.body !== undefined ? { "content-type": "application/json" } : {}),
    },
    ...(input.body !== undefined ? { body: JSON.stringify(input.body) } : {}),
    cache: "no-store",
  });
}

function hasClientSessionCookie(): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  const cookiePrefix = `${WEB_AUTH_SESSION_COOKIE_NAME}=`;
  return document.cookie
    .split(";")
    .map((segment) => segment.trim())
    .some(
      (segment) =>
        segment.startsWith(cookiePrefix) &&
        segment.slice(cookiePrefix.length) === WEB_AUTH_SESSION_COOKIE_SIGNED_IN_VALUE,
    );
}

async function readFallbackFirebaseIdToken(): Promise<string | null> {
  if (hasClientSessionCookie()) {
    return null;
  }

  const firebaseClient = await import("@/lib/firebase/client").catch(() => null);
  const currentUser = firebaseClient?.getFirebaseClientAuth()?.currentUser ?? null;
  if (!currentUser) {
    return null;
  }

  return currentUser.getIdToken();
}

function ensureTrailingSlash(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

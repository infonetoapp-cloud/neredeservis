"use client";

import { getFirebaseClientAuth } from "@/lib/firebase/client";

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
  const firebaseAuth = getFirebaseClientAuth();
  const currentUser = authRequired ? firebaseAuth?.currentUser ?? null : null;
  if (authRequired && !currentUser) {
    throw new Error("Oturum bulunamadi. Tekrar giris yap.");
  }

  const idToken = currentUser ? await currentUser.getIdToken() : null;
  const requestUrl = new URL(input.path, ensureTrailingSlash(input.baseUrl));
  const response = await fetch(requestUrl.toString(), {
    method: input.method ?? "GET",
    headers: {
      ...(idToken ? { authorization: `Bearer ${idToken}` } : {}),
      ...(input.body !== undefined ? { "content-type": "application/json" } : {}),
    },
    ...(input.body !== undefined ? { body: JSON.stringify(input.body) } : {}),
    cache: "no-store",
  });

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

function ensureTrailingSlash(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

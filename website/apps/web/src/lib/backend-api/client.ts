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
}): Promise<BackendApiEnvelope<T>> {
  const auth = getFirebaseClientAuth();
  const currentUser = auth?.currentUser;
  if (!currentUser) {
    throw new Error("Oturum bulunamadi. Tekrar giris yap.");
  }

  const idToken = await currentUser.getIdToken();
  const requestUrl = new URL(input.path, ensureTrailingSlash(input.baseUrl));
  const response = await fetch(requestUrl.toString(), {
    method: input.method ?? "GET",
    headers: {
      authorization: `Bearer ${idToken}`,
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | BackendApiEnvelope<T>
    | BackendApiErrorPayload
    | null;

  if (!response.ok) {
    const errorMessage =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      payload.error &&
      typeof payload.error === "object" &&
      typeof payload.error.message === "string"
        ? payload.error.message
        : "Beklenmeyen bir API hatasi olustu.";
    throw new Error(errorMessage);
  }

  return (payload as BackendApiEnvelope<T> | null) ?? {};
}

function ensureTrailingSlash(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

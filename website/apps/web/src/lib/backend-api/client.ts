"use client";

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
  const requestUrl = new URL(input.path, ensureTrailingSlash(input.baseUrl));
  const response = await fetchBackendApi(requestUrl.toString(), input);

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

async function fetchBackendApi(
  requestUrl: string,
  input: {
    method?: string;
    body?: unknown;
  },
): Promise<Response> {
  return fetch(requestUrl, {
    method: input.method ?? "GET",
    credentials: "include",
    headers: {
      ...(input.body !== undefined ? { "content-type": "application/json" } : {}),
    },
    ...(input.body !== undefined ? { body: JSON.stringify(input.body) } : {}),
    cache: "no-store",
  });
}

function ensureTrailingSlash(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

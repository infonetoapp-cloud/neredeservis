"use client";

import { callBackendApi } from "@/lib/backend-api/client";
import { requireBackendApiBaseUrl } from "@/lib/env/public-env";

type PrepareCorporateLoginAttemptOutput = {
  captchaRequired: boolean;
  failedCount: number;
  lockSecondsRemaining: number;
};

type ReportCorporateLoginResultOutput = {
  failedCount: number;
  lockSecondsRemaining: number;
};

type ResolveCorporateLoginContextOutput = {
  isPlatformOwner: boolean;
  defaultPath: string;
};

function normalizeRequestedPath(pathRaw: string | null | undefined): string {
  const value = (pathRaw ?? "").trim();
  if (!value.startsWith("/")) {
    return "/dashboard";
  }
  return value;
}

export async function prepareCorporateLoginAttempt(input: {
  email: string;
  captchaToken: string | null;
}): Promise<PrepareCorporateLoginAttemptOutput> {
  const result = await callBackendApi<PrepareCorporateLoginAttemptOutput>({
    baseUrl: requireBackendApiBaseUrl(),
    path: "api/auth/login-attempt/prepare",
    method: "POST",
    auth: false,
    body: {
      email: input.email,
      ...(input.captchaToken ? { captchaToken: input.captchaToken } : {}),
    },
  });
  if (!result.data) {
    throw new Error("AUTH_LOGIN_PREPARE_RESPONSE_INVALID");
  }
  return result.data;
}

export async function reportCorporateLoginResult(input: {
  email: string;
  success: boolean;
}): Promise<ReportCorporateLoginResultOutput> {
  const result = await callBackendApi<ReportCorporateLoginResultOutput>({
    baseUrl: requireBackendApiBaseUrl(),
    path: "api/auth/login-attempt/report",
    method: "POST",
    auth: false,
    body: {
      email: input.email,
      success: input.success,
    },
  });
  if (!result.data) {
    throw new Error("AUTH_LOGIN_REPORT_RESPONSE_INVALID");
  }
  return result.data;
}

export async function resolveCorporateLoginDestination(
  requestedPathRaw: string | null | undefined,
): Promise<string> {
  const requestedPath = normalizeRequestedPath(requestedPathRaw);
  const result = await callBackendApi<ResolveCorporateLoginContextOutput>({
    baseUrl: requireBackendApiBaseUrl(),
    path: "api/auth/login-context",
  });
  const context = result.data;
  if (!context) {
    throw new Error("AUTH_LOGIN_CONTEXT_RESPONSE_INVALID");
  }

  if (requestedPath.startsWith("/platform") && !context.isPlatformOwner) {
    return "/dashboard";
  }

  const defaultPath =
    context.defaultPath === "/select-company" ? "/dashboard" : context.defaultPath;

  if (requestedPath === "/dashboard" || requestedPath === "/select-company") {
    return defaultPath;
  }

  return requestedPath;
}

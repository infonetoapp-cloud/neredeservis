"use client";

import { callBackendApi } from "@/lib/backend-api/client";
import { getBackendApiBaseUrl } from "@/lib/env/public-env";
import { callFirebaseCallable } from "@/lib/firebase/callable";

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
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const result = await callBackendApi<PrepareCorporateLoginAttemptOutput>({
      baseUrl: backendApiBaseUrl,
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

  const result = await callFirebaseCallable<
    { email: string; captchaToken?: string },
    PrepareCorporateLoginAttemptOutput
  >("prepareCorporateLoginAttempt", {
    email: input.email,
    ...(input.captchaToken ? { captchaToken: input.captchaToken } : {}),
  });

  return result.data;
}

export async function reportCorporateLoginResult(input: {
  email: string;
  success: boolean;
}): Promise<ReportCorporateLoginResultOutput> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const result = await callBackendApi<ReportCorporateLoginResultOutput>({
      baseUrl: backendApiBaseUrl,
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

  const result = await callFirebaseCallable<
    { email: string; success: boolean },
    ReportCorporateLoginResultOutput
  >("reportCorporateLoginResult", {
    email: input.email,
    success: input.success,
  });
  return result.data;
}

export async function resolveCorporateLoginDestination(
  requestedPathRaw: string | null | undefined,
): Promise<string> {
  const requestedPath = normalizeRequestedPath(requestedPathRaw);
  const backendApiBaseUrl = getBackendApiBaseUrl();

  if (backendApiBaseUrl) {
    const result = await callBackendApi<ResolveCorporateLoginContextOutput>({
      baseUrl: backendApiBaseUrl,
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

  const result = await callFirebaseCallable<
    Record<string, never>,
    ResolveCorporateLoginContextOutput
  >("resolveCorporateLoginContext", {});
  const context = result.data;

  if (requestedPath.startsWith("/platform") && !context.isPlatformOwner) {
    return "/dashboard";
  }

  const defaultPath = context.defaultPath === "/select-company" ? "/dashboard" : context.defaultPath;

  if (requestedPath === "/dashboard" || requestedPath === "/select-company") {
    return defaultPath;
  }

  return requestedPath;
}

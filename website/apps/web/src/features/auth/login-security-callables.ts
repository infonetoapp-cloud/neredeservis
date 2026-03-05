"use client";

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

  const result = await callFirebaseCallable<
    Record<string, never>,
    ResolveCorporateLoginContextOutput
  >("resolveCorporateLoginContext", {});
  const context = result.data;

  if (requestedPath.startsWith("/platform") && !context.isPlatformOwner) {
    return "/dashboard";
  }

  if (requestedPath === "/dashboard") {
    return context.defaultPath;
  }

  return requestedPath;
}

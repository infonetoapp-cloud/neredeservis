"use client";

import { FirebaseError } from "firebase/app";
import { httpsCallable } from "firebase/functions";

import { getFirebaseClientFunctions } from "@/lib/firebase/client";

export type ApiOkEnvelope<T> = {
  requestId: string;
  serverTime: string;
  data: T;
};

export class FirebaseCallableConfigError extends Error {
  constructor() {
    super("FIREBASE_CONFIG_MISSING");
    this.name = "FirebaseCallableConfigError";
  }
}

export async function callFirebaseCallable<TRequest, TResponse>(
  name: string,
  payload: TRequest,
): Promise<ApiOkEnvelope<TResponse>> {
  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new FirebaseCallableConfigError();
  }

  const callable = httpsCallable<TRequest, ApiOkEnvelope<TResponse>>(functions, name);
  const result = await callable(payload);
  return result.data;
}

export function getCallableErrorCode(error: unknown): string | null {
  if (error instanceof FirebaseError) {
    return error.code;
  }
  if (typeof error === "object" && error && "code" in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : null;
  }
  return null;
}

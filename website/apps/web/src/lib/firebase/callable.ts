"use client";

type FirebaseFunctionsModule = typeof import("firebase/functions");
type FirebaseClientModule = typeof import("@/lib/firebase/client");
type FirebaseCallableRuntime = {
  functionsModule: FirebaseFunctionsModule;
  clientModule: FirebaseClientModule;
};

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

let firebaseCallableRuntimePromise: Promise<FirebaseCallableRuntime> | null = null;

async function loadFirebaseCallableRuntime(): Promise<FirebaseCallableRuntime> {
  if (!firebaseCallableRuntimePromise) {
    firebaseCallableRuntimePromise = Promise.all([
      import("firebase/functions"),
      import("@/lib/firebase/client"),
    ]).then(([functionsModule, clientModule]) => ({
      functionsModule,
      clientModule,
    }));
  }

  return firebaseCallableRuntimePromise;
}

export async function callFirebaseCallable<TRequest, TResponse>(
  name: string,
  payload: TRequest,
): Promise<ApiOkEnvelope<TResponse>> {
  const { functionsModule, clientModule } = await loadFirebaseCallableRuntime();
  const functions = clientModule.getFirebaseClientFunctions();
  if (!functions) {
    throw new FirebaseCallableConfigError();
  }

  const callable = functionsModule.httpsCallable<TRequest, ApiOkEnvelope<TResponse>>(functions, name);
  const result = await callable(payload);
  return result.data;
}

export function getCallableErrorCode(error: unknown): string | null {
  if (typeof error === "object" && error && "code" in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : null;
  }
  return null;
}

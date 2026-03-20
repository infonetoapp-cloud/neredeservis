"use client";

type FirebaseDatabaseModule = typeof import("firebase/database");
type FirebaseClientModule = typeof import("@/lib/firebase/client");

export type FirebaseRtdbRuntime = {
  databaseModule: FirebaseDatabaseModule;
  clientModule: FirebaseClientModule;
};

let firebaseRtdbRuntimePromise: Promise<FirebaseRtdbRuntime> | null = null;

export async function loadFirebaseRtdbRuntime(): Promise<FirebaseRtdbRuntime> {
  if (!firebaseRtdbRuntimePromise) {
    firebaseRtdbRuntimePromise = Promise.all([
      import("firebase/database"),
      import("@/lib/firebase/client"),
    ]).then(([databaseModule, clientModule]) => ({
      databaseModule,
      clientModule,
    }));
  }

  return firebaseRtdbRuntimePromise;
}

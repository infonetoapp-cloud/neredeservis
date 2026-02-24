"use client";

import { getFirebaseClientApp, getFirebaseClientAuth } from "@/lib/firebase/client";

export function FirebaseClientBootstrapProbe() {
  const app = getFirebaseClientApp();
  const auth = getFirebaseClientAuth();
  const ready = Boolean(app && auth);

  return (
    <div className="rounded-2xl border border-line bg-white px-3 py-2 text-xs text-slate-700">
      <span className="font-semibold">Firebase client init:</span>{" "}
      {ready ? (
        <span className="text-emerald-700">hazir (placeholder probe)</span>
      ) : (
        <span className="text-amber-700">env eksik / init bekliyor</span>
      )}
    </div>
  );
}

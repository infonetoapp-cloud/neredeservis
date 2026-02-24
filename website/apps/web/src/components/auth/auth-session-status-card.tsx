"use client";

import { useMemo } from "react";

import { useAuthSession } from "@/features/auth/auth-session-provider";

export function AuthSessionStatusCard() {
  const { status, user } = useAuthSession();

  const providerLabels = useMemo(() => {
    if (!user) {
      return [];
    }
    return user.providerData
      .map((provider) => provider.providerId)
      .filter(Boolean)
      .sort();
  }, [user]);

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-slate-900">Auth Session Smoke</div>
        <span className="rounded-full border border-line bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
          {status}
        </span>
      </div>

      {user ? (
        <div className="space-y-2 text-xs text-slate-700">
          <div>
            <span className="font-semibold text-slate-900">UID:</span>{" "}
            <span className="font-mono">{user.uid}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-900">Email:</span>{" "}
            {user.email ?? "-"}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="font-semibold text-slate-900">Providers:</span>
            {providerLabels.length > 0 ? (
              providerLabels.map((providerId) => (
                <span
                  key={providerId}
                  className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-800"
                >
                  {providerId}
                </span>
              ))
            ) : (
              <span className="text-muted">-</span>
            )}
          </div>
        </div>
      ) : (
        <div className="text-xs text-muted">
          Oturum acildiginda burada kullanici/provider bilgileri gorunecek.
        </div>
      )}
    </div>
  );
}

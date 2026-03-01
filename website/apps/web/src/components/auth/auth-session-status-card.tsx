"use client";

import { useMemo } from "react";

import { CheckCircleIcon, ShieldLockIcon, UserIcon } from "@/components/shared/app-icons";
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
    <div className="glass-panel rounded-2xl p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900">
          <ShieldLockIcon className="h-4 w-4 text-[#406155]" />
          Auth Session Smoke
        </div>
        <span className="glass-chip rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
          {status}
        </span>
      </div>

      {user ? (
        <div className="space-y-2 text-xs text-slate-700">
          <div>
            <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
              <UserIcon className="h-3.5 w-3.5" />
              UID:
            </span>{" "}
            <span className="font-mono">{user.uid}</span>
          </div>
          <div>
            <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
              <CheckCircleIcon className="h-3.5 w-3.5" />
              Email:
            </span>{" "}
            {user.email ?? "-"}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="font-semibold text-slate-900">Providers:</span>
            {providerLabels.length > 0 ? (
              providerLabels.map((providerId) => (
                <span
                  key={providerId}
                  className="glass-chip rounded-full px-2 py-1 font-medium text-slate-800"
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

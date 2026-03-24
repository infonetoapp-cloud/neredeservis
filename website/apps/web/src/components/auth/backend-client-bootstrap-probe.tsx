"use client";

import { CheckCircleIcon, RefreshIcon } from "@/components/shared/app-icons";
import { getBackendApiBaseUrl } from "@/lib/env/public-env";

export function BackendClientBootstrapProbe() {
  const ready = Boolean(getBackendApiBaseUrl());

  if (ready) {
    return null;
  }

  return (
    <div className="flex items-center justify-between rounded-2xl border border-line/90 bg-white/70 px-3 py-2 text-xs">
      <span className="inline-flex items-center gap-2 font-semibold text-[#425d52]">
        <RefreshIcon className="h-3.5 w-3.5" />
        Backend API baglantisi
      </span>
      <span className="rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-800">
        backend env eksik
      </span>
    </div>
  );
}

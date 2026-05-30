"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { readActiveCompanyPreference } from "@/features/company/company-preferences";

/**
 * Client-side redirect for legacy flat routes (e.g. /drivers → /c/{id}/drivers).
 * Reads active company from localStorage. Falls back to internal workspace.
 */
export function LegacyRouteRedirect({ segment }: { segment: string }) {
  const router = useRouter();

  useEffect(() => {
    const pref = readActiveCompanyPreference();
    if (pref?.companyId) {
      router.replace(`/c/${encodeURIComponent(pref.companyId)}/${segment}`);
    } else {
      router.replace(`/c/internal/${segment}`);
    }
  }, [router, segment]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Yönlendiriliyor…</span>
      </div>
    </div>
  );
}

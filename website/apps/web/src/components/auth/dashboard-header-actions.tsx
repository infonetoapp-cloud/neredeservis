"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

import { signOutCurrentUser } from "@/features/auth/auth-client";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import { useActiveCompanyMembership } from "@/features/company/use-active-company-membership";
import { useActiveCompanyPreference } from "@/features/company/use-active-company-preference";

function formatUserLabel(email: string | null | undefined): string {
  if (!email) {
    return "Bilinmeyen Kullanici";
  }
  return email;
}

export function DashboardHeaderActions() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, status } = useAuthSession();
  const activeCompany = useActiveCompanyPreference();
  const membership = useActiveCompanyMembership();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canSignOut = status === "signed_in" && !isPending;
  const showAdminLink =
    Boolean(activeCompany?.companyId) &&
    membership.status === "success" &&
    membership.memberStatus === "active" &&
    (membership.role === "owner" || membership.role === "admin");

  const handleSignOut = async () => {
    if (!canSignOut) {
      return;
    }

    setErrorMessage(null);
    try {
      await signOutCurrentUser();
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      startTransition(() => {
        router.replace(`/login${next}`);
      });
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      setErrorMessage(code ? `Cikis hatasi (${code})` : "Cikis yapilamadi.");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/mode-select"
        className="hidden rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 md:inline-flex"
      >
        Firma Sec
      </Link>

      {showAdminLink ? (
        <Link
          href="/admin"
          className="hidden rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 md:inline-flex"
        >
          Admin
        </Link>
      ) : null}

      <div className="hidden rounded-xl border border-line bg-surface px-3 py-2 text-right sm:block">
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted">
          Oturum
        </div>
        <div className="max-w-[240px] truncate text-sm font-medium text-slate-900">
          {formatUserLabel(user?.email)}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        disabled={!canSignOut}
        className="rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Cikis..." : "Cikis"}
      </button>

      {errorMessage ? (
        <div className="hidden rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 lg:block">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}

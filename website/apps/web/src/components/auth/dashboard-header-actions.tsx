"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

import { signOutCurrentUser } from "@/features/auth/auth-client";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import { LogoutIcon, UserIcon } from "@/components/shared/app-icons";

function formatUserLabel(email: string | null | undefined): string {
  if (!email) {
    return "Bilinmeyen Kullanici";
  }
  return email;
}

function getUserInitial(email: string | null | undefined): string {
  if (!email) {
    return "U";
  }
  const [name] = email.split("@");
  return name.slice(0, 1).toUpperCase();
}

export function DashboardHeaderActions() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, status } = useAuthSession();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canSignOut = status === "signed_in" && !isPending;

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
      <div className="hidden items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 sm:inline-flex">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#e2f4f4] text-xs font-semibold text-[#0b7b7d]">
          {getUserInitial(user?.email)}
        </span>
        <div className="inline-flex max-w-[220px] items-center gap-1.5 truncate text-sm font-medium text-slate-700">
          <UserIcon className="h-3.5 w-3.5 text-slate-500" />
          <span className="truncate">{formatUserLabel(user?.email)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        disabled={!canSignOut}
        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <LogoutIcon className="h-4 w-4" />
        {isPending ? "Cikis..." : "Cikis"}
      </button>

      {errorMessage ? (
        <div className="hidden rounded-xl border border-rose-300/70 bg-rose-50/85 px-3 py-2 text-xs text-rose-800 lg:block">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}

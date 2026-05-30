"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";

import { signOutCurrentUser } from "@/features/auth/auth-client";
import { useAuthSession } from "@/features/auth/auth-session-provider";

function formatUserLabel(email: string | null | undefined): string {
  if (!email) {
    return "Bilinmeyen Kullanıcı";
  }
  return email;
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
        router.replace(`/giris${next}`);
      });
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      setErrorMessage(code ? `Çıkış hatası (${code})` : "Çıkış yapılamadı.");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 sm:flex">
        <User className="h-3.5 w-3.5 text-slate-400" />
        <span className="max-w-[200px] truncate text-sm font-medium text-slate-700">
          {formatUserLabel(user?.email)}
        </span>
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        disabled={!canSignOut}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <LogOut className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{isPending ? "Çıkılıyor..." : "Çıkış"}</span>
      </button>

      {errorMessage ? (
        <div className="hidden rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 lg:block">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}

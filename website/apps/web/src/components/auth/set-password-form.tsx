"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { callBackendApi } from "@/lib/backend-api/client";
import { requireBackendApiBaseUrl } from "@/lib/env/public-env";

function toFriendlyError(error: unknown): string {
  if (error instanceof Error) {
    const code = (error as { code?: string }).code;
    if (error.message === "BACKEND_API_BASE_URL_MISSING") {
      return "Backend API baglantisi eksik. Lutfen daha sonra tekrar deneyin.";
    }
    if (code === "auth/expired-action-code") {
      return "Bu linkin suresi dolmus. Platform yoneticinizden yeni bir link isteyin.";
    }
    if (code === "auth/invalid-action-code") {
      return "Gecersiz link. Daha once kullanilmis ya da hatali olabilir.";
    }
    if (code === "auth/user-disabled") {
      return "Bu hesap devre disi birakilmis.";
    }
    if (code === "auth/user-not-found") {
      return "Kullanici bulunamadi.";
    }
    if (code === "auth/weak-password") {
      return "Sifre cok zayif. En az 8 karakter girin.";
    }
    return error.message;
  }
  return "Beklenmeyen bir hata olustu.";
}

export function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode") ?? "";
  const email = searchParams.get("email") ? decodeURIComponent(searchParams.get("email")!) : "";

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!oobCode) {
    return (
      <main className="min-h-screen bg-background px-6 py-12 text-foreground">
        <div className="mx-auto max-w-md space-y-4">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            Gecersiz baglanti - <code>oobCode</code> parametresi eksik. Platform yoneticinizden
            yeni bir davet linki isteyin.
          </div>
          <a
            href="/giris"
            className="block rounded-2xl bg-brand px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-strong"
          >
            Giris sayfasina don
          </a>
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main className="min-h-screen bg-background px-6 py-12 text-foreground">
        <div className="mx-auto max-w-md space-y-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            Sifreniz basariyla belirlendi. Artik giris yapabilirsiniz.
          </div>
          <a
            href="/giris"
            className="block rounded-2xl bg-brand px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-strong"
          >
            Giris Yap
          </a>
        </div>
      </main>
    );
  }

  const handleSubmit = () => {
    setError(null);
    if (!password) {
      setError("Sifre bos olamaz.");
      return;
    }
    if (password.length < 8) {
      setError("Sifre en az 8 karakter olmalidir.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Sifreler eslesmiyor.");
      return;
    }

    startTransition(async () => {
      try {
        const backendApiBaseUrl = requireBackendApiBaseUrl();
        await callBackendApi<{ email: string | null; requestType: string | null }>({
          baseUrl: backendApiBaseUrl,
          path: "api/auth/password-reset/verify",
          method: "POST",
          auth: false,
          body: { oobCode },
        });
        await callBackendApi<{ success: boolean; email: string | null }>({
          baseUrl: backendApiBaseUrl,
          path: "api/auth/password-reset/confirm",
          method: "POST",
          auth: false,
          body: {
            oobCode,
            newPassword: password,
          },
        });
        setDone(true);
        setTimeout(() => {
          router.replace("/giris");
        }, 2500);
      } catch (err) {
        setError(toFriendlyError(err));
      }
    });
  };

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sifrenizi Belirleyin</h1>
          {email ? (
            <p className="mt-1 text-sm text-muted">
              <span className="font-medium text-slate-700">{email}</span> hesabi icin yeni bir
              sifre olusturun.
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted">Bu hesap icin yeni bir sifre olusturun.</p>
          )}
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {error}
          </div>
        ) : null}

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">Yeni Sifre</label>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="En az 8 karakter"
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">Sifre Tekrar</label>
            <input
              type="password"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              placeholder="Sifreyi tekrar girin"
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
            />
          </div>

          <button
            type="button"
            disabled={isPending}
            onClick={handleSubmit}
            className="w-full rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Kaydediliyor..." : "Sifreyi Belirle ve Giris Yap"}
          </button>
        </div>
      </div>
    </main>
  );
}

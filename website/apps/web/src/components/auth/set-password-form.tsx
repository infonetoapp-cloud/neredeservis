"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";

import { getFirebaseClientAuth } from "@/lib/firebase/client";

function toFriendlyError(error: unknown): string {
  if (error instanceof Error) {
    const code = (error as { code?: string }).code;
    if (code === "auth/expired-action-code") {
      return "Bu linkin süresi dolmuş. Platform yöneticinizden yeni bir link isteyin.";
    }
    if (code === "auth/invalid-action-code") {
      return "Geçersiz link. Daha önce kullanılmış ya da hatalı olabilir.";
    }
    if (code === "auth/user-disabled") {
      return "Bu hesap devre dışı bırakılmış.";
    }
    if (code === "auth/user-not-found") {
      return "Kullanıcı bulunamadı.";
    }
    if (code === "auth/weak-password") {
      return "Şifre çok zayıf. En az 8 karakter girin.";
    }
    return error.message;
  }
  return "Beklenmeyen bir hata oluştu.";
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
            Geçersiz bağlantı — <code>oobCode</code> parametresi eksik. Platform yöneticinizden
            yeni bir davet linki isteyin.
          </div>
          <a
            href="/giris"
            className="block rounded-2xl bg-brand px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-strong"
          >
            Giriş sayfasına dön
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
            Şifreniz başarıyla belirlendi. Artık giriş yapabilirsiniz.
          </div>
          <a
            href="/giris"
            className="block rounded-2xl bg-brand px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-strong"
          >
            Giriş Yap
          </a>
        </div>
      </main>
    );
  }

  const handleSubmit = () => {
    setError(null);
    if (!password) {
      setError("Şifre boş olamaz.");
      return;
    }
    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    startTransition(async () => {
      try {
        const auth = getFirebaseClientAuth();
        if (!auth) {
          setError("Firebase yapılandırması eksik. Lütfen sayfayı yenileyin.");
          return;
        }
        // Kodu doğrula
        await verifyPasswordResetCode(auth, oobCode);
        // Şifreyi güncelle
        await confirmPasswordReset(auth, oobCode, password);
        setDone(true);
        // Kısa gecikme sonrası login sayfasına yönlendir
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
        {/* Başlık */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Şifrenizi Belirleyin</h1>
          {email ? (
            <p className="mt-1 text-sm text-muted">
              <span className="font-medium text-slate-700">{email}</span> hesabı için yeni bir
              şifre oluşturun.
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted">
              Bu hesap için yeni bir şifre oluşturun.
            </p>
          )}
        </div>

        {/* Hata */}
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {error}
          </div>
        ) : null}

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">
              Yeni Şifre
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="En az 8 karakter"
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">
              Şifre Tekrar
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="Şifreyi tekrar girin"
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
            />
          </div>

          <button
            type="button"
            disabled={isPending}
            onClick={handleSubmit}
            className="w-full rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Kaydediliyor..." : "Şifreyi Belirle ve Giriş Yap"}
          </button>
        </div>
      </div>
    </main>
  );
}

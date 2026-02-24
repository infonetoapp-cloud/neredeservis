import Link from "next/link";

import { FirebaseClientBootstrapProbe } from "@/components/auth/firebase-client-bootstrap-probe";
import { LoginForm } from "@/components/auth/login-form";
import { ConfigValidationBanner } from "@/components/shared/config-validation-banner";
import { EnvBadge } from "@/components/shared/env-badge";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden lg:block">
          <div className="rounded-3xl border border-line bg-surface p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-sm font-semibold tracking-tight">
                Neredeservis Web
              </span>
              <EnvBadge />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Firma operasyonu ve bireysel sofor paneli
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted">
              Faz 1 auth shell placeholder. Google login ve email/password akislari
              bu sayfadan baglanacak.
            </p>
            <div className="mt-8 space-y-3">
              <div className="rounded-2xl border border-line p-4">
                <div className="text-xs font-medium text-muted">Company Mode</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  Operasyon, rota, arac, live ops
                </div>
              </div>
              <div className="rounded-2xl border border-line p-4">
                <div className="text-xs font-medium text-muted">Individual Driver</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  Kendi rota ve sefer gorunumu
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900">Giris Yap</span>
            <EnvBadge />
          </div>

          <ConfigValidationBanner scopeLabel="Login Shell" />
          <div className="mb-4">
            <FirebaseClientBootstrapProbe />
          </div>

          <LoginForm />

          <div className="mt-6 flex items-center justify-between text-sm">
            <span className="text-xs text-muted">
              Faz 1: reset e-postasi tetigi form icinden calisir.
            </span>
            <Link href="/" className="font-medium text-slate-900 hover:text-blue-700">
              Ana sayfa
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

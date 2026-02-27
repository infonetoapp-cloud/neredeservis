import Link from "next/link";
import { headers } from "next/headers";

import { FirebaseClientBootstrapProbe } from "@/components/auth/firebase-client-bootstrap-probe";
import { LoginForm } from "@/components/auth/login-form";
import { ConfigValidationBanner } from "@/components/shared/config-validation-banner";
import { EnvBadge } from "@/components/shared/env-badge";
import { getPublicAppEnv } from "@/lib/env/public-env";

type LoginPageShellProps = {
  title?: string;
  description?: string;
};

function resolveLoginShellEnv(hostname: string): string {
  const normalizedHost = hostname.trim().toLowerCase();

  if (
    normalizedHost === "neredeservis.app" ||
    normalizedHost === "www.neredeservis.app" ||
    normalizedHost === "app.neredeservis.app"
  ) {
    return "prod";
  }

  if (normalizedHost === "stg-app.neredeservis.app") {
    return "stg";
  }

  return getPublicAppEnv();
}

export async function LoginPageShell({
  title = "Firma operasyonu ve bireysel sofor paneli",
  description = "Google, Microsoft ve e-posta/sifre giris akislari bu panelden baslatilir.",
}: LoginPageShellProps) {
  const requestHeaders = await headers();
  const rawHost = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "";
  const hostname = rawHost.split(",")[0]?.trim().split(":")[0] ?? "";
  const resolvedEnv = resolveLoginShellEnv(hostname);

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden lg:block">
          <div className="rounded-3xl border border-line bg-surface p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-sm font-semibold tracking-tight">Neredeservis Web</span>
              <EnvBadge env={resolvedEnv} />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted">{description}</p>
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
            <EnvBadge env={resolvedEnv} />
          </div>

          <ConfigValidationBanner scopeLabel="Login Shell" />
          <div className="mb-4">
            <FirebaseClientBootstrapProbe />
          </div>

          <LoginForm />

          <div className="mt-6 flex items-center justify-between text-sm">
            <span className="text-xs text-muted">
              Sifre sifirlama akisi bu form uzerinden tetiklenir.
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

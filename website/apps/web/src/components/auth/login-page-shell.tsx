import Link from "next/link";
import { headers } from "next/headers";

import { FirebaseClientBootstrapProbe } from "@/components/auth/firebase-client-bootstrap-probe";
import { LoginForm } from "@/components/auth/login-form";
import { NsLogo } from "@/components/brand/ns-logo";
import { ConfigValidationBanner } from "@/components/shared/config-validation-banner";
import { EnvBadge } from "@/components/shared/env-badge";
import { getPublicAppEnv } from "@/lib/env/public-env";

type LoginPageShellProps = {
  title?: string;
  description?: string;
};

const TRUST_PILLARS = [
  {
    title: "Kurumsal operasyon",
    detail: "Dashboard, rota, arac, surucu ve canli operasyon yonetimi tek panelde.",
  },
  {
    title: "Platform owner",
    detail: "Owner hesaplar dogrudan platform paneline (/platform/companies) yonlenir.",
  },
  {
    title: "Tenant izolasyonu",
    detail: "Her kurum kendi verisi ve yetki sinirlari icinde islem gorur.",
  },
  {
    title: "Canli guvenlik",
    detail: "Rate-limit, captcha ve audit sinyalleri ayni giris katmaninda calisir.",
  },
] as const;

const SECURITY_SIGNALS = [
  { label: "Rate-limit", value: "Aktif" },
  { label: "Captcha tetigi", value: "Basarisiz deneme odakli" },
  { label: "Giris loglari", value: "Audit event" },
  { label: "Ortam izolasyonu", value: "Prod / Stg ayrik" },
] as const;

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
  title = "NeredeServis kurumsal giris",
  description =
    "Kurumsal operasyon ekipleri ve owner hesaplari ayni guvenli giris katmanindan devam eder.",
}: LoginPageShellProps) {
  const requestHeaders = await headers();
  const rawHost = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "";
  const hostname = rawHost.split(",")[0]?.trim().split(":")[0] ?? "";
  const resolvedEnv = resolveLoginShellEnv(hostname);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px]"
        style={{
          background:
            "radial-gradient(ellipse 65% 44% at 8% -10%, rgba(10,79,191,0.22), transparent 64%), radial-gradient(ellipse 60% 42% at 92% -8%, rgba(76,189,255,0.18), transparent 60%), linear-gradient(to bottom, rgba(255,255,255,0.98), rgba(243,246,251,1))",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:36px_36px]"
      />

      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 sm:py-8 lg:py-10">
        <header className="mb-6 flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center">
            <NsLogo iconSize={23} wordmarkClass="text-base font-bold tracking-tight" />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-50"
            >
              Ana sayfa
            </Link>
            <EnvBadge env={resolvedEnv} />
          </div>
        </header>

        <div className="grid flex-1 items-center gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <section className="order-2 relative overflow-hidden rounded-[30px] border border-slate-200 bg-gradient-to-br from-slate-950 via-[#0a2d79] to-brand p-7 text-white shadow-[0_22px_50px_-28px_rgba(2,6,23,0.72)] sm:p-10 lg:order-1">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-12 top-10 h-44 w-44 rounded-full bg-cyan-300/22 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -left-14 bottom-0 h-52 w-52 rounded-full bg-blue-500/25 blur-3xl"
            />

            <div className="relative z-10 flex h-full flex-col">
              <span className="inline-flex w-fit rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-100">
                Kurumsal giris katmani
              </span>
              <h1 className="mt-5 max-w-xl text-3xl font-semibold leading-tight tracking-tight sm:text-[2.7rem]">
                {title}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-blue-100/90 sm:text-base sm:leading-8">
                {description}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {TRUST_PILLARS.map((item, index) => (
                  <article
                    key={item.title}
                    className={`rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm ${index > 1 ? "hidden sm:block" : ""}`}
                  >
                    <div className="text-xs font-semibold uppercase tracking-[0.13em] text-blue-100/95">
                      {item.title}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-white/90">{item.detail}</p>
                  </article>
                ))}
              </div>

              <section className="mt-6 hidden rounded-2xl border border-white/20 bg-slate-950/30 p-4 sm:block sm:p-5">
                <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.14em] text-blue-100/85">
                  <span>Guvenlik sinyalleri</span>
                  <span className="rounded-full bg-emerald-300/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-100">
                    aktif
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {SECURITY_SIGNALS.map((item) => (
                    <div key={item.label} className="rounded-xl border border-white/15 bg-white/10 px-3 py-2.5">
                      <div className="text-[11px] uppercase tracking-[0.11em] text-blue-100/80">{item.label}</div>
                      <div className="mt-1 text-sm font-semibold text-white">{item.value}</div>
                    </div>
                  ))}
                </div>
              </section>

              <p className="mt-auto hidden pt-7 text-xs leading-6 text-blue-100/80 sm:block">
                NeredeServis giris katmani sadece yetkili kurumsal kullanicilar icindir. Yetkisiz denemeler
                otomatik olarak sinirlandirilir ve loglanir.
              </p>
            </div>
          </section>

          <section className="order-1 relative overflow-hidden rounded-[30px] border border-slate-200 bg-white/95 p-6 shadow-[0_16px_42px_-30px_rgba(15,23,42,0.65)] backdrop-blur sm:p-8 lg:order-2">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-brand/12 blur-2xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -left-8 bottom-2 h-28 w-28 rounded-full bg-cyan-300/16 blur-2xl"
            />

            <div className="relative z-10">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Kurumsal panel girisi</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Hesabinizla devam edin</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Bu ekran kurumsal ekipler ve owner hesaplari icin ortak guvenli giris noktasidir.
                  </p>
                </div>
                <EnvBadge env={resolvedEnv} />
              </div>

              <ConfigValidationBanner scopeLabel="Login Shell" />
              <div className="mb-5">
                <FirebaseClientBootstrapProbe />
              </div>

              <LoginForm />

              <div className="mt-7 flex flex-wrap items-center justify-between gap-3 text-sm">
                <span className="text-xs text-slate-500">
                  Coklu basarisiz giris denemelerinde otomatik rate-limit ve captcha devreye girer.
                </span>
                <Link href="/" className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:text-brand">
                  Ana sayfa
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";

import { FirebaseClientBootstrapProbe } from "@/components/auth/firebase-client-bootstrap-probe";
import { LoginForm } from "@/components/auth/login-form";
import { NsLogo } from "@/components/brand/ns-logo";
import { ConfigValidationBanner } from "@/components/shared/config-validation-banner";

type LoginPageShellProps = {
  title?: string;
  description?: string;
  mobilePreviewSrc?: string;
};

function IPhoneMockup({ mobilePreviewSrc }: { mobilePreviewSrc?: string }) {
  return (
    <div className="relative h-[620px] w-[315px] rounded-[56px] border-8 border-slate-900 bg-slate-900 p-2 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.7)]">
      <div className="absolute left-1/2 top-0 z-20 h-8 w-40 -translate-x-1/2 rounded-b-3xl bg-slate-900" />

      <div className="relative h-full w-full overflow-hidden rounded-[44px] bg-gradient-to-br from-[#0a4fbf] via-[#0a2d79] to-[#031332]">
        {mobilePreviewSrc ? (
          <img
            src={mobilePreviewSrc}
            alt="Mobil uygulama önizlemesi"
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center px-8 text-center">
            <div className="rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-blue-100">
              Yakında
            </div>
            <h3 className="mt-5 text-2xl font-semibold tracking-tight text-white">Mobil uygulama önizleme</h3>
            <p className="mt-2 text-sm leading-6 text-blue-100/90">
              Uygulama ekran görüntünüz hazır olduğunda bu alana doğrudan yerleştirebilirsiniz.
            </p>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.18),transparent_35%)]" />
      </div>
    </div>
  );
}

function MobilePreviewPanel({ mobilePreviewSrc }: { mobilePreviewSrc?: string }) {
  return (
    <section className="relative h-full min-h-[620px] overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-[#eaf1ff] via-[#f5f9ff] to-[#ebf5ff] p-7 shadow-sm">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:34px_34px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-12 bottom-12 h-56 w-56 rounded-full bg-blue-400/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 top-10 h-48 w-48 rounded-full bg-cyan-300/25 blur-3xl"
      />

      <div className="relative z-10 flex h-full flex-col items-center justify-center">
        <div className="w-full rounded-2xl border border-white/80 bg-white/85 px-5 py-4 text-center backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Mobil deneyim</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Uygulama ekranınız burada</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Şimdilik mockup görünüyor, mobil uygulama tamamlanınca gerçek ekran görüntüsünü koyabiliriz.
          </p>
        </div>

        <div className="mt-7">
          <IPhoneMockup mobilePreviewSrc={mobilePreviewSrc} />
        </div>
      </div>
    </section>
  );
}

export function LoginPageShell({
  title = "NeredeServis kurumsal giriş",
  description = "Operasyon ekibinizin paneline güvenli şekilde erişin.",
  mobilePreviewSrc,
}: LoginPageShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[460px]"
        style={{
          background:
            "radial-gradient(ellipse 58% 48% at 10% -16%, rgba(10,79,191,0.14), transparent 64%), radial-gradient(ellipse 60% 44% at 92% -8%, rgba(76,189,255,0.15), transparent 60%), linear-gradient(to bottom, rgba(255,255,255,0.98), rgba(243,246,251,1))",
        }}
      />

      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-5 py-7 sm:px-8 sm:py-10">
        <div className="grid w-full items-stretch gap-6 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
          <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm backdrop-blur sm:p-8">
            <header className="mb-7 flex items-center justify-between gap-3">
              <Link href="/" className="inline-flex items-center">
                <NsLogo iconSize={24} wordmarkClass="text-base font-bold tracking-tight" />
              </Link>
              <Link
                href="/"
                className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
              >
                Ana sayfa
              </Link>
            </header>

            <div className="mb-6">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-[2.7rem]">{title}</h1>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">{description}</p>
            </div>

            <ConfigValidationBanner scopeLabel="Login Shell" />
            <div className="mb-4">
              <FirebaseClientBootstrapProbe />
            </div>

            <LoginForm />
          </section>

          <div className="hidden lg:block">
            <MobilePreviewPanel mobilePreviewSrc={mobilePreviewSrc} />
          </div>
        </div>
      </div>
    </main>
  );
}

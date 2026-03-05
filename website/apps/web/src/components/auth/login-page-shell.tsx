import Link from "next/link";

import { FirebaseClientBootstrapProbe } from "@/components/auth/firebase-client-bootstrap-probe";
import { LoginForm } from "@/components/auth/login-form";
import { NsLogo } from "@/components/brand/ns-logo";
import { ConfigValidationBanner } from "@/components/shared/config-validation-banner";

type LoginPageShellProps = {
  title?: string;
  description?: string;
};

const MAP_MARKERS = [
  { top: "18%", left: "22%", label: "Araç 24" },
  { top: "30%", left: "68%", label: "Rota 6" },
  { top: "52%", left: "40%", label: "Şoför 12" },
  { top: "66%", left: "74%", label: "Durak 31" },
] as const;

function MapPreviewPanel() {
  return (
    <section className="relative h-full min-h-[560px] overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-[#eaf1ff] via-[#f6f9ff] to-[#edf6ff] p-6 shadow-sm">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(to_right,rgba(15,23,42,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.08)_1px,transparent_1px)] [background-size:32px_32px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-cyan-300/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-10 bottom-8 h-56 w-56 rounded-full bg-brand/20 blur-3xl"
      />

      <div className="relative z-10 flex h-full flex-col">
        <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Canlı operasyon görünümü</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Rota ve filo akışı tek bakışta</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Giriş sonrası araçlar, rotalar ve canlı hareketler için sade bir kontrol ekranına geçersiniz.
          </p>
        </div>

        <div className="relative mt-5 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-slate-900/90">
          <svg
            viewBox="0 0 1000 700"
            className="absolute inset-0 h-full w-full opacity-95"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect width="1000" height="700" fill="#0b1531" />
            <g stroke="#1f3c73" strokeWidth="1">
              <path d="M0 100 H1000" />
              <path d="M0 200 H1000" />
              <path d="M0 300 H1000" />
              <path d="M0 400 H1000" />
              <path d="M0 500 H1000" />
              <path d="M0 600 H1000" />
              <path d="M140 0 V700" />
              <path d="M280 0 V700" />
              <path d="M420 0 V700" />
              <path d="M560 0 V700" />
              <path d="M700 0 V700" />
              <path d="M840 0 V700" />
            </g>
            <path
              d="M120 510 C230 360, 340 370, 450 280 C560 190, 710 210, 860 120"
              stroke="#36b2ff"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="16 16"
            />
            <path
              d="M130 140 C240 220, 380 170, 520 240 C640 300, 730 410, 840 500"
              stroke="#4de0b8"
              strokeWidth="7"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="12 14"
            />
          </svg>

          {MAP_MARKERS.map((item) => (
            <div
              key={item.label}
              className="absolute"
              style={{ top: item.top, left: item.left }}
            >
              <div className="flex items-center gap-2 rounded-full border border-cyan-300/40 bg-slate-950/85 px-3 py-1.5 text-xs text-cyan-100 shadow-lg">
                <span className="h-2 w-2 rounded-full bg-cyan-300" />
                <span className="font-medium">{item.label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white/90 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Aktif sefer</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">24</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/90 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Canlı araç</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">18</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/90 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Toplam rota</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">42</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LoginPageShell({
  title = "NeredeServis kurumsal giriş",
  description =
    "Kurumsal operasyon ekipleri ve platform yöneticileri için güvenli giriş ekranı.",
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
            <MapPreviewPanel />
          </div>
        </div>
      </div>
    </main>
  );
}

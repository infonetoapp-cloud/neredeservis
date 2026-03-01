import Link from "next/link";

import { ArrowRightIcon, BuildingIcon, DashboardIcon, PulseIcon } from "@/components/shared/app-icons";

export default function MarketingHomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-7xl flex-col px-6 py-10">
        <header className="mb-14 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="icon-badge h-8 w-8">
              <BuildingIcon className="h-4 w-4" />
            </span>
            NeredeServis
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="glass-button rounded-full px-4 py-2 text-sm font-medium text-foreground hover:bg-slate-50"
            >
              Giris Yap
            </Link>
          </div>
        </header>

        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <p className="inline-flex rounded-full border border-[#b7ccc2] bg-[#e8f1ec] px-3 py-1 text-xs font-semibold tracking-wide text-[#285849] uppercase">
              Faz 1 Bootstrap
            </p>
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Servis operasyonunu tek panelden yonetin.
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted sm:text-lg">
              Firma operasyonu, canli takip ve ekip yonetimi odakli web platformu.
              Bu ekran Faz 1 teknik iskelet placeholder ekranidir.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="glass-button-primary inline-flex items-center gap-1.5 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-sm"
              >
                <ArrowRightIcon className="h-4 w-4" />
                Panele Gir
              </Link>
              <Link
                href="/select-company"
                className="glass-button inline-flex items-center gap-1.5 rounded-2xl px-5 py-3 text-sm font-semibold text-slate-900"
              >
                <DashboardIcon className="h-4 w-4" />
                Sirket Secimi
              </Link>
            </div>
          </div>

          <div className="glass-panel panel-edge-highlight rounded-3xl p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <PulseIcon className="h-4 w-4 text-[#315f4f]" />
                Live Ops Preview (Placeholder)
              </h2>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                online
              </span>
            </div>
            <div className="mb-4 h-56 rounded-2xl border border-line bg-gradient-to-br from-[#edf1ec] to-white" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-line bg-white/70 p-4">
                <div className="text-xs font-medium text-muted">Aktif Sefer</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">12</div>
              </div>
              <div className="rounded-2xl border border-line bg-white/70 p-4">
                <div className="text-xs font-medium text-muted">Canli Arac</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">37</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

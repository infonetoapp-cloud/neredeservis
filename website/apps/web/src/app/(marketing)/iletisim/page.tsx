import type { Metadata } from "next";
import Link from "next/link";

import { getMarketingBaseUrl, toAbsoluteUrl } from "@/lib/seo/site-urls";

const marketingBaseUrl = getMarketingBaseUrl();
const openGraphImageUrl = toAbsoluteUrl(marketingBaseUrl, "/opengraph-image");

export const metadata: Metadata = {
  title: "İletişim | NeredeServis",
  description:
    "NeredeServis ile demo talebi, pilot onboarding ve operasyonel destek için iletişime geçin. destek@neredeservis.app",
  robots: { index: true, follow: true },
  alternates: {
    canonical: toAbsoluteUrl(marketingBaseUrl, "/iletisim"),
  },
  openGraph: {
    title: "İletişim | NeredeServis",
    description:
      "Demo talebi, pilot onboarding ve operasyonel destek için NeredeServis ile iletişime geçin.",
    url: toAbsoluteUrl(marketingBaseUrl, "/iletisim"),
    type: "website",
    images: [
      {
        url: openGraphImageUrl,
        width: 1200,
        height: 630,
        alt: "NeredeServis web operasyon paneli",
      },
    ],
  },
};

/* ─── Icon helpers (inline SVG, no extra dependency) ──────────────────────── */
function IconMail() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
      <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 7l8 5 8-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
      <rect x="2" y="4" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 9h16" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 2v4M14 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0" aria-hidden>
      <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.12" />
      <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconArrow() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden>
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function IletisimPage() {
  return (
    <main className="relative min-h-screen bg-background text-foreground">
      {/* Background gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px]"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 20% -10%,rgba(37,99,235,0.10),transparent 60%), radial-gradient(ellipse 60% 40% at 80% 0%,rgba(16,185,129,0.07),transparent 55%), linear-gradient(to bottom,rgba(255,255,255,0.98),rgba(245,247,250,1))",
        }}
      />

      <div className="mx-auto w-full max-w-5xl px-6 py-8 sm:py-10">
        {/* ── Header ── */}
        <header className="mb-12 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-blue-100 bg-white shadow-sm">
              <span className="text-sm font-semibold text-blue-700">NS</span>
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-slate-950">NeredeServis</div>
              <div className="text-xs text-muted">Operasyon platformu</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50"
            >
              Ana Sayfa
            </Link>
            <Link
              href="/giris"
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Panel Girişi
            </Link>
          </div>
        </header>

        {/* ── Hero ── */}
        <section className="mb-14 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
            İletişim
          </div>
          <h1 className="mx-auto max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-[2.75rem]">
            Nasıl yardımcı olabiliriz?
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted">
            Demo talebi, onboarding soruları veya teknik destek için doğrudan yazın.
            İlk yanıt hedefimiz aynı iş günüdür.
          </p>
        </section>

        {/* ── Contact cards ── */}
        <section className="mb-14 grid gap-4 sm:grid-cols-3">
          {/* Email */}
          <div className="flex flex-col rounded-2xl border border-line bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
              <IconMail />
            </div>
            <div className="text-sm font-semibold text-slate-950">E-posta</div>
            <p className="mt-1 text-xs leading-5 text-muted">
              Her türlü soru ve talep için bize yazın.
            </p>
            <a
              href="mailto:destek@neredeservis.app"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              destek@neredeservis.app
              <IconArrow />
            </a>
          </div>

          {/* Demo */}
          <div className="flex flex-col rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-100 text-emerald-700">
              <IconCalendar />
            </div>
            <div className="text-sm font-semibold text-slate-950">Demo Talebi</div>
            <p className="mt-1 text-xs leading-5 text-muted">
              30 dakikalık canlı panel gösterimi — operasyon senaryonuzla.
            </p>
            <a
              href="mailto:destek@neredeservis.app?subject=Demo%20Talebi&body=Merhaba%2C%20demo%20talep%20ediyorum."
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
            >
              Demo talep et
              <IconArrow />
            </a>
          </div>

          {/* Support hours */}
          <div className="flex flex-col rounded-2xl border border-line bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
              <IconClock />
            </div>
            <div className="text-sm font-semibold text-slate-950">Destek Saatleri</div>
            <p className="mt-1 text-xs leading-5 text-muted">
              Hafta içi 09:00–18:00 aktif destek. Kritik durumlarda 7/24 öncelikli yanıt.
            </p>
            <div className="mt-4 space-y-1">
              {["Hft. içi: 09:00–18:00", "Kritik: 7/24 öncelikli", "İlk yanıt: aynı iş günü"].map(
                (item) => (
                  <div key={item} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <IconCheck />
                    {item}
                  </div>
                ),
              )}
            </div>
          </div>
        </section>

        {/* ── Two-column: process + what to expect ── */}
        <section className="mb-16 grid gap-10 lg:grid-cols-2">
          {/* Process steps */}
          <div>
            <div className="mb-6 text-xs font-semibold uppercase tracking-widest text-blue-600">
              Demo Süreci
            </div>
            <ol className="space-y-6">
              {[
                {
                  step: "01",
                  title: "Talep ve ön görüşme",
                  desc: "E-posta ile talebinizi gönderin. Operasyon yapınızı kısaca paylaşın: araç sayısı, rota tipi, mevcut yöntem.",
                },
                {
                  step: "02",
                  title: "Canlı panel gösterimi",
                  desc: "30 dakikalık ekran paylaşımlı demo: routes / vehicles / drivers / live-ops akışı senaryonuza göre.",
                },
                {
                  step: "03",
                  title: "Pilot onboarding",
                  desc: "İlk 48 saatte operasyona geçiş. Sahaya çıkmadan konfigürasyon tamamlanır, ilk seferler sisteme alınır.",
                },
                {
                  step: "04",
                  title: "Canlı destek",
                  desc: "Pilot süresince doğrudan erişim kanalı. Olay yönetimi runbook tabanlı, kritik / yüksek / normal sınıflamasıyla.",
                },
              ].map(({ step, title, desc }) => (
                <li key={step} className="flex gap-4">
                  <div className="shrink-0 text-2xl font-black tracking-tight text-slate-950/10">
                    {step}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-950">{title}</div>
                    <p className="mt-1 text-sm leading-6 text-muted">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* What happens panel */}
          <div className="rounded-2xl border border-line bg-slate-50 p-8">
            <div className="mb-6 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Ne Beklemelisiniz
            </div>

            <ul className="space-y-4">
              {[
                { label: "İlk yanıt süresi", value: "Aynı iş günü" },
                { label: "Demo süresi", value: "~30 dakika" },
                { label: "Onboarding hedefi", value: "48 saat" },
                { label: "Destek kanalı", value: "E-posta + onboarding kanalı" },
                { label: "Incident sınıflandırma", value: "Kritik / Yüksek / Normal" },
                { label: "Veri güvenliği", value: "KVKK uyumlu, Türkiye'de barındırma" },
              ].map(({ label, value }) => (
                <li key={label} className="flex items-start justify-between gap-4 text-sm">
                  <span className="text-muted">{label}</span>
                  <span className="text-right font-medium text-slate-900">{value}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-xl border border-blue-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-950">Teknik uyum başlıkları</div>
              <p className="mt-1 text-xs leading-5 text-muted">
                Onboarding öncesinde mevcut sisteminizle uyum netleştirilir:
              </p>
              <ul className="mt-2 space-y-1">
                {[
                  "Araç ve sürücü veri yapısı",
                  "Rota / sefer akışı",
                  "Bildirim ve yolcu paylaşımı tercihleri",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <IconCheck />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── CTA strip ── */}
        <section className="mb-10 flex flex-col items-center gap-4 rounded-2xl border border-line bg-white p-8 text-center shadow-sm sm:flex-row sm:text-left">
          <div className="flex-1">
            <div className="text-base font-semibold text-slate-950">Hemen başlayalım</div>
            <p className="mt-1 text-sm text-muted">
              Birkaç satır e-posta yeterli. Demo için tarih tercihini veya soru listenizi ekleyin.
            </p>
          </div>
          <a
            href="mailto:destek@neredeservis.app?subject=Demo%20Talebi"
            className="shrink-0 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            destek@neredeservis.app →
          </a>
        </section>

        {/* ── Footer note ── */}
        <footer className="border-t border-line pt-6 pb-10">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-muted">
            <span>© 2025 NeredeServis · Tüm hakları saklıdır.</span>
            <div className="flex gap-4">
              <Link href="/gizlilik" className="hover:text-slate-700">Gizlilik</Link>
              <Link href="/kvkk" className="hover:text-slate-700">KVKK</Link>
              <Link href="/" className="hover:text-slate-700">Ana Sayfa</Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

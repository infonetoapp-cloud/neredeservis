import type { Metadata } from "next";
import Link from "next/link";

import { NsLogo } from "@/components/brand/ns-logo";
import { getMarketingBaseUrl, toAbsoluteUrl } from "@/lib/seo/site-urls";

const marketingBaseUrl = getMarketingBaseUrl();
const openGraphImageUrl = toAbsoluteUrl(marketingBaseUrl, "/opengraph-image");

export const metadata: Metadata = {
  title: "İletişim | NeredeServis",
  description:
    "Kurumsal demo, pilot onboarding, teknik destek ve KVKK/uyum süreçleri için NeredeServis ekibiyle iletişime geçin.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: toAbsoluteUrl(marketingBaseUrl, "/iletisim"),
  },
  openGraph: {
    title: "İletişim | NeredeServis",
    description:
      "Demo planlama, operasyonel onboarding ve kurumsal destek süreçleri için NeredeServis iletişim sayfası.",
    url: toAbsoluteUrl(marketingBaseUrl, "/iletisim"),
    type: "website",
    images: [
      {
        url: openGraphImageUrl,
        width: 1200,
        height: 630,
        alt: "NeredeServis kurumsal iletişim",
      },
    ],
  },
};

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

function IconShield() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
      <path d="M10 2l6 2.5V9c0 4-2.6 6.9-6 8-3.4-1.1-6-4-6-8V4.5L10 2z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7.2 9.8l1.9 1.9 3.7-3.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px]"
        style={{
          background:
            "radial-gradient(ellipse 78% 52% at 16% -14%,rgba(10,79,191,0.16),transparent 62%), radial-gradient(ellipse 60% 42% at 84% -8%,rgba(255,122,0,0.14),transparent 60%), linear-gradient(to bottom,rgba(255,255,255,0.98),rgba(245,247,250,1))",
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-6 py-8 sm:py-10">
        <header className="mb-12 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center">
            <NsLogo iconSize={26} wordmarkClass="text-base font-bold tracking-tight" />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50"
            >
              Ana Sayfa
            </Link>
            <Link
              href="/giris"
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-strong"
            >
              Panel Girişi
            </Link>
          </div>
        </header>

        <section className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand" />
            Kurumsal İletişim
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-[2.9rem]">
            Satış, onboarding ve destek süreçlerini birlikte planlayalım
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-slate-600">
            NeredeServis ekibi; demo planlama, pilot geçiş, teknik operasyon ve KVKK uyum başlıklarında
            kurumsal ekiplerle birlikte çalışır.
          </p>
        </section>

        <section className="mb-12 grid gap-3 sm:grid-cols-3">
          {[
            { label: "İlk yanıt", value: "Aynı iş günü" },
            { label: "Demo planlama", value: "~30 dakika" },
            { label: "Pilot geçiş hedefi", value: "48 saat" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{item.label}</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">{item.value}</div>
            </div>
          ))}
        </section>

        <section className="mb-14 grid gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-brand/20 bg-gradient-to-b from-brand/5 to-white p-6 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-brand/20 bg-brand/10 text-brand">
              <IconCalendar />
            </div>
            <h2 className="text-base font-semibold text-slate-950">Satış ve Demo</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Operasyon modelinize uygun ürün demosu ve fiyatlandırma çerçevesi için satış ekibiyle görüşün.
            </p>
            <a
              href="mailto:destek@neredeservis.app?subject=Kurumsal%20Demo%20Talebi&body=Merhaba%2C%20kurumsal%20demo%20planlamak%20istiyoruz."
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-strong"
            >
              Demo planla
              <IconArrow />
            </a>
          </article>

          <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-slate-50 text-slate-700">
              <IconMail />
            </div>
            <h2 className="text-base font-semibold text-slate-950">Operasyon Desteği</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Canlıya geçiş, kullanıcı yetkilendirme, rota/araç veri hazırlığı ve günlük operasyon soruları için yazın.
            </p>
            <a
              href="mailto:destek@neredeservis.app?subject=Operasyonel%20Destek"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              destek@neredeservis.app
              <IconArrow />
            </a>
          </article>

          <article className="rounded-2xl border border-accent/30 bg-gradient-to-b from-accent-soft to-white p-6 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-accent/30 bg-accent-soft text-accent">
              <IconShield />
            </div>
            <h2 className="text-base font-semibold text-slate-950">Güvenlik ve KVKK</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Veri işleme kapsamı, saklama yaklaşımı ve sözleşmesel güvenlik başlıkları için uygunluk sürecini planlayın.
            </p>
            <a
              href="mailto:destek@neredeservis.app?subject=KVKK%20ve%20Güvenlik%20Süreçleri"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-white px-3 py-2 text-xs font-semibold text-accent transition hover:bg-accent-soft"
            >
              Uyum sürecini başlat
              <IconArrow />
            </a>
          </article>
        </section>

        <section className="mb-14 grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-7 shadow-sm">
            <div className="mb-5 text-xs font-semibold uppercase tracking-widest text-brand">
              Süreç Akışı
            </div>
            <ol className="space-y-5">
              {[
                {
                  step: "01",
                  title: "Ön değerlendirme",
                  desc: "Filo büyüklüğü, rota yapısı, kullanıcı rolleri ve canlı takip beklentileri netleştirilir.",
                },
                {
                  step: "02",
                  title: "Canlı demo oturumu",
                  desc: "Panel akışları (rota, araç, şoför, live-ops) operasyon senaryonuza göre gösterilir.",
                },
                {
                  step: "03",
                  title: "Pilot onboarding",
                  desc: "İlk veri setiyle yapılandırma tamamlanır; yetkilendirme ve temel operasyon kuralları devreye alınır.",
                },
                {
                  step: "04",
                  title: "Canlı kullanım ve destek",
                  desc: "Pilot sonrası süreçte destek kanalları ve olay yönetim rutinleri ile sürdürülebilir kullanım sağlanır.",
                },
              ].map(({ step, title, desc }) => (
                <li key={step} className="flex gap-4">
                  <span className="mt-0.5 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
                    {step}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-slate-950">{title}</div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-line bg-slate-50 p-7 shadow-sm">
            <div className="mb-5 text-xs font-semibold uppercase tracking-widest text-slate-500">
              İlk Toplantı Ajandası
            </div>
            <ul className="space-y-2.5">
              {[
                "Operasyon kapsamı: şehir, rota tipi, araç adedi, kullanıcı rolleri",
                "Canlı takip gereksinimi: güncelleme beklentisi, alarm/olay yönetimi",
                "Veri geçiş planı: mevcut sistemden içe aktarma ihtiyaçları",
                "Pilot hedefleri: başarı metrikleri, zaman planı, ekip sorumlulukları",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="mt-0.5 text-brand"><IconCheck /></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Uygunluk Notu</div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Gizlilik ve KVKK değerlendirmeleri için ilgili doküman seti talep üzerine paylaşılır; süreçler
                müşteri sözleşmesi kapsamındaki hükümlere göre yürütülür.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12 rounded-3xl border border-line bg-gradient-to-r from-slate-900 via-brand-strong to-brand p-8 text-white shadow-lg sm:p-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Demo ve pilot planını başlatalım</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">
                Ekibinize uygun bir zaman paylaşın; ürün, operasyon ve uygunluk başlıklarını tek oturumda netleştirelim.
              </p>
            </div>
            <a
              href="mailto:destek@neredeservis.app?subject=Kurumsal%20Görüşme%20Talebi"
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-brand-strong transition hover:bg-blue-50"
            >
              destek@neredeservis.app
              <IconArrow />
            </a>
          </div>
        </section>

        <footer className="border-t border-line pt-6 pb-10">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-muted">
            <span>© 2026 NeredeServis · Tüm hakları saklıdır.</span>
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

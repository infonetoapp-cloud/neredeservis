import type { Metadata } from "next";
import Link from "next/link";

import { getMarketingBaseUrl, toAbsoluteUrl } from "@/lib/seo/site-urls";
import {
  buildMarketingOrganizationStructuredData,
  buildMarketingWebSiteStructuredData,
} from "@/lib/seo/structured-data";

const marketingBaseUrl = getMarketingBaseUrl();
const openGraphImageUrl = toAbsoluteUrl(marketingBaseUrl, "/opengraph-image");
const organizationStructuredData = buildMarketingOrganizationStructuredData();
const websiteStructuredData = buildMarketingWebSiteStructuredData();

export const metadata: Metadata = {
  title: "NeredeServis | Servis Operasyon Platformu",
  description:
    "Firma operasyonu ve bireysel sofor akislari icin canli takip, rota yonetimi ve web panel deneyimi.",
  alternates: {
    canonical: toAbsoluteUrl(marketingBaseUrl, "/"),
  },
  openGraph: {
    title: "NeredeServis | Servis Operasyon Platformu",
    description:
      "Firma operasyonu ve bireysel sofor akislari icin canli takip, rota yonetimi ve web panel deneyimi.",
    url: toAbsoluteUrl(marketingBaseUrl, "/"),
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

const FEATURE_CARDS = [
  {
    title: "Firma Operasyon Paneli",
    description:
      "Sofor, arac, rota ve canli operasyonlari tek panelde yoneten kurumsal akis.",
    items: [
      "Owner/Admin/Dispatcher/Viewer rol ayrimi",
      "Canli operasyon gorunumu ve risk odagi",
      "Rota ve durak mutasyonlarinda token-safe akis",
    ],
  },
  {
    title: "Bireysel Sofor Akisi",
    description:
      "Kendi rotasini ve gunluk seferlerini takip eden bireysel kullanicilar icin sade panel deneyimi.",
    items: [
      "Company-of-1 model uyumu",
      "Hizli giris ve mode secimi",
      "Kurumsal akislara kontrat-parity ile gecis",
    ],
  },
  {
    title: "Maliyet Kontrollu Harita",
    description:
      "Web tarafinda maliyet odakli harita stratejisi ve server-side limit/cap yaklasimi.",
    items: [
      "Mapbox-first web stratejisi",
      "Rate/cost control guardrails",
      "RTDB stream + trip_doc fallback semantigi",
    ],
  },
] as const;

const OPS_ITEMS = [
  { label: "Aktif Sefer", value: "12", tone: "text-slate-950" },
  { label: "Canli Arac", value: "37", tone: "text-slate-950" },
  { label: "Online Sofor", value: "29", tone: "text-slate-950" },
  { label: "Kritik Uyari", value: "3", tone: "text-amber-700" },
] as const;

const JOURNEY_STEPS = [
  {
    title: "Kurulum",
    text: "Firma / bireysel sofor onboarding ve login akisi",
  },
  {
    title: "Operasyon",
    text: "Rota, durak ve dispatch aksiyonlari",
  },
  {
    title: "Canli Takip",
    text: "Harita, durum semantiklari ve operasyon gorunurlugu",
  },
  {
    title: "Olceklenme",
    text: "Audit, billing, internal admin ve rollout disiplini",
  },
] as const;

export default function MarketingHomePage() {
  return (
    <main className="relative min-h-screen overflow-x-clip bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationStructuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteStructuredData),
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_15%_20%,rgba(37,99,235,0.16),transparent_40%),radial-gradient(circle_at_85%_15%,rgba(15,23,42,0.09),transparent_45%),linear-gradient(to_bottom,rgba(255,255,255,0.92),rgba(245,247,250,1))]" />

      <section className="mx-auto flex w-full max-w-7xl flex-col px-6 py-8 sm:py-10">
        <header className="mb-10 flex items-center justify-between gap-4">
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
              href="/giris"
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50"
            >
              Giris Yap
            </Link>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] xl:gap-10">
          <section className="relative overflow-hidden rounded-3xl border border-line bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                Pilot Ready Web
              </span>
              <span className="inline-flex rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Web-first
              </span>
              <span className="inline-flex rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Firebase + Vercel
              </span>
            </div>

            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl xl:text-6xl">
              Firma operasyonu ve bireysel sofor deneyimini tek platformda birlestir.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-muted sm:text-lg">
              Neredeservis; servis sirketleri ve bireysel soforler icin canli takip, rota
              yonetimi ve operasyon panelini modern bir web deneyimiyle sunar. Bu sayfa urunun
              pilot odakli tanitim ve panel giris katmanidir.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/giris"
                className="rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Web Panele Gir
              </Link>
              <Link
                href="/live-ops"
                className="rounded-2xl border border-line bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                Live Ops Onizleme
              </Link>
              <Link
                href="/routes"
                className="rounded-2xl border border-line bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                Rota Operasyonlari
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["Kurumsal kontrol", "Firma rolleri + operasyon akisi"],
                ["Canli gorunum", "Live ops shell + stale/offline semantigi"],
                ["Gelecege acik", "Web-first kontrat ve app-impact disiplini"],
              ].map(([title, text]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,0.02)]"
                >
                  <div className="text-sm font-semibold text-slate-900">{title}</div>
                  <div className="mt-1 text-xs leading-5 text-muted">{text}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="relative rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Live Ops Preview</h2>
                <p className="text-xs text-muted">Pilot operasyon gorunumu</p>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                online
              </span>
            </div>

            <div className="relative mb-4 overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-slate-100 via-white to-blue-50 p-4">
              <div className="absolute right-5 top-5 h-20 w-20 rounded-full bg-blue-200/40 blur-2xl" />
              <div className="mb-3 flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Harita Alani
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  <span className="text-xs text-slate-600">Canli akis ornegi</span>
                </div>
              </div>

              <div className="grid h-64 grid-cols-[1.25fr_0.75fr] gap-3">
                <div className="rounded-xl border border-line bg-white/70 p-3">
                  <div className="mb-2 text-xs text-muted">Map Canvas</div>
                  <div className="relative h-[calc(100%-1.25rem)] rounded-lg border border-dashed border-line bg-gradient-to-br from-slate-50 to-blue-50">
                    <span className="absolute left-[18%] top-[22%] inline-flex items-center gap-1 rounded-full border border-blue-100 bg-white px-2 py-1 text-[10px] font-semibold text-blue-700 shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                      34 ABC 12
                    </span>
                    <span className="absolute left-[46%] top-[48%] inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-white px-2 py-1 text-[10px] font-semibold text-emerald-700 shadow-sm">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
                      Canli
                    </span>
                    <span className="absolute left-[62%] top-[18%] inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full border border-slate-400" />
                      Stale
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-line bg-white/80 p-3">
                  <div className="mb-2 text-xs text-muted">Dispatch Queue</div>
                  <div className="space-y-2">
                    {["Rota atama bekliyor", "Ping gecikmesi", "Durak update istegi"].map((item) => (
                      <div key={item} className="rounded-lg border border-line bg-white px-2.5 py-2">
                        <div className="text-xs font-medium text-slate-900">{item}</div>
                        <div className="mt-1 text-[11px] text-muted">Operasyon aksiyonu</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {OPS_ITEMS.map((item) => (
                <div key={item.label} className="rounded-2xl border border-line bg-white p-3">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted">
                    {item.label}
                  </div>
                  <div className={`mt-2 text-xl font-semibold ${item.tone}`}>{item.value}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-10 grid gap-4 lg:grid-cols-3">
          {FEATURE_CARDS.map((card) => (
            <article
              key={card.title}
              className="rounded-3xl border border-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h3 className="text-base font-semibold tracking-tight text-slate-950">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{card.description}</p>
              <ul className="mt-4 space-y-2">
                {card.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
            <div className="mb-4 text-sm font-semibold text-slate-900">
              Urun Yolculugu (Plan {"->"} Uygulama)
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {JOURNEY_STEPS.map((step, index) => (
                <div key={step.title} className="rounded-2xl border border-line bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                    Adim {index + 1}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">{step.title}</div>
                  <div className="mt-1 text-xs leading-5 text-muted">{step.text}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
            <div className="mb-2 text-sm font-semibold text-slate-900">Canliya Hazir Cekirdek Paket</div>
            <p className="text-sm leading-6 text-muted">
              Login, mode selector, operasyon panelleri, route stop mutasyonlari ve live ops
              semantikleri aktif. Odak artik pilot musteri onboarding ve app parity kapanisi.
            </p>
            <div className="mt-5 space-y-2">
              {[
                "Email/Password + Google login aktif",
                "Mode selector + active company context",
                "Routes/Vehicles/Drivers/Live Ops gercek callable akislari",
                "Vercel domain + Firebase auth domain uyumu",
              ].map((line) => (
                <div key={line} className="rounded-xl border border-line bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {line}
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/giris"
                className="rounded-2xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Giris Yap
              </Link>
              <Link
                href="/dashboard"
                className="rounded-2xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </section>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 text-sm text-muted">
          <div className="text-xs sm:text-sm">
            NeredeServis Web | Landing + panel tek Next.js app
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/iletisim" className="hover:text-slate-900">
              Iletisim
            </Link>
            <Link href="/gizlilik" className="hover:text-slate-900">
              Gizlilik
            </Link>
            <Link href="/kvkk" className="hover:text-slate-900">
              KVKK
            </Link>
            <Link href="/giris" className="font-medium text-slate-900 hover:text-blue-700">
              Giris
            </Link>
          </div>
        </footer>
      </section>
    </main>
  );
}

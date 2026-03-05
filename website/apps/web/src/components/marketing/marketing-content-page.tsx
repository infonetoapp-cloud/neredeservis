import Link from "next/link";
import { NsLogo } from "@/components/brand/ns-logo";

type MarketingContentPageProps = {
  badge?: string;
  title: string;
  description: string;
  metaItems?: ReadonlyArray<{
    label: string;
    value: string;
  }>;
  sections: ReadonlyArray<{
    heading: string;
    body: string;
    items?: ReadonlyArray<string>;
  }>;
  quickLinks?: ReadonlyArray<{
    label: string;
    href: string;
  }>;
  faqItems?: ReadonlyArray<{
    question: string;
    answer: string;
  }>;
  noteTitle?: string;
  note?: string;
};

function toAnchorId(heading: string, index: number): string {
  const normalized = heading
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `bolum-${index + 1}${normalized ? `-${normalized}` : ""}`;
}

export function MarketingContentPage({
  badge = "Bilgi",
  title,
  description,
  metaItems = [],
  sections,
  quickLinks = [],
  faqItems = [],
  noteTitle = "Bilgilendirme Notu",
  note = "Bu sayfa bilgilendirme amaçlı yayınlanır. Operasyonel ve hukuki metinler revizyon takvimine göre güncellenir.",
}: MarketingContentPageProps) {
  const tocItems = sections.map((section, index) => ({
    id: toAnchorId(section.heading, index),
    label: section.heading,
  }));

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px]"
        style={{
          background:
            "radial-gradient(ellipse 68% 46% at 14% -12%,rgba(10,79,191,0.16),transparent 62%), radial-gradient(ellipse 58% 38% at 86% -10%,rgba(76,189,255,0.14),transparent 58%), linear-gradient(to bottom,rgba(255,255,255,0.99),rgba(245,247,250,1))",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:34px_34px]"
      />

      <div className="mx-auto w-full max-w-6xl px-6 py-8 sm:py-10">
        <header className="mb-10 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center">
            <NsLogo iconSize={24} wordmarkClass="text-base font-bold tracking-tight" />
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-50"
            >
              Ana Sayfa
            </Link>
            <Link
              href="/giris"
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-strong"
            >
              Panel Girişi
            </Link>
          </div>
        </header>

        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm backdrop-blur sm:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-brand/12 blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 top-10 h-52 w-52 rounded-full bg-cyan-300/15 blur-2xl"
          />

          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand">
                {badge}
              </div>
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.75rem]">
                {title}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
                {description}
              </p>

              {metaItems.length > 0 ? (
                <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {metaItems.map((item) => (
                    <div
                      key={item.label + item.value}
                      className="rounded-xl border border-slate-200 bg-slate-50/85 px-3 py-3"
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {item.label}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">{item.value}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <aside className="rounded-2xl border border-slate-200 bg-slate-50/95 p-4 sm:p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Uyum Merkezi
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Belge özeti ürün seviyesinde hazırlanır ve hukuki/sözleşmesel yayınlarla düzenli güncellenir.
              </p>
              {metaItems.length > 0 ? (
                <ul className="mt-4 space-y-2.5">
                  {metaItems.slice(0, 3).map((item) => (
                    <li key={item.label} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand" />
                      <span>
                        <span className="font-semibold text-slate-900">{item.label}:</span> {item.value}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <Link
                href="/iletisim"
                className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong"
              >
                Uyum Süreci İçin İletişim
              </Link>
            </aside>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section className="grid gap-4 md:grid-cols-2">
            {sections.map((section, index) => (
              <article
                id={tocItems[index]?.id}
                key={section.heading}
                className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-[11px] font-semibold text-brand">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2 className="text-base font-semibold text-slate-900">{section.heading}</h2>
                </div>
                <p className="text-sm leading-6 text-slate-700">{section.body}</p>
                {section.items && section.items.length > 0 ? (
                  <ul className="mt-3 space-y-1.5">
                    {section.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </section>

          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              {tocItems.length > 1 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    İçindekiler
                  </div>
                  <nav className="mt-3 space-y-1.5">
                    {tocItems.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className="block rounded-lg px-2 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-brand"
                      >
                        {item.label}
                      </a>
                    ))}
                  </nav>
                </div>
              ) : null}

              {quickLinks.length > 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Hızlı İşlemler
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {quickLinks.map((link) => (
                      <Link
                        key={link.href + link.label}
                        href={link.href}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-100"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {noteTitle}
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">{note}</p>
              </div>
            </div>
          </aside>
        </div>

        {tocItems.length > 1 ? (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:hidden">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              İçindekiler
            </div>
            <nav className="mt-2 flex flex-wrap gap-2">
              {tocItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-brand/30 hover:text-brand"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </section>
        ) : null}

        {quickLinks.length > 0 ? (
          <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:hidden">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Hızlı İşlemler
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:hidden">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{noteTitle}</div>
          <p className="mt-2 text-sm leading-6 text-slate-700">{note}</p>
        </section>

        {faqItems.length > 0 ? (
          <section className="mt-10">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Sık Sorulan Uyum Başlıkları
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {faqItems.map((item) => (
                <article
                  key={item.question}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <h3 className="text-sm font-semibold text-slate-900">{item.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.answer}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-10 rounded-3xl border border-line bg-gradient-to-r from-slate-900 via-brand-strong to-brand p-7 text-white shadow-lg sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Kurumsal Uyum Sürecini Planlayalım</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">
                Güvenlik, KVKK ve operasyonel sorumluluk çerçevenizi ürün ekibimizle birlikte netleştirin.
              </p>
            </div>
            <Link
              href="/iletisim"
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-strong transition hover:bg-blue-50"
            >
              İletişim Sayfasına Git
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

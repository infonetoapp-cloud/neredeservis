import Link from "next/link";
import { NsLogo } from "@/components/brand/ns-logo";

type MarketingContentPageProps = {
  badge?: string;
  title: string;
  description: string;
  sections: ReadonlyArray<{
    heading: string;
    body: string;
    items?: ReadonlyArray<string>;
  }>;
  quickLinks?: ReadonlyArray<{
    label: string;
    href: string;
  }>;
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
  sections,
  quickLinks = [],
  note = "Bu sayfa bilgilendirme amaçlı yayınlanır. Operasyonel ve hukuki metinler revizyon takvimine göre güncellenir.",
}: MarketingContentPageProps) {
  const tocItems = sections.map((section, index) => ({
    id: toAnchorId(section.heading, index),
    label: section.heading,
  }));

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(circle_at_20%_10%,rgba(10,79,191,0.14),transparent_45%),linear-gradient(to_bottom,rgba(255,255,255,0.96),rgba(245,247,250,1))]" />

      <div className="mx-auto w-full max-w-4xl px-6 py-8 sm:py-10">
        <header className="mb-8 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center">
            <NsLogo iconSize={24} wordmarkClass="text-base font-bold tracking-tight" />
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

        <section className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
                {badge}
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
                {description}
              </p>

              {tocItems.length > 1 ? (
                <div className="mt-6 rounded-2xl border border-line bg-slate-50 p-3 lg:hidden">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    İçindekiler
                  </div>
                  <nav className="mt-2 flex flex-wrap gap-2">
                    {tocItems.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className="rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:border-brand/30 hover:text-brand"
                      >
                        {item.label}
                      </a>
                    ))}
                  </nav>
                </div>
              ) : null}

              <div className="mt-8 space-y-4">
                {sections.map((section, index) => (
                  <article
                    id={tocItems[index]?.id}
                    key={section.heading}
                    className="scroll-mt-24 rounded-2xl border border-line bg-slate-50 p-4 sm:p-5"
                  >
                    <h2 className="text-sm font-semibold text-slate-900 sm:text-base">
                      {section.heading}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {section.body}
                    </p>
                    {section.items && section.items.length > 0 ? (
                      <ul className="mt-3 space-y-1.5">
                        {section.items.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                ))}
              </div>

              {quickLinks.length > 0 ? (
                <div className="mt-8 rounded-2xl border border-line bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Hızlı İşlemler
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {quickLinks.map((link) => (
                      <Link
                        key={link.href + link.label}
                        href={link.href}
                        className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-100"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-8 rounded-2xl border border-line bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Bilgilendirme Notu
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {note}
                </p>
              </div>
            </div>

            {tocItems.length > 1 ? (
              <aside className="hidden lg:block">
                <div className="sticky top-24 rounded-2xl border border-line bg-slate-50 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    İçindekiler
                  </div>
                  <nav className="mt-3 space-y-1.5">
                    {tocItems.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className="block rounded-lg px-2 py-1.5 text-sm text-slate-600 transition hover:bg-white hover:text-brand"
                      >
                        {item.label}
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

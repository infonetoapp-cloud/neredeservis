import Link from "next/link";

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

export function MarketingContentPage({
  badge = "Bilgi",
  title,
  description,
  sections,
  quickLinks = [],
  note = "Bu sayfa bilgilendirme amacli yayinlanir. Operasyonel ve hukuki metinler revizyon takvimine gore guncellenir.",
}: MarketingContentPageProps) {
  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(circle_at_20%_10%,rgba(37,99,235,0.14),transparent_45%),linear-gradient(to_bottom,rgba(255,255,255,0.96),rgba(245,247,250,1))]" />

      <div className="mx-auto w-full max-w-4xl px-6 py-8 sm:py-10">
        <header className="mb-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-blue-100 bg-white shadow-sm">
              <span className="text-sm font-semibold text-blue-700">NS</span>
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-slate-950">
                NeredeServis
              </div>
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
              Panel Girisi
            </Link>
          </div>
        </header>

        <section className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-4 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
            {badge}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {title}
          </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
              {description}
            </p>

          <div className="mt-8 space-y-4">
            {sections.map((section) => (
              <article
                key={section.heading}
                className="rounded-2xl border border-line bg-slate-50 p-4 sm:p-5"
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
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-600" />
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
                Hizli Islemler
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
        </section>
      </div>
    </main>
  );
}

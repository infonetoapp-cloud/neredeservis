import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="relative min-h-screen overflow-x-clip bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,rgba(37,99,235,0.16),transparent_45%),radial-gradient(circle_at_85%_15%,rgba(15,23,42,0.1),transparent_45%),linear-gradient(to_bottom,rgba(255,255,255,0.94),rgba(245,247,250,1))]" />

      <section className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6 py-12">
        <div className="w-full rounded-3xl border border-line bg-white/90 p-8 shadow-sm backdrop-blur sm:p-10">
          <div className="mb-4 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
            404
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Aradiginiz sayfa bulunamadi
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
            Link eski olabilir veya sayfa tasinmis olabilir. Operasyon paneline donmek icin
            giris sayfasini kullanin, marketing akisina donmek icin ana sayfaya gecin.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/giris"
              className="rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Panele Giris
            </Link>
            <Link
              href="/"
              className="rounded-2xl border border-line bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Ana Sayfa
            </Link>
            <Link
              href="/iletisim"
              className="rounded-2xl border border-line bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Iletisim
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}


import Link from "next/link";

export default function ModeSelectPage() {
  return (
    <section className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <p className="mb-2 text-xs font-semibold tracking-wide text-blue-700 uppercase">
          P0-7 Placeholder
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          Hangi mod ile devam etmek istiyorsun?
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Bu ekran Faz 1 hard-coded mode selector placeholder&apos;idir. Gercek
          `listMyCompanies` ve role resolution backend baglantisi Faz 2+ ile
          gelecek.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <div className="mb-2 text-sm font-semibold text-slate-900">
            Company Mode
          </div>
          <p className="mb-4 text-sm text-muted">
            Operasyon, rota, arac ve live ops panel akisi.
          </p>
          <Link
            href="/dashboard?mode=company"
            className="inline-flex w-full items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Company Mode ile Devam Et
          </Link>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <div className="mb-2 text-sm font-semibold text-slate-900">
            Individual Driver Mode
          </div>
          <p className="mb-4 text-sm text-muted">
            Bireysel sofor dashboard akisi (placeholder).
          </p>
          <Link
            href="/dashboard?mode=individual"
            className="inline-flex w-full items-center justify-center rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Bireysel Mod ile Devam Et
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-line bg-slate-50 p-4 text-sm text-muted">
        Not: Bu ekran bilerek hard-coded. Faz 1&apos;de Firestore query baglanmaz.
      </div>
    </section>
  );
}

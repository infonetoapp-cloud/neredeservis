import Link from "next/link";
import { NsLogo } from "@/components/brand/ns-logo";

export default function NotFoundPage() {
  return (
    <main className="relative min-h-screen overflow-x-clip bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,rgba(10,79,191,0.16),transparent_45%),radial-gradient(circle_at_85%_15%,rgba(255,122,0,0.12),transparent_45%),linear-gradient(to_bottom,rgba(255,255,255,0.94),rgba(245,247,250,1))]" />

      <section className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6 py-12">
        <div className="w-full rounded-3xl border border-line bg-white/90 p-8 shadow-sm backdrop-blur sm:p-10">
          <Link href="/" className="mb-6 inline-flex items-center">
            <NsLogo iconSize={24} wordmarkClass="text-base font-bold tracking-tight" />
          </Link>

          <div className="mb-4 inline-flex rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
            404
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Aradığınız sayfa bulunamadı
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
            Link eski olabilir veya sayfa taşınmış olabilir. Operasyon paneline dönmek için
            giriş sayfasını kullanın, marketing akışına dönmek için ana sayfaya geçin.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/giris"
              className="rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-strong"
            >
              Panele Giriş
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
              İletişim
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}


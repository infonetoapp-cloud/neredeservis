import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import type { LandingHeroConfig } from "../landing-config-types";

interface Props {
  hero: LandingHeroConfig;
}

export function LandingHero({ hero }: Props) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#edf3ff] via-[#f7f9ff] to-white pt-28 pb-20 sm:pt-36 sm:pb-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-[540px] w-[760px] -translate-x-1/2 rounded-full bg-brand/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 text-center">
        {hero.badgeVisible && (
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Star className="h-3.5 w-3.5" />
            </span>
            {hero.badgeText}
          </div>
        )}

        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-[-0.03em] text-slate-900 sm:text-[58px] sm:leading-[1.08]">
          <span className="block">{hero.headlineLine1}</span>
          <span className="mt-2 block bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">
            {hero.headlineLine2}
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg sm:leading-8">
          {hero.subtitle}
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href={hero.primaryCta.link}
            className="group inline-flex items-center gap-2 rounded-2xl bg-brand px-8 py-4 text-base font-bold text-white shadow-[0_12px_28px_rgba(10,79,191,0.24)] transition-all hover:scale-[1.02] hover:bg-brand-strong hover:shadow-[0_16px_34px_rgba(10,79,191,0.32)]"
          >
            {hero.primaryCta.text}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href={hero.secondaryCta.link}
            className="inline-flex items-center gap-2 rounded-2xl border border-brand/20 bg-white px-8 py-4 text-base font-semibold text-brand shadow-sm transition-all hover:border-brand/40 hover:bg-accent-soft"
          >
            {hero.secondaryCta.text}
          </Link>
        </div>

        <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-slate-200/90 bg-white/95 p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl bg-slate-50 px-3 py-3 text-center">
              <p className="text-lg font-bold text-slate-900">99.9%</p>
              <p className="text-xs text-slate-500">Uptime</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-3 text-center">
              <p className="text-lg font-bold text-slate-900">&lt;200ms</p>
              <p className="text-xs text-slate-500">Canlı konum</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-3 text-center">
              <p className="text-lg font-bold text-slate-900">7/24</p>
              <p className="text-xs text-slate-500">Operasyon destegi</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-3 text-center">
              <p className="text-lg font-bold text-slate-900">KVKK</p>
              <p className="text-xs text-slate-500">Uyumlu altyapi</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


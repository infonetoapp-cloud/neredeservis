import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LandingHeroConfig } from "../landing-config-types";

interface Props {
  hero: LandingHeroConfig;
}

export function LandingHero({ hero }: Props) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#F0FDFA] to-white pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* Soft radial glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-teal-100/40 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 text-center">
        {/* Badge */}
        {hero.badgeVisible && (
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-xs font-semibold text-teal-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
            </span>
            {hero.badgeText}
          </div>
        )}

        {/* Headline */}
        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-[-0.025em] text-slate-900 sm:text-[56px] sm:leading-[1.1] lg:text-7xl">
          <span className="block">{hero.headlineLine1}</span>
          <span className="mt-2 block bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
            {hero.headlineLine2}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg sm:leading-8">
          {hero.subtitle}
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href={hero.primaryCta.link}
            className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-teal-700 px-8 py-4 text-base font-bold text-white shadow-[0_10px_25px_rgba(13,148,136,0.25)] transition-all hover:shadow-[0_14px_30px_rgba(13,148,136,0.35)] hover:scale-[1.02]"
          >
            {hero.primaryCta.text}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href={hero.secondaryCta.link}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
          >
            {hero.secondaryCta.text}
          </Link>
        </div>
      </div>
    </section>
  );
}

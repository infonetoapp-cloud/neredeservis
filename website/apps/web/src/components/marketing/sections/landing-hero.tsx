import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LandingHeroConfig } from "../landing-config-types";

interface Props {
  hero: LandingHeroConfig;
}

export function LandingHero({ hero }: Props) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#eef4ff] to-white pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* Soft radial glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-brand/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 text-center">
        {/* Badge */}
        {hero.badgeVisible && (
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-4 py-1.5 text-xs font-semibold text-brand">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
            </span>
            {hero.badgeText}
          </div>
        )}

        {/* Headline */}
        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-[-0.025em] text-slate-900 sm:text-[56px] sm:leading-[1.1] lg:text-7xl">
          <span className="block">{hero.headlineLine1}</span>
          <span className="mt-2 block bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">
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
            className="group inline-flex items-center gap-2 rounded-2xl bg-brand px-8 py-4 text-base font-bold text-white shadow-[0_10px_25px_rgba(10,79,191,0.24)] transition-all hover:scale-[1.02] hover:bg-brand-strong hover:shadow-[0_14px_30px_rgba(10,79,191,0.34)]"
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
      </div>
    </section>
  );
}

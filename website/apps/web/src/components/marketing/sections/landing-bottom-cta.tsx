import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LandingBottomCtaConfig } from "../landing-config-types";

interface Props {
  bottomCta: LandingBottomCtaConfig;
}

export function LandingBottomCta({ bottomCta }: Props) {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
          <div className="pointer-events-none absolute -top-12 -right-12 h-56 w-56 rounded-full bg-brand/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-12 h-56 w-56 rounded-full bg-accent/15 blur-3xl" />

          <div className="relative">
            <p className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              Hemen baslayin
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              {bottomCta.headlineLine1}
              <br />
              <span className="bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">
                {bottomCta.headlineLine2}
              </span>
            </h2>
            <p className="mt-4 max-w-2xl text-slate-600">{bottomCta.subtitle}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={bottomCta.primaryCta.link}
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-7 py-3.5 text-sm font-bold text-white transition-all hover:scale-[1.01] hover:bg-brand-strong"
              >
                {bottomCta.primaryCta.text}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href={bottomCta.secondaryCta.link}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-7 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-brand/30 hover:bg-slate-50"
              >
                {bottomCta.secondaryCta.text}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


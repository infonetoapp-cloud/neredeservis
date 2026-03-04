import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import type { LandingBottomCtaConfig } from "../landing-config-types";

interface Props {
  bottomCta: LandingBottomCtaConfig;
}

export function LandingBottomCta({ bottomCta }: Props) {
  return (
    <section className="py-24">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-teal-700 via-teal-800 to-teal-900 px-8 py-16 text-center sm:px-16">
        {/* Glow */}
        <div className="pointer-events-none absolute top-0 right-0 h-64 w-64 rounded-full bg-teal-400/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />

        <h2 className="relative text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {bottomCta.headlineLine1}
          <br />
          <span className="bg-gradient-to-r from-teal-200 to-emerald-300 bg-clip-text text-transparent">
            {bottomCta.headlineLine2}
          </span>
        </h2>
        <p className="relative mx-auto mt-4 max-w-lg text-teal-100">
          {bottomCta.subtitle}
        </p>
        <div className="relative mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href={bottomCta.primaryCta.link}
            className="group inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-bold text-teal-800 shadow-xl transition-all hover:shadow-2xl hover:scale-[1.02]"
          >
            {bottomCta.primaryCta.text}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href={bottomCta.secondaryCta.link}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-200 transition hover:text-white"
          >
            {bottomCta.secondaryCta.text}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

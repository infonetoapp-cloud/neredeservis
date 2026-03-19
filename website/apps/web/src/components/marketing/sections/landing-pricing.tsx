import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { LandingPricingConfig } from "../landing-config-types";

interface Props {
  pricing: LandingPricingConfig;
}

export function LandingPricing({ pricing }: Props) {
  return (
    <section id="pricing" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <p className="text-sm font-semibold tracking-widest text-brand uppercase">Pricing</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {pricing.sectionTitle}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">{pricing.sectionSubtitle}</p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {pricing.plans.map((plan) => (
            <article
              key={plan.name}
              className={`relative overflow-hidden rounded-2xl border p-6 text-left transition-all ${
                plan.highlighted
                  ? "border-brand/35 bg-white shadow-lg shadow-brand/10"
                  : "border-slate-200 bg-white shadow-sm hover:border-brand/20 hover:shadow-md"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand to-accent" />
              )}

              <p className="text-sm font-medium text-slate-500">{plan.name}</p>
              <div className="mt-2 flex items-baseline gap-1">
                <p className="text-3xl font-black tracking-tight text-slate-900">{plan.price}</p>
                {plan.priceSuffix && <span className="text-sm text-slate-500">{plan.priceSuffix}</span>}
              </div>
              <p className="mt-2 text-sm text-slate-500">{plan.description}</p>

              <ul className="mt-6 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaLink}
                className={`mt-7 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  plan.highlighted
                    ? "bg-brand text-white shadow-[0_8px_20px_rgba(10,79,191,0.22)] hover:bg-brand-strong"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-brand/30 hover:bg-slate-50"
                }`}
              >
                {plan.ctaText}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}


import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { LandingPricingConfig } from "../landing-config-types";

interface Props {
  pricing: LandingPricingConfig;
}

export function LandingPricing({ pricing }: Props) {
  return (
    <section id="pricing" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-4xl px-6 text-center">
        {/* Header */}
        <p className="text-sm font-semibold tracking-widest text-teal-600 uppercase">
          Fiyatlandırma
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {pricing.sectionTitle}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-600">
          {pricing.sectionSubtitle}
        </p>

        {/* Cards */}
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {pricing.plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative overflow-hidden rounded-2xl border p-6 text-left transition ${
                plan.highlighted
                  ? "border-teal-300 bg-white shadow-lg shadow-teal-100 ring-2 ring-teal-100"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-400" />
              )}

              <p className="text-sm font-medium text-slate-500">{plan.name}</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900">{plan.price}</span>
                {plan.priceSuffix && (
                  <span className="text-sm text-slate-400">{plan.priceSuffix}</span>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-500">{plan.description}</p>

              <ul className="mt-6 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-500" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaLink}
                className={`mt-6 block rounded-xl py-2.5 text-center text-sm font-semibold transition ${
                  plan.highlighted
                    ? "bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-[0_8px_20px_rgba(13,148,136,0.2)] hover:shadow-[0_12px_24px_rgba(13,148,136,0.3)]"
                    : "border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {plan.ctaText}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

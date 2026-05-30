import { resolveIcon } from "../landing-icon-map";
import type { LandingFeaturesConfig, FeatureColor } from "../landing-config-types";

interface Props {
  features: LandingFeaturesConfig;
}

const COLOR_STYLES: Record<FeatureColor, { bg: string; text: string }> = {
  teal: { bg: "bg-brand/10", text: "text-brand" },
  sky: { bg: "bg-brand/10", text: "text-brand" },
  amber: { bg: "bg-accent/15", text: "text-accent" },
  violet: { bg: "bg-slate-100", text: "text-slate-700" },
  rose: { bg: "bg-accent/15", text: "text-accent" },
  emerald: { bg: "bg-brand/10", text: "text-brand" },
  indigo: { bg: "bg-slate-100", text: "text-slate-700" },
  orange: { bg: "bg-accent/15", text: "text-accent" },
};

export function LandingFeatures({ features }: Props) {
  return (
    <section id="features" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold tracking-widest text-brand uppercase">Özellikler</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {features.sectionTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">{features.sectionSubtitle}</p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.items.map((feature) => {
            const Icon = resolveIcon(feature.icon);
            const colors = COLOR_STYLES[feature.color] ?? COLOR_STYLES.teal;

            return (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-lg"
              >
                <div className="pointer-events-none absolute top-0 right-0 h-24 w-24 rounded-full bg-brand/5 blur-2xl" />
                <div className="relative mb-4 flex items-center justify-between">
                  <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3.5 py-2 text-slate-500">
                    <Icon className={`h-6 w-6 ${colors.text}`} />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

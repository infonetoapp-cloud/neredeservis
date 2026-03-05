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
        {/* Header */}
        <div className="text-center">
          <p className="text-sm font-semibold tracking-widest text-brand uppercase">
            Özellikler
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {features.sectionTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">
            {features.sectionSubtitle}
          </p>
        </div>

        {/* Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.items.map((f) => {
            const Icon = resolveIcon(f.icon);
            const colors = COLOR_STYLES[f.color] ?? COLOR_STYLES.teal;
            return (
              <div
                key={f.title}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-brand/25 hover:shadow-lg"
              >
                <div className={`inline-flex rounded-xl p-3 ${colors.bg}`}>
                  <Icon className={`h-5 w-5 ${colors.text}`} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{f.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

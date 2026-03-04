import { resolveIcon } from "../landing-icon-map";
import type { LandingFeaturesConfig, FeatureColor } from "../landing-config-types";

interface Props {
  features: LandingFeaturesConfig;
}

const COLOR_STYLES: Record<FeatureColor, { bg: string; text: string }> = {
  teal:    { bg: "bg-teal-100",    text: "text-teal-600" },
  sky:     { bg: "bg-sky-100",     text: "text-sky-600" },
  amber:   { bg: "bg-amber-100",   text: "text-amber-600" },
  violet:  { bg: "bg-violet-100",  text: "text-violet-600" },
  rose:    { bg: "bg-rose-100",    text: "text-rose-600" },
  emerald: { bg: "bg-emerald-100", text: "text-emerald-600" },
  indigo:  { bg: "bg-indigo-100",  text: "text-indigo-600" },
  orange:  { bg: "bg-orange-100",  text: "text-orange-600" },
};

export function LandingFeatures({ features }: Props) {
  return (
    <section id="features" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="text-center">
          <p className="text-sm font-semibold tracking-widest text-teal-600 uppercase">
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
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-teal-200 hover:shadow-lg"
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

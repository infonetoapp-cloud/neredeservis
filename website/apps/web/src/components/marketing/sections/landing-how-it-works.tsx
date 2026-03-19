import { resolveIcon } from "../landing-icon-map";
import type { LandingHowItWorksConfig } from "../landing-config-types";

interface Props {
  howItWorks: LandingHowItWorksConfig;
}

export function LandingHowItWorks({ howItWorks }: Props) {
  return (
    <section id="how-it-works" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold tracking-widest text-brand uppercase">Nasıl Çalışır</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {howItWorks.sectionTitle}
          </h2>
        </div>

        <div className="relative mt-16 grid gap-8 sm:grid-cols-3">
          {howItWorks.steps.length > 1 && (
            <div className="absolute top-7 right-[16.67%] left-[16.67%] hidden h-px border-t-2 border-dashed border-slate-200 sm:block" />
          )}

          {howItWorks.steps.map((step, i) => {
            const Icon = resolveIcon(step.icon);
            return (
              <div key={i} className="relative text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 ring-1 ring-brand/20">
                  <Icon className="h-6 w-6 text-brand" />
                </div>
                <div className="mt-2 text-xs font-bold tracking-widest text-brand/80 uppercase">
                  Adım {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-3 text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

import type { StatItem } from "../landing-config-types";

interface Props {
  stats: StatItem[];
}

export function LandingStats({ stats }: Props) {
  if (stats.length === 0) return null;

  return (
    <section className="relative z-10 mx-auto -mt-4 max-w-5xl px-6 sm:-mt-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="grid gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white px-6 py-5 text-center sm:py-6">
              <div className="bg-gradient-to-r from-brand to-accent bg-clip-text text-2xl font-black tracking-tight text-transparent">
                {stat.value}
              </div>
              <div className="mt-1 text-xs font-medium text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


import type { StatItem } from "../landing-config-types";

interface Props {
  stats: StatItem[];
}

export function LandingStats({ stats }: Props) {
  if (stats.length === 0) return null;

  return (
    <section className="relative z-10 mx-auto mt-4 max-w-3xl px-6 sm:mt-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-2 gap-px bg-slate-200 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white px-6 py-5 text-center sm:py-6">
              <div className="text-2xl leading-[1.15] font-bold text-slate-900">{stat.value}</div>
              <div className="mt-1 text-xs font-medium text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { getPublicAppEnv } from "@/lib/env/public-env";

const toneMap: Record<string, string> = {
  dev: "bg-amber-100/85 text-amber-900 border-amber-200/80",
  stg: "bg-teal-100/85 text-teal-900 border-teal-200/80",
  prod: "bg-emerald-100/85 text-emerald-900 border-emerald-200/80",
};

export function EnvBadge() {
  const env = getPublicAppEnv();
  const tone = toneMap[env] ?? "bg-slate-100 text-slate-800 border-slate-200";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] ${tone}`}
    >
      {env}
    </span>
  );
}

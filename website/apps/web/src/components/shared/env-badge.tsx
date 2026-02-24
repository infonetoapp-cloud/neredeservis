import { getPublicAppEnv } from "@/lib/env/public-env";

const toneMap: Record<string, string> = {
  dev: "bg-amber-100 text-amber-900 border-amber-200",
  stg: "bg-sky-100 text-sky-900 border-sky-200",
  prod: "bg-emerald-100 text-emerald-900 border-emerald-200",
};

export function EnvBadge() {
  const env = getPublicAppEnv();
  const tone = toneMap[env] ?? "bg-slate-100 text-slate-800 border-slate-200";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${tone}`}
    >
      {env}
    </span>
  );
}

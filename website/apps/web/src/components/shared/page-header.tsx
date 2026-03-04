import type { ReactNode } from "react";

type PageHeaderProps = {
  /** Small uppercase label above the title */
  eyebrow?: string;
  /** Main page title */
  title: string;
  /** Optional subtitle / description */
  description?: string;
  /** Accent color name (tailwind) — applied as left border + icon badge bg */
  accent?: string;
  /** Icon shown inside the accent badge */
  icon?: ReactNode;
  /** Right-side actions (buttons, etc.) */
  actions?: ReactNode;
};

/**
 * Page-level header card — replaces CompanyModuleShell.
 * Rounded-2xl, soft shadow, accent left border, no sharp edges.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  accent = "indigo",
  icon,
  actions,
}: PageHeaderProps) {
  /* Map accent name to tailwind classes */
  const accentMap: Record<string, { border: string; badge: string }> = {
    indigo:  { border: "border-l-indigo-500",  badge: "bg-gradient-to-br from-indigo-400 to-indigo-600" },
    emerald: { border: "border-l-emerald-500", badge: "bg-gradient-to-br from-emerald-400 to-emerald-600" },
    violet:  { border: "border-l-violet-500",  badge: "bg-gradient-to-br from-violet-400 to-violet-600" },
    rose:    { border: "border-l-rose-500",    badge: "bg-gradient-to-br from-rose-400 to-rose-600" },
    orange:  { border: "border-l-orange-500",  badge: "bg-gradient-to-br from-orange-400 to-orange-600" },
    slate:   { border: "border-l-slate-500",   badge: "bg-gradient-to-br from-slate-400 to-slate-600" },
    teal:    { border: "border-l-teal-500",    badge: "bg-gradient-to-br from-teal-400 to-teal-600" },
    amber:   { border: "border-l-amber-500",   badge: "bg-gradient-to-br from-amber-400 to-amber-600" },
    sky:     { border: "border-l-sky-500",     badge: "bg-gradient-to-br from-sky-400 to-sky-600" },
  };

  const colors = accentMap[accent] ?? accentMap.indigo;

  return (
    <div
      className={`rounded-2xl border border-line bg-white p-5 shadow-sm border-l-4 ${colors.border}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="mb-1.5 text-[10px] font-semibold tracking-[0.16em] text-slate-400 uppercase">
              {eyebrow}
            </p>
          ) : null}

          <h1 className="inline-flex items-center gap-2.5 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            {icon ? (
              <span
                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${colors.badge}`}
              >
                {icon}
              </span>
            ) : null}
            {title}
          </h1>

          {description ? (
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-500">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

import type { ReactNode } from "react";

type EmptyStateProps = {
  /** Main message (e.g., "Henüz rota yok") */
  title: string;
  /** Explanatory text */
  description?: string;
  /** Large pastel icon or illustration */
  icon?: ReactNode;
  /** CTA button */
  action?: ReactNode;
};

/**
 * Full empty-state block — shown when a list or section has no data.
 * Large centered illustration, soft text, optional CTA.
 * Always rounded-2xl with no sharp edges.
 */
export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-16 text-center">
      {icon ? (
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
          {icon}
        </div>
      ) : null}

      <h3 className="text-base font-semibold text-slate-700">{title}</h3>

      {description ? (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-400">
          {description}
        </p>
      ) : null}

      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

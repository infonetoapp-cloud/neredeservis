import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  checkpoints: string[];
  icon?: ReactNode;
  children?: ReactNode;
};

export function CompanyModuleShell({
  eyebrow,
  title,
  description,
  checkpoints,
  icon,
  children,
}: Props) {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_2px_6px_rgba(16,24,40,0.04)]">
        <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-[#6c727b] uppercase">{eyebrow}</p>
        <h1 className="inline-flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
          {icon ? <span className="icon-badge h-8 w-8">{icon}</span> : null}
          {title}
        </h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted">{description}</p>
      </div>

      <div className="rounded-2xl border border-line bg-white p-4 shadow-[0_2px_6px_rgba(16,24,40,0.04)]">
        <div className="mb-3 text-sm font-semibold text-slate-900">Bu modulde odaklanilan adimlar</div>
        <div className="grid gap-2 md:grid-cols-3">
          {checkpoints.map((item) => (
            <div key={item} className="rounded-xl border border-line bg-[#fafbfd] p-3">
              <div className="text-sm font-medium text-slate-900">{item}</div>
            </div>
          ))}
        </div>
      </div>

      {children}
    </section>
  );
}

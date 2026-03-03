"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type DashboardFeaturePlaceholderProps = {
  badge?: string;
  title: string;
  description: string;
  nextPhaseNotes?: readonly string[];
  workspace?: ReactNode;
  sidePanel?: ReactNode;
  workspaceFullWidth?: boolean;
};

export function DashboardFeaturePlaceholder({
  badge = "Operations",
  title,
  description,
  nextPhaseNotes = [],
  workspace,
  sidePanel,
  workspaceFullWidth = false,
}: DashboardFeaturePlaceholderProps) {
  const defaultWorkspace = (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="mb-3 text-sm font-semibold text-slate-900">Calisma Alani</div>
      <div className="h-72 rounded-xl border border-dashed border-line bg-gradient-to-br from-white to-slate-50" />
      <div className="mt-3 text-xs leading-5 text-muted">
        Bu bolum operasyon listeleri, harita ve formlari barindirir.
      </div>
    </div>
  );

  const defaultSidePanel = (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div className="mb-2 text-sm font-semibold text-slate-900">Odak Notlari (Ornek)</div>
        <ul className="space-y-2 text-sm text-muted">
          {(nextPhaseNotes.length > 0
            ? nextPhaseNotes
            : [
                "Operasyon akislarinda rol bazli gorunum dogrulanir",
                "Liste, detay ve mutasyon davranislari birlikte izlenir",
                "Hata/yukleniyor/bos durumlari tek semantik ile korunur",
              ]
          ).map((note) => (
            <li key={note} className="rounded-xl border border-line bg-white px-3 py-2">
              {note}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div className="mb-2 text-sm font-semibold text-slate-900">Hizli Gecisler</div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            Dashboard
          </Link>
          <Link
            href="/mode-select"
            className="inline-flex items-center rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            Firma Sec
          </Link>
          <Link
            href="/live-ops"
            className="inline-flex items-center rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            Canli Ops
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className="mb-2 inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
          {badge}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{description}</p>
      </div>

      <div className={`grid gap-4 ${workspaceFullWidth ? "" : "lg:grid-cols-[1.1fr_0.9fr]"}`}>
        <div className={workspaceFullWidth ? "lg:col-span-2" : undefined}>
          {workspace ?? defaultWorkspace}
        </div>
        {workspaceFullWidth ? (
          sidePanel ? <div className="lg:col-span-2">{sidePanel}</div> : null
        ) : (
          (sidePanel ?? defaultSidePanel)
        )}
      </div>
    </section>
  );
}

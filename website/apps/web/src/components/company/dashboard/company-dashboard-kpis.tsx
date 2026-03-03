"use client";

import type { ComponentType, SVGProps } from "react";

import { CarIcon, PulseIcon, RouteIcon } from "@/components/shared/app-icons";

type Props = {
  routesTracked: number;
  activeTrips: number;
  liveRoutes: number;
  attentionRoutes: number;
};

type KpiCard = {
  label: string;
  value: number;
  hint: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  iconBg: string;
  iconColor: string;
  accent: string;
};

export function CompanyDashboardKpis({
  routesTracked,
  activeTrips,
  liveRoutes,
  attentionRoutes,
}: Props) {
  const cards: KpiCard[] = [
    {
      label: "İzlenen Rota",
      value: routesTracked,
      icon: RouteIcon,
      hint: "Canlı izlenen toplam rota",
      iconBg: "#EBF3FE",
      iconColor: "#2563EB",
      accent: "#2563EB",
    },
    {
      label: "Aktif Sefer",
      value: activeTrips,
      icon: CarIcon,
      hint: "Şu anda seferde olan araçlar",
      iconBg: "#FFF0ED",
      iconColor: "#F5735A",
      accent: "#F5735A",
    },
    {
      label: "Canlı Hat",
      value: liveRoutes,
      icon: PulseIcon,
      hint: "Son sinyali taze gelenler",
      iconBg: "#E8FAF1",
      iconColor: "#16A34A",
      accent: "#16A34A",
    },
    {
      label: "Dikkat Gereken",
      value: attentionRoutes,
      icon: PulseIcon,
      hint: "Konumu geciken veya bağlantısı kopanlar",
      iconBg: "#FFF8E7",
      iconColor: "#D97706",
      accent: "#D97706",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.label}
          className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.06)] transition hover:shadow-[0_6px_24px_rgba(15,23,42,0.10)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{ background: card.iconBg }}
            >
              <card.icon className="h-5 w-5" style={{ color: card.iconColor }} />
            </div>
            <div
              className="mt-0.5 h-1.5 w-1.5 rounded-full ring-2 ring-white"
              style={{ background: card.value > 0 ? card.accent : "#CBD5E1" }}
            />
          </div>
          <div className="mt-4">
            <div
              className="text-3xl font-bold leading-none tracking-tight"
              style={{ color: "#0F172A" }}
            >
              {card.value}
            </div>
            <div className="mt-1.5 text-[13px] font-semibold text-slate-700">{card.label}</div>
            <div className="mt-1 text-xs text-slate-400">{card.hint}</div>
          </div>
          <div
            className="mt-3 h-0.5 w-8 rounded-full opacity-60"
            style={{ background: card.accent }}
          />
        </article>
      ))}
    </div>
  );
}


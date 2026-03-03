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
          className="group flex items-center gap-4 rounded-[10px] border border-slate-100 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition hover:shadow-[0_4px_16px_rgba(15,23,42,0.08)]"
        >
          <div
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
            style={{ background: card.iconBg }}
          >
            <card.icon className="h-5 w-5" style={{ color: card.iconColor }} />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-slate-500">{card.label}</div>
            <div
              className="text-2xl font-bold leading-tight tracking-tight"
              style={{ color: "#0F172A" }}
            >
              {card.value}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}


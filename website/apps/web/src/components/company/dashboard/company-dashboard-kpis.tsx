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
  tone: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  hint: string;
};

export function CompanyDashboardKpis({
  routesTracked,
  activeTrips,
  liveRoutes,
  attentionRoutes,
}: Props) {
  const cards: KpiCard[] = [
    {
      label: "Izlenen Rota",
      value: routesTracked,
      icon: RouteIcon,
      hint: "Canli izlenen toplam rota",
      tone: "from-[#ebf5ff] to-[#f8fbff] text-[#1f4b7b]",
    },
    {
      label: "Aktif Sefer",
      value: activeTrips,
      icon: CarIcon,
      hint: "Su anda seferde olan araclar",
      tone: "from-[#e8fbf7] to-[#f6fffd] text-[#1f6458]",
    },
    {
      label: "Canli Hat",
      value: liveRoutes,
      icon: PulseIcon,
      hint: "Son sinyali taze gelenler",
      tone: "from-[#f0fdf4] to-[#fcfffd] text-[#1f6a3b]",
    },
    {
      label: "Dikkat Gereken",
      value: attentionRoutes,
      icon: PulseIcon,
      hint: "Konumu geciken veya baglantisi kopanlar",
      tone: "from-[#fff5ef] to-[#fffbf8] text-[#8a451b]",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.label}
          className={`rounded-2xl border border-line bg-gradient-to-br p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] ${card.tone}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[11px] font-semibold tracking-[0.14em] uppercase opacity-75">
                {card.label}
              </div>
              <div className="mt-2 text-3xl font-semibold leading-none">{card.value}</div>
            </div>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/70 bg-white/70">
              <card.icon className="h-4.5 w-4.5" />
            </span>
          </div>
          <div className="mt-3 text-xs opacity-80">{card.hint}</div>
        </article>
      ))}
    </div>
  );
}

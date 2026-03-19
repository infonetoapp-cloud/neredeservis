"use client";

import type {
  CompanyActiveTripSummary,
  CompanyMemberSummary,
  CompanyRouteSummary,
  CompanyVehicleSummary,
} from "@/features/company/company-types";

export type CompanySummary = {
  activeTrips: number;
  activeVehicles: number;
  members: number;
  invitedMembers: number;
  suspendedMembers: number;
  routes: number;
};

type QueryStatus = "idle" | "loading" | "success" | "error";

type BuildCompanySummaryInput = {
  companyEnabled: boolean;
  membersStatus: QueryStatus;
  membersItems: CompanyMemberSummary[];
  vehiclesStatus: QueryStatus;
  vehiclesItems: CompanyVehicleSummary[];
  routesStatus: QueryStatus;
  routesItems: CompanyRouteSummary[];
  activeTripsStatus: QueryStatus;
  activeTripsItems: CompanyActiveTripSummary[];
};

export function buildCompanySummary({
  companyEnabled,
  membersStatus,
  membersItems,
  vehiclesStatus,
  vehiclesItems,
  routesStatus,
  routesItems,
  activeTripsStatus,
  activeTripsItems,
}: BuildCompanySummaryInput): CompanySummary | null {
  if (!companyEnabled) return null;
  if (
    membersStatus !== "success" ||
    vehiclesStatus !== "success" ||
    routesStatus !== "success" ||
    activeTripsStatus !== "success"
  ) {
    return null;
  }
  return {
    activeTrips: activeTripsItems.length,
    activeVehicles: vehiclesItems.filter((item) => item.status === "active").length,
    members: membersItems.length,
    invitedMembers: membersItems.filter((item) => item.memberStatus === "invited").length,
    suspendedMembers: membersItems.filter((item) => item.memberStatus === "suspended").length,
    routes: routesItems.length,
  };
}

export function formatLastSignal(lastLocationAt: string | null): string {
  if (!lastLocationAt) return "Sinyal yok";
  const ms = Date.parse(lastLocationAt);
  if (!Number.isFinite(ms)) return "Sinyal bilinmiyor";
  const diffSeconds = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (diffSeconds < 60) return `${diffSeconds} sn once`;
  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes} dk once`;
  const hours = Math.floor(minutes / 60);
  return `${hours} sa once`;
}

export const INDIVIDUAL_DASHBOARD_SUMMARY_ITEMS = [
  "Rota hazir",
  "Ilk duraga 12 dk",
  "Bildirim yok",
] as const;

export type CompanyQuickActionItem = {
  href: string;
  label: string;
  meta: string;
  tone: "default" | "attention" | "warning";
};

export function buildCompanyQuickActionItems(companySummary: CompanySummary | null) {
  const items: CompanyQuickActionItem[] = [
    {
      href: "/drivers",
      label: "Şoför/Uye yönetimi",
      meta: `${companySummary?.members ?? 0} uye`,
      tone: "default",
    },
    {
      href: "/vehicles",
      label: "Araç listesi",
      meta: `${companySummary?.activeVehicles ?? 0} aktif araç`,
      tone: "default",
    },
    {
      href: "/routes",
      label: "Rota planlama",
      meta: `${companySummary?.routes ?? 0} rota`,
      tone: "default",
    },
    {
      href: "/live-ops?sort=signal_desc",
      label: "Canlı operasyon merkezi",
      meta: `${companySummary?.activeTrips ?? 0} aktif sefer`,
      tone: "default",
    },
    {
      href: "/live-ops?sort=state",
      label: "Stale kontrol sirasi",
      meta: "Canlı -> stale sirali liste",
      tone: "default",
    },
  ];

  if ((companySummary?.invitedMembers ?? 0) > 0) {
    items.push({
      href: "/drivers?status=invited&sort=name_asc",
      label: "Bekleyen davetler",
      meta: `${companySummary?.invitedMembers ?? 0} davet bekliyor`,
      tone: "attention",
    });
  }

  if ((companySummary?.suspendedMembers ?? 0) > 0) {
    items.push({
      href: "/drivers?status=suspended&sort=name_asc",
      label: "Askidaki uyeler",
      meta: `${companySummary?.suspendedMembers ?? 0} uye askida`,
      tone: "warning",
    });
  }

  const priority = (tone: CompanyQuickActionItem["tone"]): number => {
    if (tone === "warning") return 0;
    if (tone === "attention") return 1;
    return 2;
  };

  return [...items].sort((left, right) => priority(left.tone) - priority(right.tone));
}


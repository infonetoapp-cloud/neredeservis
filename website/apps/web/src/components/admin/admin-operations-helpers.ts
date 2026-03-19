"use client";

import type {
  CompanyActiveTripSummary,
  CompanyMemberSummary,
  CompanyRouteSummary,
  CompanyVehicleSummary,
} from "@/features/company/company-types";

export type AdminKpiSnapshot = {
  membersTotal: number;
  membersActive: number;
  membersInvited: number;
  membersSuspended: number;
  vehiclesTotal: number;
  vehiclesActive: number;
  vehiclesMaintenance: number;
  vehiclesInactive: number;
  routesTotal: number;
  routesActive: number;
  routesArchived: number;
  activeTripsTotal: number;
  activeTripsOnline: number;
  activeTripsStale: number;
  unassignedRoutes: number;
};

export type AdminRiskSeverity = "warning" | "attention" | "info";

export type AdminRiskItem = {
  id: string;
  severity: AdminRiskSeverity;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
};

export type AdminQuickAction = {
  label: string;
  href: string;
  hint: string;
};

export type AdminAuditStatusSummary = {
  total: number;
  success: number;
  denied: number;
  error: number;
};

export function buildAdminKpiSnapshot(input: {
  members: CompanyMemberSummary[];
  vehicles: CompanyVehicleSummary[];
  routes: CompanyRouteSummary[];
  activeTrips: CompanyActiveTripSummary[];
}): AdminKpiSnapshot {
  const membersActive = input.members.filter((item) => item.memberStatus === "active").length;
  const membersInvited = input.members.filter((item) => item.memberStatus === "invited").length;
  const membersSuspended = input.members.filter((item) => item.memberStatus === "suspended").length;

  const vehiclesActive = input.vehicles.filter((item) => item.status === "active").length;
  const vehiclesMaintenance = input.vehicles.filter((item) => item.status === "maintenance").length;
  const vehiclesInactive = input.vehicles.filter((item) => item.status === "inactive").length;

  const routesArchived = input.routes.filter((item) => item.isArchived).length;
  const routesActive = input.routes.length - routesArchived;
  const unassignedRoutes = input.routes.filter((item) => {
    const hasPrimaryDriver = Boolean(item.driverId);
    const hasAuthorizedDrivers = item.authorizedDriverIds.length > 0;
    return !hasPrimaryDriver && !hasAuthorizedDrivers;
  }).length;

  const activeTripsOnline = input.activeTrips.filter((item) => item.liveState === "online").length;
  const activeTripsStale = input.activeTrips.length - activeTripsOnline;

  return {
    membersTotal: input.members.length,
    membersActive,
    membersInvited,
    membersSuspended,
    vehiclesTotal: input.vehicles.length,
    vehiclesActive,
    vehiclesMaintenance,
    vehiclesInactive,
    routesTotal: input.routes.length,
    routesActive,
    routesArchived,
    activeTripsTotal: input.activeTrips.length,
    activeTripsOnline,
    activeTripsStale,
    unassignedRoutes,
  };
}

export function buildAdminRiskItems(snapshot: AdminKpiSnapshot): AdminRiskItem[] {
  const risks: AdminRiskItem[] = [];

  if (snapshot.activeTripsStale > 0) {
    risks.push({
      id: "stale-trips",
      severity: "warning",
      title: "Stale aktif seferler var",
      description: `${snapshot.activeTripsStale} sefer son sinyalde stale gorunuyor.`,
      href: "/live-ops?hideStale=0&sort=state",
      ctaLabel: "Live Ops'ta Incele",
    });
  }

  if (snapshot.membersSuspended > 0) {
    risks.push({
      id: "suspended-members",
      severity: "warning",
      title: "Askida uyeler var",
      description: `${snapshot.membersSuspended} uye askida. Erisim ve rol durumlarini denetle.`,
      href: "/drivers?status=suspended",
      ctaLabel: "Uyeleri Gozden Gecir",
    });
  }

  if (snapshot.membersInvited > 0) {
    risks.push({
      id: "invited-members",
      severity: "attention",
      title: "Bekleyen davetler var",
      description: `${snapshot.membersInvited} davet henuz kabul edilmemis.`,
      href: "/drivers?status=invited",
      ctaLabel: "Davetleri Takip Et",
    });
  }

  if (snapshot.vehiclesMaintenance > 0) {
    risks.push({
      id: "maintenance-vehicles",
      severity: "attention",
      title: "Bakimdaki araclar var",
      description: `${snapshot.vehiclesMaintenance} araç bakim durumunda.`,
      href: "/vehicles?status=maintenance",
      ctaLabel: "Araç Durumlarini Incele",
    });
  }

  if (snapshot.unassignedRoutes > 0) {
    risks.push({
      id: "unassigned-routes",
      severity: "attention",
      title: "Atanmamis rota var",
      description: `${snapshot.unassignedRoutes} rota için sorumlu şoför tanimlanmamis.`,
      href: "/routes",
      ctaLabel: "Rota Atamalarini Duzenle",
    });
  }

  if (snapshot.routesArchived > 0) {
    risks.push({
      id: "archived-routes",
      severity: "info",
      title: "Arsivde rota kayitlari var",
      description: `${snapshot.routesArchived} rota arsivde.`,
      href: "/routes?status=archived",
      ctaLabel: "Arsiv Rotalari Ac",
    });
  }

  return risks;
}

export const ADMIN_QUICK_ACTIONS: AdminQuickAction[] = [
  {
    label: "Uyeler",
    href: "/drivers",
    hint: "Uye rollerini, davetleri ve durum degisikliklerini denetle.",
  },
  {
    label: "Rotalar",
    href: "/routes",
    hint: "Rota yetkileri, durak akisi ve operasyon kurallarini gozden gecir.",
  },
  {
    label: "Canlı Operasyon",
    href: "/live-ops",
    hint: "Canlı seferlerde stale/offline sinyallerini takip et.",
  },
  {
    label: "Denied Audit",
    href: "/admin?auditStatus=denied",
    hint: "Denied audit olaylarini hizli filtre ile ac.",
  },
  {
    label: "Hata Audit",
    href: "/admin?auditStatus=error",
    hint: "Error audit olaylarini hizli filtre ile ac.",
  },
  {
    label: "Kritik Riskler",
    href: "/admin?riskSeverity=warning",
    hint: "Warning seviyesindeki riskleri odakli filtre ile ac.",
  },
  {
    label: "Aksiyonlanabilir Audit",
    href: "/admin?auditActionable=1",
    hint: "Hedefe gecis linki olan kayitlari hizli filtre ile ac.",
  },
  {
    label: "Release Gate",
    href: "/admin",
    hint: "Staging smoke ve release gate checklistlerini gozden gecir.",
  },
  {
    label: "Araç Yönetimi",
    href: "/vehicles",
    hint: "Filo durumunu, bakim ve atama ozetlerini kontrol et.",
  },
];

export function toCompanyStatusLabel(
  status: "active" | "suspended" | "archived" | "unknown",
): string {
  if (status === "active") return "Aktif";
  if (status === "suspended") return "Askida";
  if (status === "archived") return "Arsiv";
  return "Bilinmiyor";
}

export function toBillingStatusLabel(
  status: "active" | "past_due" | "suspended_locked" | "unknown",
): string {
  if (status === "active") return "Active";
  if (status === "past_due") return "Past Due";
  if (status === "suspended_locked") return "Suspended Locked";
  return "Unknown";
}

export function riskCardToneClass(severity: AdminRiskSeverity): string {
  if (severity === "warning") {
    return "border-rose-200 bg-rose-50 hover:bg-rose-100";
  }
  if (severity === "attention") {
    return "border-amber-200 bg-amber-50 hover:bg-amber-100";
  }
  return "border-line bg-white hover:bg-slate-50";
}

export function buildAdminAuditStatusSummary(
  items: Array<{ status: string }>,
): AdminAuditStatusSummary {
  let success = 0;
  let denied = 0;
  let error = 0;

  for (const item of items) {
    if (item.status === "success") {
      success += 1;
      continue;
    }
    if (item.status === "denied") {
      denied += 1;
      continue;
    }
    error += 1;
  }

  return {
    total: items.length,
    success,
    denied,
    error,
  };
}

export function formatLoadTime(timestamp: string | null): string {
  if (!timestamp) return "Henuz yuklenmedi";
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return "Bilinmeyen zaman";
  return parsed.toLocaleString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}


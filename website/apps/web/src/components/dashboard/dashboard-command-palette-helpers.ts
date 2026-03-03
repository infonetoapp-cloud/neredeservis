"use client";

import type {
  CompanyActiveTripSummary,
  CompanyMemberSummary,
  CompanyRouteSummary,
  CompanyVehicleSummary,
} from "@/features/company/company-types";

export type CommandAction = {
  id: string;
  title: string;
  hint: string;
  path: string;
  group: "navigation" | "live_trip" | "member" | "route" | "vehicle" | "search";
};

export const COMMAND_RECENTS_KEY = "nsv:web:dashboard:command-recents";
export const COMMAND_RECENTS_LIMIT = 6;

export const QUICK_ACTIONS: readonly CommandAction[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    hint: "Ana panel shell",
    path: "/dashboard",
    group: "navigation",
  },
  {
    id: "mode-select",
    title: "Firma Sec",
    hint: "Firma secim ekrani",
    path: "/select-company",
    group: "navigation",
  },
  {
    id: "drivers",
    title: "Drivers",
    hint: "Company uye/sofor listesi",
    path: "/drivers",
    group: "navigation",
  },
  {
    id: "vehicles",
    title: "Vehicles",
    hint: "Company arac listesi",
    path: "/vehicles",
    group: "navigation",
  },
  {
    id: "routes",
    title: "Routes",
    hint: "Company rota listesi + durak editoru",
    path: "/routes",
    group: "navigation",
  },
  {
    id: "live-ops",
    title: "Live Ops",
    hint: "Aktif seferler + canli konum overlay",
    path: "/live-ops",
    group: "navigation",
  },
  {
    id: "admin",
    title: "Admin",
    hint: "Owner/admin operasyon denetim paneli",
    path: "/admin",
    group: "navigation",
  },

];

export function liveStateLabel(value: "online" | "stale") {
  return value === "online" ? "Canli" : "Stale";
}

export function commandGroupBadge(group: CommandAction["group"]) {
  if (group === "live_trip") {
    return { label: "Sefer", className: "border-blue-200 bg-blue-50 text-blue-700" };
  }
  if (group === "member") {
    return { label: "Uye", className: "border-violet-200 bg-violet-50 text-violet-700" };
  }
  if (group === "route") {
    return { label: "Rota", className: "border-cyan-200 bg-cyan-50 text-cyan-700" };
  }
  if (group === "vehicle") {
    return { label: "Arac", className: "border-emerald-200 bg-emerald-50 text-emerald-700" };
  }
  if (group === "search") {
    return { label: "Ara", className: "border-amber-200 bg-amber-50 text-amber-700" };
  }
  return null;
}

export function isTextEntryTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
}

export function statusCounter(status: "idle" | "loading" | "success" | "error", count: number) {
  if (status === "success") return String(count);
  if (status === "loading") return "...";
  if (status === "error") return "x";
  return "-";
}

export function readRecentActions(): CommandAction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(COMMAND_RECENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => typeof item?.id === "string" && typeof item?.path === "string")
      .map((item) => ({
        id: item.id as string,
        title: typeof item.title === "string" ? item.title : "Komut",
        hint: typeof item.hint === "string" ? item.hint : "",
        path: item.path as string,
        group:
          item.group === "live_trip" ||
          item.group === "member" ||
          item.group === "route" ||
          item.group === "vehicle" ||
          item.group === "search"
            ? item.group
            : "navigation",
      }))
      .slice(0, COMMAND_RECENTS_LIMIT);
  } catch {
    return [];
  }
}

export function writeRecentActions(value: CommandAction[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      COMMAND_RECENTS_KEY,
      JSON.stringify(value.slice(0, COMMAND_RECENTS_LIMIT)),
    );
  } catch {
    // noop
  }
}

export function clearRecentActionsStorage() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(COMMAND_RECENTS_KEY);
  } catch {
    // noop
  }
}

export function buildTripActions(items: CompanyActiveTripSummary[]): CommandAction[] {
  return items.slice(0, 8).map((trip) => ({
    id: `trip-${trip.tripId}`,
    title: `Sefer: ${trip.driverPlate ?? "Plaka yok"}`,
    hint: `${trip.driverName} - ${trip.routeName} (${liveStateLabel(trip.liveState)})`,
    path: `/live-ops?tripId=${encodeURIComponent(trip.tripId)}&routeId=${encodeURIComponent(
      trip.routeId,
    )}&driverUid=${encodeURIComponent(trip.driverUid)}&sort=signal_desc`,
    group: "live_trip",
  }));
}

export function buildMemberActions(items: CompanyMemberSummary[]): CommandAction[] {
  return items.slice(0, 8).map((member) => ({
    id: `member-${member.uid}`,
    title: `Uye: ${member.displayName}`,
    hint: `${member.role} - ${member.memberStatus}`,
    path: `/drivers?memberUid=${encodeURIComponent(member.uid)}&sort=name_asc`,
    group: "member",
  }));
}

export function buildRouteActions(items: CompanyRouteSummary[]): CommandAction[] {
  return items.slice(0, 8).map((route) => ({
    id: `route-${route.routeId}`,
    title: `Rota: ${route.name}`,
    hint: `${route.srvCode ?? "SRV yok"} - ${route.passengerCount} yolcu`,
    path: `/routes?routeId=${encodeURIComponent(route.routeId)}&sort=updated_desc`,
    group: "route",
  }));
}

export function buildVehicleActions(items: CompanyVehicleSummary[]): CommandAction[] {
  return items.slice(0, 8).map((vehicle) => ({
    id: `vehicle-${vehicle.vehicleId}`,
    title: `Arac: ${vehicle.plate}`,
    hint: `${vehicle.brand ?? "-"} ${vehicle.model ?? ""}`.trim() || "Arac detayi",
    path: `/vehicles?vehicleId=${encodeURIComponent(vehicle.vehicleId)}&sort=plate_asc`,
    group: "vehicle",
  }));
}

export function mergeCommandActions(
  allActions: CommandAction[],
  recentActions: CommandAction[],
): CommandAction[] {
  const recentById = new Set<string>();
  const recent = recentActions
    .map((item) => allActions.find((action) => action.id === item.id) ?? item)
    .filter((item) => {
      if (recentById.has(item.id)) return false;
      recentById.add(item.id);
      return true;
    });
  const rest = allActions.filter((action) => !recentById.has(action.id));
  return [...recent, ...rest];
}

export function buildQuerySearchActions(query: string): CommandAction[] {
  const normalized = query.trim();
  if (normalized.length < 2) return [];
  const encoded = encodeURIComponent(normalized);
  return [
    {
      id: `search-live-ops-${normalized}`,
      title: `Canli Operasyonda Ara: ${normalized}`,
      hint: "live-ops q + signal_desc",
      path: `/live-ops?q=${encoded}&sort=signal_desc`,
      group: "search",
    },
    {
      id: `search-drivers-${normalized}`,
      title: `Drivers'da Ara: ${normalized}`,
      hint: "drivers q + name_asc",
      path: `/drivers?q=${encoded}&sort=name_asc`,
      group: "search",
    },
    {
      id: `search-routes-${normalized}`,
      title: `Routes'ta Ara: ${normalized}`,
      hint: "routes q + updated_desc",
      path: `/routes?q=${encoded}&sort=updated_desc`,
      group: "search",
    },
    {
      id: `search-vehicles-${normalized}`,
      title: `Vehicles'ta Ara: ${normalized}`,
      hint: "vehicles q + plate_asc",
      path: `/vehicles?q=${encoded}&sort=plate_asc`,
      group: "search",
    },
  ];
}

export function filterCommandActions(
  mergedActions: CommandAction[],
  query: string,
  querySearchActions: CommandAction[],
): CommandAction[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return mergedActions;
  }

  const filtered = mergedActions.filter((action) =>
    `${action.title} ${action.hint}`.toLowerCase().includes(normalized),
  );
  const dedup = new Set<string>();
  return [...querySearchActions, ...filtered].filter((action) => {
    const key = `${action.id}:${action.path}`;
    if (dedup.has(key)) return false;
    dedup.add(key);
    return true;
  });
}

type SummaryArgs = {
  queryEnabled: boolean;
  tripStatus: "idle" | "loading" | "success" | "error";
  tripCount: number;
  memberStatus: "idle" | "loading" | "success" | "error";
  memberCount: number;
  routeStatus: "idle" | "loading" | "success" | "error";
  routeCount: number;
  vehicleStatus: "idle" | "loading" | "success" | "error";
  vehicleCount: number;
};

export function buildCommandPaletteSummaryText(args: SummaryArgs): string | null {
  if (!args.queryEnabled) return null;
  return `Sefer: ${statusCounter(args.tripStatus, args.tripCount)} | Uye: ${statusCounter(
    args.memberStatus,
    args.memberCount,
  )} | Rota: ${statusCounter(args.routeStatus, args.routeCount)} | Arac: ${statusCounter(
    args.vehicleStatus,
    args.vehicleCount,
  )}`;
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { DashboardCommandPaletteDialog } from "@/components/dashboard/dashboard-command-palette-dialog";
import {
  buildCommandPaletteSummaryText,
  buildMemberActions,
  buildQuerySearchActions,
  buildRouteActions,
  buildTripActions,
  buildVehicleActions,
  filterCommandActions,
  clearRecentActionsStorage,
  COMMAND_RECENTS_LIMIT,
  isTextEntryTarget,
  mergeCommandActions,
  QUICK_ACTIONS,
  readRecentActions,
  type CommandAction,
  writeRecentActions,
} from "@/components/dashboard/dashboard-command-palette-helpers";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import { useActiveCompanyPreference } from "@/features/company/use-active-company-preference";
import { useCompanyActiveTrips } from "@/features/company/use-company-active-trips";
import { useCompanyMembers } from "@/features/company/use-company-members";
import { useCompanyRoutes } from "@/features/company/use-company-routes";
import { useCompanyVehicles } from "@/features/company/use-company-vehicles";
import { useActiveCompanyMembership } from "@/features/company/use-active-company-membership";
import { isAdminSurfaceEnabled } from "@/lib/env/public-env";

export function DashboardCommandPalette() {
  const router = useRouter();
  const { status: authStatus } = useAuthSession();
  const activeCompany = useActiveCompanyPreference();
  const membership = useActiveCompanyMembership();
  const companyId = activeCompany?.companyId ?? null;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentActions, setRecentActions] = useState<CommandAction[]>(() => readRecentActions());
  const queryEnabled = open && authStatus === "signed_in" && Boolean(companyId);

  const liveTripsQuery = useCompanyActiveTrips(companyId, queryEnabled, { limit: 12 });
  const membersQuery = useCompanyMembers(companyId, queryEnabled);
  const routesQuery = useCompanyRoutes(companyId, queryEnabled);
  const vehiclesQuery = useCompanyVehicles(companyId, queryEnabled);

  const openPalette = () => {
    setOpen(true);
    setActiveIndex(0);
  };
  const closePalette = () => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  };
  const togglePalette = () => {
    setOpen((prev) => {
      const next = !prev;
      if (!next) {
        setQuery("");
        setActiveIndex(0);
      }
      return next;
    });
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
      if (isShortcut && !isTextEntryTarget(event.target)) {
        event.preventDefault();
        togglePalette();
        return;
      }

      if (event.key === "Escape") {
        closePalette();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const tripActions = useMemo<CommandAction[]>(() => {
    if (liveTripsQuery.status !== "success") {
      return [];
    }
    return buildTripActions(liveTripsQuery.items);
  }, [liveTripsQuery.items, liveTripsQuery.status]);

  const memberActions = useMemo<CommandAction[]>(() => {
    if (membersQuery.status !== "success") {
      return [];
    }
    return buildMemberActions(membersQuery.items);
  }, [membersQuery.items, membersQuery.status]);

  const routeActions = useMemo<CommandAction[]>(() => {
    if (routesQuery.status !== "success") {
      return [];
    }
    return buildRouteActions(routesQuery.items);
  }, [routesQuery.items, routesQuery.status]);

  const vehicleActions = useMemo<CommandAction[]>(() => {
    if (vehiclesQuery.status !== "success") {
      return [];
    }
    return buildVehicleActions(vehiclesQuery.items);
  }, [vehiclesQuery.items, vehiclesQuery.status]);

  const canOpenAdminAction =
    isAdminSurfaceEnabled() &&
    membership.status === "success" &&
    membership.memberStatus === "active" &&
    (membership.role === "owner" || membership.role === "admin");

  const quickActions = useMemo(
    () => QUICK_ACTIONS.filter((action) => action.id !== "admin" || canOpenAdminAction),
    [canOpenAdminAction],
  );

  const allActions = useMemo(
    () => [...quickActions, ...tripActions, ...memberActions, ...routeActions, ...vehicleActions],
    [memberActions, quickActions, routeActions, tripActions, vehicleActions],
  );

  const mergedActions = useMemo(
    () => mergeCommandActions(allActions, recentActions),
    [allActions, recentActions],
  );
  const querySearchActions = useMemo<CommandAction[]>(() => buildQuerySearchActions(query), [query]);

  const filteredActions = useMemo(
    () => filterCommandActions(mergedActions, query, querySearchActions),
    [mergedActions, query, querySearchActions],
  );
  const recentIds = useMemo(() => new Set(recentActions.map((item) => item.id)), [recentActions]);

  const effectiveActiveIndex =
    filteredActions.length === 0 ? 0 : Math.min(activeIndex, filteredActions.length - 1);

  const runAction = (action: CommandAction) => {
    setRecentActions((prev) => {
      const next = [
        action,
        ...prev.filter((item) => item.id !== action.id),
      ].slice(0, COMMAND_RECENTS_LIMIT);
      writeRecentActions(next);
      return next;
    });
    closePalette();
    router.push(action.path);
  };
  const handleClearRecents = () => {
    setRecentActions([]);
    clearRecentActionsStorage();
  };
  const handleArrowDown = () => {
    setActiveIndex((prev) =>
      filteredActions.length === 0 ? 0 : (prev + 1) % filteredActions.length,
    );
  };
  const handleArrowUp = () => {
    setActiveIndex((prev) =>
      filteredActions.length === 0 ? 0 : (prev - 1 + filteredActions.length) % filteredActions.length,
    );
  };
  const handleSubmitActiveAction = () => {
    const action = filteredActions[effectiveActiveIndex];
    if (action) {
      runAction(action);
    }
  };
  const summaryText = buildCommandPaletteSummaryText({
    queryEnabled,
    tripStatus: liveTripsQuery.status,
    tripCount: tripActions.length,
    memberStatus: membersQuery.status,
    memberCount: memberActions.length,
    routeStatus: routesQuery.status,
    routeCount: routeActions.length,
    vehicleStatus: vehiclesQuery.status,
    vehicleCount: vehicleActions.length,
  });

  return (
    <>
      <button
        type="button"
        onClick={openPalette}
        className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span>Komutlar</span>
        <span className="hidden rounded-md border border-line bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-muted sm:inline-flex">
          Ctrl/Cmd + K
        </span>
      </button>

      {open ? (
        <DashboardCommandPaletteDialog
          query={query}
          filteredActions={filteredActions}
          effectiveActiveIndex={effectiveActiveIndex}
          recentIds={recentIds}
          summaryText={summaryText}
          hasRecentActions={recentActions.length > 0}
          onQueryChange={setQuery}
          onArrowDown={handleArrowDown}
          onArrowUp={handleArrowUp}
          onSubmitActiveAction={handleSubmitActiveAction}
          onClose={closePalette}
          onHoverIndex={setActiveIndex}
          onRunAction={runAction}
          onClearRecents={handleClearRecents}
        />
      ) : null}
    </>
  );
}

"use client";

import type { CompanyAuditLogSummary } from "@/features/company/company-audit-callables";

export type AuditSortMode = "newest" | "oldest" | "status_priority";

const AUDIT_SORT_LABELS: Record<AuditSortMode, string> = {
  newest: "Yeniden Eskiye",
  oldest: "Eskiden Yeniye",
  status_priority: "Hata Once",
};

const AUDIT_EVENT_LABELS: Record<string, string> = {
  company_created: "Şirket olusturuldu",
  company_member_invited: "Uye daveti gonderildi",
  company_member_invite_accepted: "Uye daveti kabul edildi",
  company_member_invite_declined: "Uye daveti reddedildi",
  company_member_updated: "Uye rol/durum guncellendi",
  company_member_removed: "Uye sirketten cikarildi",
  route_updated: "Rota guncellendi",
  company_route_updated: "Rota guncellendi",
  route_stop_upserted: "Durak eklendi/guncellendi",
  route_stop_deleted: "Durak silindi",
  route_stops_reordered: "Durak sirasi guncellendi",
  vehicle_created: "Araç olusturuldu",
  vehicle_updated: "Araç guncellendi",
  company_vehicle_updated: "Araç guncellendi",
  route_driver_permissions_granted: "Rota yetkisi verildi",
  route_driver_permissions_revoked: "Rota yetkisi kaldirildi",
  route_share_link_generated: "Rota paylasim linki olusturuldu",
  route_preview_accessed: "Rota onizleme acildi",
  route_preview_denied: "Rota onizleme engellendi",
  route_joined_by_srv: "Yolcu rota koduyla katildi",
  route_join_owner_bypass_dev: "Gelistirme bypass ile katilim",
  user_delete_requested: "Hesap silme talebi olusturuldu",
  user_delete_dry_run: "Hesap silme dry-run tamamlandi",
  user_delete_blocked_subscription: "Hesap silme abonelik nedeniyle engellendi",
  user_delete_completed: "Hesap silme tamamlandi",
};

const AUDIT_TARGET_LABELS: Record<string, string> = {
  company: "Firma",
  company_member: "Uye",
  user: "Kullanici",
  member: "Uye",
  route: "Rota",
  vehicle: "Araç",
  trip: "Sefer",
  route_driver_permission: "Rota Yetkisi",
};

const AUDIT_STATUS_LABELS: Record<string, string> = {
  success: "Basarili",
  denied: "Denied",
  error: "Hata",
};

function escapeCsvCell(value: string): string {
  const escaped = value.replaceAll('"', '""');
  return `"${escaped}"`;
}

export function buildAuditCsv(items: CompanyAuditLogSummary[]): string {
  const header = [
    "createdAt",
    "status",
    "eventType",
    "eventLabel",
    "targetType",
    "targetId",
    "actorUid",
    "reason",
  ];

  const rows = items.map((item) =>
    [
      item.createdAt ?? "",
      item.status ?? "",
      item.eventType ?? "",
      toAuditEventLabel(item.eventType ?? ""),
      item.targetType ?? "",
      item.targetId ?? "",
      item.actorUid ?? "",
      item.reason ?? "",
    ]
      .map((cell) => escapeCsvCell(cell))
      .join(","),
  );

  return [header.join(","), ...rows].join("\n");
}

export function buildAuditCsvFilename(now: Date = new Date()): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `admin-audit-${yyyy}${mm}${dd}-${hh}${min}.csv`;
}

export function buildAuditSummaryText(input: {
  filterSummaryLabel: string;
  filteredRangeLabel: string;
  total: number;
  success: number;
  denied: number;
  error: number;
  topItem: CompanyAuditLogSummary | null;
}): string {
  const lines = [
    "Admin Audit Ozeti",
    `Filtre: ${input.filterSummaryLabel}`,
    `Gorunen Kayıt: ${input.total}`,
    `Toplam/Basarili/Denied/Hata: ${input.total}/${input.success}/${input.denied}/${input.error}`,
    `Aralik: ${input.filteredRangeLabel}`,
  ];

  if (input.topItem) {
    lines.push(
      `Son Olay: ${toAuditEventLabel(input.topItem.eventType)} | status=${input.topItem.status} | actor=${input.topItem.actorUid ?? "-"}`,
    );
  }

  return lines.join("\n");
}

export function buildAuditFilterUrl(input: {
  pathname: string;
  origin: string;
  filter: "all" | "success" | "denied" | "error";
  eventFilter: string;
  targetFilter: string;
  searchQuery: string;
  sort: AuditSortMode;
  actionableOnly: boolean;
}): string {
  const params = new URLSearchParams();
  if (input.filter !== "all") {
    params.set("auditStatus", input.filter);
  }
  if (input.eventFilter !== "all") {
    params.set("auditEvent", input.eventFilter);
  }
  if (input.targetFilter !== "all") {
    params.set("auditTarget", input.targetFilter);
  }
  if (input.searchQuery.trim().length > 0) {
    params.set("auditQ", input.searchQuery.trim());
  }
  if (input.sort !== "newest") {
    params.set("auditSort", input.sort);
  }
  if (input.actionableOnly) {
    params.set("auditActionable", "1");
  }

  const path = input.pathname || "/admin";
  const nextUrl = params.toString().length > 0 ? `${path}?${params.toString()}` : path;
  return `${input.origin}${nextUrl}`;
}

export function toAuditSortLabel(mode: AuditSortMode): string {
  return AUDIT_SORT_LABELS[mode] ?? mode;
}

export function downloadAuditCsv(items: CompanyAuditLogSummary[]): boolean {
  if (items.length === 0) {
    return false;
  }

  const csv = buildAuditCsv(items);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const objectUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  downloadLink.href = objectUrl;
  downloadLink.download = buildAuditCsvFilename();
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(objectUrl);

  return true;
}

export function toAuditEventLabel(eventType: string): string {
  const mapped = AUDIT_EVENT_LABELS[eventType];
  if (mapped) {
    return mapped;
  }
  return eventType.replaceAll("_", " ");
}

export function toAuditTargetLabel(targetType: string | null): string {
  if (!targetType) {
    return "Hedef";
  }
  return AUDIT_TARGET_LABELS[targetType] ?? targetType.replaceAll("_", " ");
}

export function toAuditStatusLabel(status: string): string {
  return AUDIT_STATUS_LABELS[status] ?? status;
}

export function buildAuditTargetHref(targetType: string | null, targetId: string | null): string | null {
  if (!targetType || !targetId) {
    return null;
  }
  if (targetType === "company") {
    return "/dashboard";
  }
  if (targetType === "member" || targetType === "company_member" || targetType === "user") {
    return `/drivers?memberUid=${encodeURIComponent(targetId)}`;
  }
  if (targetType === "route") {
    return `/routes?routeId=${encodeURIComponent(targetId)}`;
  }
  if (targetType === "route_driver_permission") {
    const splitIndex = targetId.lastIndexOf("_");
    if (splitIndex <= 0 || splitIndex >= targetId.length - 1) {
      return "/routes";
    }
    const routeId = targetId.slice(0, splitIndex);
    const memberUid = targetId.slice(splitIndex + 1);
    return `/routes?routeId=${encodeURIComponent(routeId)}&memberUid=${encodeURIComponent(memberUid)}`;
  }
  if (targetType === "vehicle") {
    return `/vehicles?vehicleId=${encodeURIComponent(targetId)}`;
  }
  if (targetType === "trip") {
    return `/live-ops?tripId=${encodeURIComponent(targetId)}`;
  }
  return null;
}

export function isAuditActionable(targetType: string | null, targetId: string | null): boolean {
  return Boolean(buildAuditTargetHref(targetType, targetId));
}

export function sortAuditItems(items: CompanyAuditLogSummary[], mode: AuditSortMode) {
  const nextItems = [...items];
  if (mode === "oldest") {
    nextItems.sort((left, right) => {
      const leftTime = left.createdAt ? Date.parse(left.createdAt) : 0;
      const rightTime = right.createdAt ? Date.parse(right.createdAt) : 0;
      return leftTime - rightTime;
    });
    return nextItems;
  }

  if (mode === "status_priority") {
    const rank = { error: 0, denied: 1, success: 2, unknown: 3 } as const;
    nextItems.sort((left, right) => {
      const leftRank = rank[left.status as keyof typeof rank] ?? rank.unknown;
      const rightRank = rank[right.status as keyof typeof rank] ?? rank.unknown;
      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }
      const leftTime = left.createdAt ? Date.parse(left.createdAt) : 0;
      const rightTime = right.createdAt ? Date.parse(right.createdAt) : 0;
      return rightTime - leftTime;
    });
    return nextItems;
  }

  nextItems.sort((left, right) => {
    const leftTime = left.createdAt ? Date.parse(left.createdAt) : 0;
    const rightTime = right.createdAt ? Date.parse(right.createdAt) : 0;
    return rightTime - leftTime;
  });
  return nextItems;
}


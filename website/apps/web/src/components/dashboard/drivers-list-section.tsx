"use client";

import { Users } from "lucide-react";
import type { CompanyMemberSummary } from "@/features/company/company-types";
import {
  memberStatusLabel,
  roleLabel,
  type DriverRoleFilter,
  type DriverSortOption,
  type DriverStatusFilter,
} from "@/components/dashboard/drivers-company-members-helpers";

const AVATAR_BG: Record<string, string> = {
  owner: "bg-violet-500",
  admin: "bg-blue-500",
  dispatcher: "bg-cyan-500",
  viewer: "bg-slate-400",
};

type DriversListSectionProps = {
  activeCompanyName: string | null;
  memberUidFromQuery: string | null;
  visibleMembers: CompanyMemberSummary[];
  filteredMembersCount: number;
  totalMembersCount: number;
  memberStatusSummary: {
    active: number;
    invited: number;
    suspended: number;
  };
  memberRoleSummary: {
    owner: number;
    admin: number;
    dispatcher: number;
    viewer: number;
  };
  density: "comfortable" | "compact";
  searchText: string;
  roleFilter: DriverRoleFilter;
  statusFilter: DriverStatusFilter;
  sortOption: DriverSortOption;
  currentPage: number;
  totalPages: number;
  selectedMemberUid: string | null;
  onSearchTextChange: (value: string) => void;
  onRoleFilterChange: (value: DriverRoleFilter) => void;
  onStatusFilterChange: (value: DriverStatusFilter) => void;
  onSortOptionChange: (value: DriverSortOption) => void;
  onResetFilters: () => void;
  onPageChange: (nextPage: number) => void;
  onSelectMemberUid: (memberUid: string) => void;
};

export function DriversListSection({
  activeCompanyName,
  memberUidFromQuery,
  visibleMembers,
  filteredMembersCount,
  totalMembersCount,
  memberStatusSummary,
  memberRoleSummary,
  density,
  searchText,
  roleFilter,
  statusFilter,
  sortOption,
  currentPage,
  totalPages,
  selectedMemberUid,
  onSearchTextChange,
  onRoleFilterChange,
  onStatusFilterChange,
  onSortOptionChange,
  onResetFilters,
  onPageChange,
  onSelectMemberUid,
}: DriversListSectionProps) {
  const filtersDirty =
    searchText.trim().length > 0 ||
    roleFilter !== "all" ||
    statusFilter !== "all" ||
    sortOption !== "name_asc";

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      {/* ── Header ── */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-900">Şoförler</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            {filteredMembersCount}
          </span>
        </div>
        {/* Status pills — compact */}
        <div className="flex items-center gap-1">
          {(["active", "invited", "suspended"] as const).map((s) => {
            const count = memberStatusSummary[s];
            const labels: Record<string, string> = { active: "Aktif", invited: "Davet", suspended: "Askıda" };
            const active = statusFilter === s;
            const tone: Record<string, string> = {
              active: active ? "bg-emerald-500 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
              invited: active ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100",
              suspended: active ? "bg-rose-500 text-white" : "bg-rose-50 text-rose-700 hover:bg-rose-100",
            };
            return (
              <button key={s} type="button" onClick={() => onStatusFilterChange(active ? "all" : s)}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${tone[s]}`}>
                {labels[s]} {count}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={searchText}
          onChange={(event) => onSearchTextChange(event.target.value)}
          aria-label="Üye arama"
          placeholder="İsim, e-posta, telefon ara..."
          className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-300"
        />
        <select
          value={roleFilter}
          onChange={(event) => onRoleFilterChange(event.target.value as DriverRoleFilter)}
          aria-label="Rol filtresi"
          className="rounded-lg border border-line bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-300"
        >
          <option value="all">Tüm Roller</option>
          <option value="owner">Sahip</option>
          <option value="admin">Yönetici</option>
          <option value="dispatcher">Dispeçer</option>
          <option value="viewer">Gözlemci</option>
        </select>
        <select
          value={sortOption}
          onChange={(event) => onSortOptionChange(event.target.value as DriverSortOption)}
          aria-label="Sıralama"
          className="rounded-lg border border-line bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-300"
        >
          <option value="name_asc">İsim (A-Z)</option>
          <option value="name_desc">İsim (Z-A)</option>
          <option value="role">Role göre</option>
          <option value="status">Duruma göre</option>
        </select>
        {filtersDirty && (
          <button type="button" onClick={onResetFilters}
            className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            Temizle
          </button>
        )}
      </div>

      {/* ── Card grid ── */}
      {visibleMembers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-white px-4 py-6 text-center text-xs text-muted">
          Kriterlere uyan üye bulunamadı.
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {visibleMembers.map((item) => {
            const isSelected = item.uid === selectedMemberUid;
            const initials = (item.displayName ?? "?").charAt(0).toUpperCase();
            const avatarBg = AVATAR_BG[item.role] ?? "bg-slate-400";
            const STATUS_DOT: Record<string, string> = {
              active: "bg-emerald-500",
              invited: "bg-amber-400",
              suspended: "bg-rose-500",
            };
            const statusDot = STATUS_DOT[item.memberStatus] ?? "bg-slate-400";
            return (
              <button
                key={item.uid}
                type="button"
                onClick={() => onSelectMemberUid(item.uid)}
                aria-label={`${item.displayName} üyeyi seç`}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                  isSelected
                    ? "border-blue-200 bg-blue-50/60 ring-1 ring-blue-100"
                    : "border-line bg-white hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarBg}`}>
                  {initials}
                  <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${statusDot}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold text-slate-900">{item.displayName}</div>
                  <div className="mt-0.5 truncate text-[11px] text-slate-500">
                    {roleLabel(item.role)} {item.email ? `· ${item.email}` : item.phone ? `· ${item.phone}` : ""}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
      {totalPages > 1 ? (
        <div className="mt-3 flex items-center justify-end gap-2">
          <button type="button" onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
            ← Önceki
          </button>
          <span className="text-xs text-muted">{currentPage} / {totalPages}</span>
          <button type="button" onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
            Sonraki →
          </button>
        </div>
      ) : null}
    </section>
  );
}

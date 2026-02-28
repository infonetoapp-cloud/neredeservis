"use client";

import type { CompanyMemberSummary } from "@/features/company/company-types";
import {
  memberStatusLabel,
  roleLabel,
  type DriverRoleFilter,
  type DriverSortOption,
  type DriverStatusFilter,
} from "@/components/dashboard/drivers-company-members-helpers";

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
  const rowClass = density === "compact" ? "px-3 py-2" : "px-3 py-3";
  const filtersDirty =
    searchText.trim().length > 0 ||
    roleFilter !== "all" ||
    statusFilter !== "all" ||
    sortOption !== "name_asc";

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">Company Members (Gercek Veri)</div>
          <div className="text-xs text-muted">
            Aktif company: {activeCompanyName ?? "-"}
            {memberUidFromQuery ? " - Deep-link secim aktif" : ""}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => onStatusFilterChange("active")}
              aria-pressed={statusFilter === "active"}
              className={`rounded-full border px-2 py-0.5 font-semibold ${
                statusFilter === "active"
                  ? "border-emerald-300 bg-emerald-100 text-emerald-900"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              }`}
            >
              Aktif {memberStatusSummary.active}
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange("invited")}
              aria-pressed={statusFilter === "invited"}
              className={`rounded-full border px-2 py-0.5 font-semibold ${
                statusFilter === "invited"
                  ? "border-amber-300 bg-amber-100 text-amber-900"
                  : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
              }`}
            >
              Davet {memberStatusSummary.invited}
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange("suspended")}
              aria-pressed={statusFilter === "suspended"}
              className={`rounded-full border px-2 py-0.5 font-semibold ${
                statusFilter === "suspended"
                  ? "border-rose-300 bg-rose-100 text-rose-900"
                  : "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100"
              }`}
            >
              Askida {memberStatusSummary.suspended}
            </button>
            {statusFilter !== "all" ? (
              <button
                type="button"
                onClick={() => onStatusFilterChange("all")}
                aria-pressed={false}
                className="rounded-full border border-line bg-white px-2 py-0.5 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Tum Durumlar
              </button>
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => onRoleFilterChange("owner")}
              aria-pressed={roleFilter === "owner"}
              className={`rounded-full border px-2 py-0.5 font-semibold ${
                roleFilter === "owner"
                  ? "border-violet-300 bg-violet-100 text-violet-900"
                  : "border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100"
              }`}
            >
              Owner {memberRoleSummary.owner}
            </button>
            <button
              type="button"
              onClick={() => onRoleFilterChange("admin")}
              aria-pressed={roleFilter === "admin"}
              className={`rounded-full border px-2 py-0.5 font-semibold ${
                roleFilter === "admin"
                  ? "border-blue-300 bg-blue-100 text-blue-900"
                  : "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100"
              }`}
            >
              Admin {memberRoleSummary.admin}
            </button>
            <button
              type="button"
              onClick={() => onRoleFilterChange("dispatcher")}
              aria-pressed={roleFilter === "dispatcher"}
              className={`rounded-full border px-2 py-0.5 font-semibold ${
                roleFilter === "dispatcher"
                  ? "border-cyan-300 bg-cyan-100 text-cyan-900"
                  : "border-cyan-200 bg-cyan-50 text-cyan-800 hover:bg-cyan-100"
              }`}
            >
              Dispatcher {memberRoleSummary.dispatcher}
            </button>
            <button
              type="button"
              onClick={() => onRoleFilterChange("viewer")}
              aria-pressed={roleFilter === "viewer"}
              className={`rounded-full border px-2 py-0.5 font-semibold ${
                roleFilter === "viewer"
                  ? "border-slate-400 bg-slate-200 text-slate-900"
                  : "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100"
              }`}
            >
              Viewer {memberRoleSummary.viewer}
            </button>
            {roleFilter !== "all" ? (
              <button
                type="button"
                onClick={() => onRoleFilterChange("all")}
                aria-pressed={false}
                className="rounded-full border border-line bg-white px-2 py-0.5 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Tum Roller
              </button>
            ) : null}
          </div>
        </div>
        <div className="rounded-xl border border-dashed border-line bg-white px-3 py-2 text-xs text-muted">
          {filteredMembersCount} / {totalMembersCount} uye | Sayfa {currentPage}/{totalPages} |{" "}
          {density}
        </div>
      </div>

      <div className="mb-3 grid gap-2 md:grid-cols-5">
        <input
          value={searchText}
          onChange={(event) => onSearchTextChange(event.target.value)}
          aria-label="Uye arama"
          placeholder="Uye, e-posta, telefon ara..."
          className="rounded-lg border border-line bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-300"
        />
        <select
          value={roleFilter}
          onChange={(event) => onRoleFilterChange(event.target.value as DriverRoleFilter)}
          aria-label="Rol filtresi"
          className="rounded-lg border border-line bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-300"
        >
          <option value="all">Tum roller</option>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
          <option value="dispatcher">Dispatcher</option>
          <option value="viewer">Viewer</option>
        </select>
        <select
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value as DriverStatusFilter)}
          aria-label="Durum filtresi"
          className="rounded-lg border border-line bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-300"
        >
          <option value="all">Tum durumlar</option>
          <option value="active">Active</option>
          <option value="invited">Invited</option>
          <option value="suspended">Suspended</option>
        </select>
        <select
          value={sortOption}
          onChange={(event) => onSortOptionChange(event.target.value as DriverSortOption)}
          aria-label="Siralama"
          className="rounded-lg border border-line bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-300"
        >
          <option value="name_asc">Isim (A-Z)</option>
          <option value="name_desc">Isim (Z-A)</option>
          <option value="role">Role gore</option>
          <option value="status">Duruma gore</option>
        </select>
        <button
          type="button"
          onClick={onResetFilters}
          disabled={!filtersDirty}
          title={!filtersDirty ? "Temizlenecek aktif filtre yok." : undefined}
          className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Filtreyi Temizle
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-line">
        <div className="grid grid-cols-12 gap-2 border-b border-line bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
          <div className="col-span-4 truncate">Uye</div>
          <div className="col-span-3 truncate">Rol / Durum</div>
          <div className="col-span-3 truncate">Iletisim</div>
          <div className="col-span-2 truncate text-right">Aksiyon</div>
        </div>
        <div className="divide-y divide-line bg-white">
          {visibleMembers.length === 0 ? (
            <div className="px-3 py-4 text-xs text-muted">Filtrelere uygun uye bulunamadi.</div>
          ) : (
            visibleMembers.map((item) => {
              const isSelected = item.uid === selectedMemberUid;
              return (
                <button
                  key={item.uid}
                  type="button"
                  onClick={() => onSelectMemberUid(item.uid)}
                  aria-label={`${item.displayName} uyeyi sec`}
                  className={`grid w-full grid-cols-12 gap-2 text-left text-sm transition ${rowClass} ${
                    isSelected
                      ? "bg-blue-50/70 ring-1 ring-inset ring-blue-100"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="col-span-4 min-w-0">
                    <div className="truncate font-medium text-slate-900">{item.displayName}</div>
                    <div className="truncate text-[11px] text-muted">{item.uid}</div>
                  </div>
                  <div className="col-span-3 truncate text-slate-800">
                    {roleLabel(item.role)} / {memberStatusLabel(item.memberStatus)}
                  </div>
                  <div className="col-span-3 truncate text-slate-800">
                    {item.email ?? item.phone ?? "-"}
                  </div>
                  <div className="col-span-2 text-right text-xs font-semibold text-slate-600">
                    {isSelected ? "Secili" : "Detay"}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
      {totalPages > 1 ? (
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Onceki
          </button>
          <span className="text-xs text-muted">
            Sayfa {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sonraki
          </button>
        </div>
      ) : null}
    </section>
  );
}

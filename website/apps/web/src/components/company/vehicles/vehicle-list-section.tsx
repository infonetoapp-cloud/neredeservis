"use client";

import type { Dispatch, SetStateAction } from "react";

import type { CompanyVehicleItem } from "@/features/company/company-client";

import type { VehicleDraft } from "./vehicle-ui-helpers";
import { normalizePlateInput } from "./vehicle-ui-helpers";

type Props = {
  vehicles: CompanyVehicleItem[] | null;
  sortedVehicles: CompanyVehicleItem[];
  filteredVehicles: CompanyVehicleItem[];
  vehicleSearchQuery: string;
  vehicleStatusFilter: "all" | "active" | "inactive";
  canMutate: boolean;
  drafts: Record<string, VehicleDraft>;
  setDrafts: Dispatch<SetStateAction<Record<string, VehicleDraft>>>;
  savingVehicleId: string | null;
  errorMessage: string | null;
  onSetVehicleSearchQuery: (value: string) => void;
  onSetVehicleStatusFilter: (value: "all" | "active" | "inactive") => void;
  onRefresh: () => void;
  onSaveVehicle: (vehicleId: string) => void;
};

function readVehicleDraft(
  vehicle: CompanyVehicleItem,
  drafts: Record<string, VehicleDraft>,
): VehicleDraft {
  return (
    drafts[vehicle.vehicleId] ?? {
      plate: vehicle.plate,
      label: vehicle.label ?? "",
      capacity: vehicle.capacity != null ? String(vehicle.capacity) : "",
      isActive: vehicle.isActive,
    }
  );
}

export function VehicleListSection({
  vehicles,
  sortedVehicles,
  filteredVehicles,
  vehicleSearchQuery,
  vehicleStatusFilter,
  canMutate,
  drafts,
  setDrafts,
  savingVehicleId,
  errorMessage,
  onSetVehicleSearchQuery,
  onSetVehicleStatusFilter,
  onRefresh,
  onSaveVehicle,
}: Props) {
  return (
    <section className="glass-panel rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-slate-900">Arac listesi</div>
        <button
          type="button"
          onClick={onRefresh}
          className="glass-button rounded-xl px-3 py-1.5 text-xs font-semibold"
        >
          Yenile
        </button>
      </div>

      <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_180px_auto]">
        <input
          type="search"
          value={vehicleSearchQuery}
          onChange={(event) => onSetVehicleSearchQuery(event.target.value)}
          placeholder="Plaka, etiket veya arac ID ile ara"
          className="glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-900"
        />
        <select
          value={vehicleStatusFilter}
          onChange={(event) =>
            onSetVehicleStatusFilter(event.target.value as "all" | "active" | "inactive")
          }
          className="glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-900"
        >
          <option value="all">Tum durumlar</option>
          <option value="active">Sadece aktif</option>
          <option value="inactive">Sadece pasif</option>
        </select>
        <div className="glass-chip inline-flex items-center rounded-xl px-3 py-2 text-xs font-semibold text-slate-700">
          {filteredVehicles.length}/{sortedVehicles.length} gorunuyor
        </div>
      </div>

      {errorMessage ? (
        <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          {errorMessage}
        </div>
      ) : null}

      {!vehicles ? (
        <div className="rounded-xl border border-dashed border-line bg-slate-50 p-3 text-xs text-muted">
          Araclar yukleniyor...
        </div>
      ) : sortedVehicles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-slate-50 p-3 text-xs text-muted">
          Bu sirkete kayitli arac bulunmuyor.
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-slate-50 p-3 text-xs text-muted">
          Filtreye uygun arac bulunamadi.
        </div>
      ) : (
        <div className="space-y-2">
          {filteredVehicles.map((vehicle) => {
            const draft = readVehicleDraft(vehicle, drafts);

            return (
              <article
                key={vehicle.vehicleId}
                className={`grid gap-2 rounded-xl border border-line p-3 ${
                  canMutate
                    ? "md:grid-cols-[170px_1fr_130px_120px_130px]"
                    : "md:grid-cols-[170px_1fr_130px_120px]"
                }`}
              >
                {canMutate ? (
                  <>
                    <input
                      type="text"
                      value={draft.plate}
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [vehicle.vehicleId]: {
                            ...readVehicleDraft(vehicle, prev),
                            plate: normalizePlateInput(event.target.value),
                          },
                        }))
                      }
                      className="glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-900"
                    />
                    <input
                      type="text"
                      value={draft.label}
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [vehicle.vehicleId]: {
                            ...readVehicleDraft(vehicle, prev),
                            label: event.target.value,
                          },
                        }))
                      }
                      className="glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-900"
                    />
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={draft.capacity}
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [vehicle.vehicleId]: {
                            ...readVehicleDraft(vehicle, prev),
                            capacity: event.target.value,
                          },
                        }))
                      }
                      className="glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-900"
                    />
                    <label className="glass-input inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-900">
                      <input
                        type="checkbox"
                        checked={draft.isActive}
                        onChange={(event) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [vehicle.vehicleId]: {
                              ...readVehicleDraft(vehicle, prev),
                              isActive: event.target.checked,
                            },
                          }))
                        }
                      />
                      aktif
                    </label>
                    <button
                      type="button"
                      onClick={() => onSaveVehicle(vehicle.vehicleId)}
                      disabled={savingVehicleId === vehicle.vehicleId}
                      className="glass-button inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingVehicleId === vehicle.vehicleId ? "Kaydediliyor..." : "Kaydet"}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="glass-input rounded-xl px-3 py-2 text-sm font-semibold text-slate-900">
                      {vehicle.plate}
                    </div>
                    <div className="glass-input rounded-xl px-3 py-2 text-sm text-slate-900">
                      {vehicle.label ?? "-"}
                    </div>
                    <div className="glass-input rounded-xl px-3 py-2 text-sm text-slate-700">
                      kapasite: {vehicle.capacity ?? "-"}
                    </div>
                    <div
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                        vehicle.isActive
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      {vehicle.isActive ? "aktif" : "pasif"}
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

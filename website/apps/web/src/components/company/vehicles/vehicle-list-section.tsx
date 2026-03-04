"use client";

import type { Dispatch, SetStateAction } from "react";

import type { CompanyVehicleItem } from "@/features/company/company-client";
import type { VehicleStatus } from "@/features/company/company-client-shared";

import type { VehicleDraft } from "./vehicle-ui-helpers";
import { normalizePlateInput, vehicleDraftFromItem, VEHICLE_STATUS_OPTIONS } from "./vehicle-ui-helpers";

type Props = {
  vehicles: CompanyVehicleItem[] | null;
  sortedVehicles: CompanyVehicleItem[];
  filteredVehicles: CompanyVehicleItem[];
  vehicleSearchQuery: string;
  vehicleStatusFilter: "all" | VehicleStatus;
  canMutate: boolean;
  drafts: Record<string, VehicleDraft>;
  setDrafts: Dispatch<SetStateAction<Record<string, VehicleDraft>>>;
  savingVehicleId: string | null;
  errorMessage: string | null;
  onSetVehicleSearchQuery: (value: string) => void;
  onSetVehicleStatusFilter: (value: "all" | VehicleStatus) => void;
  onRefresh: () => void;
  onSaveVehicle: (vehicleId: string) => void;
};

function readDraft(
  vehicle: CompanyVehicleItem,
  drafts: Record<string, VehicleDraft>,
): VehicleDraft {
  return drafts[vehicle.vehicleId] ?? vehicleDraftFromItem(vehicle);
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
    <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-slate-900">Araç listesi</div>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
        >
          Yenile
        </button>
      </div>

      <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_180px_auto]">
        <input
          type="search"
          value={vehicleSearchQuery}
          onChange={(event) => onSetVehicleSearchQuery(event.target.value)}
          placeholder="Plaka, marka veya model ara..."
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <select
          value={vehicleStatusFilter}
          onChange={(event) =>
            onSetVehicleStatusFilter(event.target.value as "all" | VehicleStatus)
          }
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="all">Tüm durumlar</option>
          <option value="active">Aktif</option>
          <option value="maintenance">Bakımda</option>
          <option value="inactive">Pasif</option>
        </select>
        <div className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
          {filteredVehicles.length}/{sortedVehicles.length}
        </div>
      </div>

      {errorMessage ? (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
          {errorMessage}
        </div>
      ) : null}

      {!vehicles ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-400">
          Araçlar yükleniyor...
        </div>
      ) : sortedVehicles.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-400">
          Bu şirkete kayıtlı araç bulunmuyor.
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-400">
          Filtreye uygun araç bulunamadı.
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredVehicles.map((vehicle) => {
            const draft = readDraft(vehicle, drafts);
            const statusOpt = VEHICLE_STATUS_OPTIONS.find((o) => o.value === vehicle.status);
            const statusBadge = {
              active: "border-emerald-200 bg-emerald-50 text-emerald-700",
              maintenance: "border-amber-200 bg-amber-50 text-amber-700",
              inactive: "border-slate-200 bg-slate-100 text-slate-600",
            }[vehicle.status] ?? "border-slate-200 bg-slate-100 text-slate-600";

            return (
              <article
                key={vehicle.vehicleId}
                className="rounded-lg border border-slate-100 bg-white p-3"
              >
                {canMutate ? (
                  <div className="space-y-2">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        type="text"
                        value={draft.plate}
                        onChange={(event) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [vehicle.vehicleId]: {
                              ...readDraft(vehicle, prev),
                              plate: normalizePlateInput(event.target.value),
                            },
                          }))
                        }
                        placeholder="Plaka"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                      <input
                        type="text"
                        value={draft.brand}
                        onChange={(event) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [vehicle.vehicleId]: {
                              ...readDraft(vehicle, prev),
                              brand: event.target.value,
                            },
                          }))
                        }
                        placeholder="Marka"
                        maxLength={80}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                      <input
                        type="text"
                        value={draft.model}
                        onChange={(event) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [vehicle.vehicleId]: {
                              ...readDraft(vehicle, prev),
                              model: event.target.value,
                            },
                          }))
                        }
                        placeholder="Model"
                        maxLength={80}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          min={1900}
                          max={2100}
                          value={draft.year}
                          onChange={(event) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [vehicle.vehicleId]: {
                                ...readDraft(vehicle, prev),
                                year: event.target.value,
                              },
                            }))
                          }
                          placeholder="Yıl"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                        <input
                          type="number"
                          min={1}
                          max={200}
                          value={draft.capacity}
                          onChange={(event) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [vehicle.vehicleId]: {
                                ...readDraft(vehicle, prev),
                                capacity: event.target.value,
                              },
                            }))
                          }
                          placeholder="Kapasite"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                        {VEHICLE_STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() =>
                              setDrafts((prev) => ({
                                ...prev,
                                [vehicle.vehicleId]: {
                                  ...readDraft(vehicle, prev),
                                  status: opt.value,
                                },
                              }))
                            }
                            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                              draft.status === opt.value
                                ? opt.value === "active"
                                  ? "bg-emerald-500 text-white shadow-sm"
                                  : opt.value === "maintenance"
                                    ? "bg-amber-500 text-white shadow-sm"
                                    : "bg-slate-500 text-white shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => onSaveVehicle(vehicle.vehicleId)}
                        disabled={savingVehicleId === vehicle.vehicleId}
                        className="ml-auto inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingVehicleId === vehicle.vehicleId ? "Kaydediliyor..." : "Kaydet"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-sm font-semibold text-slate-900">{vehicle.plate}</span>
                      {vehicle.label && (
                        <span className="ml-2 text-xs text-slate-500">{vehicle.label}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      {vehicle.year && <span>{vehicle.year}</span>}
                      {vehicle.capacity != null && <span>{vehicle.capacity} kişi</span>}
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusBadge}`}>
                        {statusOpt?.label ?? "—"}
                      </span>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

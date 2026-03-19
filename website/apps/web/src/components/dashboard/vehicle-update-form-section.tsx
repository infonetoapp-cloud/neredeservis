"use client";

import type { FormEvent } from "react";

import type { CompanyVehicleSummary, VehicleStatus } from "@/features/company/company-types";
import {
  normalizeOptionalVehicleIntegerInput,
  normalizeVehiclePlateInput,
} from "@/components/dashboard/vehicle-form-validation";
import { normalizeTextInput } from "@/components/dashboard/input-normalization";

export type VehicleFormState = {
  plate: string;
  brand: string;
  model: string;
  year: string;
  capacity: string;
  status: VehicleStatus;
};

type Props = {
  selectedVehicle: CompanyVehicleSummary;
  vehicles: readonly CompanyVehicleSummary[];
  form: VehicleFormState;
  plateLooksValid: boolean;
  yearLooksValid: boolean;
  capacityLooksValid: boolean;
  hasChanges: boolean;
  canSubmit: boolean;
  pending: boolean;
  error: string | null;
  successMessage: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSelectedVehicleIdChange: (vehicleId: string) => void;
  onFormChange: (next: VehicleFormState) => void;
};

export function VehicleUpdateFormSection({
  selectedVehicle,
  vehicles,
  form,
  plateLooksValid,
  yearLooksValid,
  capacityLooksValid,
  hasChanges,
  canSubmit,
  pending,
  error,
  successMessage,
  onSubmit,
  onSelectedVehicleIdChange,
  onFormChange,
}: Props) {
  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <label className="space-y-1">
        <span className="text-xs font-medium text-slate-700">Secili Araç</span>
        <select
          value={selectedVehicle.vehicleId}
          onChange={(event) => onSelectedVehicleIdChange(event.target.value)}
          className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 focus:border-brand-400"
        >
          {vehicles.map((vehicle) => (
            <option key={vehicle.vehicleId} value={vehicle.vehicleId}>
              {vehicle.plate} | {vehicle.status}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-700">Plaka</span>
          <input
            aria-invalid={!plateLooksValid}
            value={form.plate}
            onChange={(event) => onFormChange({ ...form, plate: event.target.value })}
            onBlur={() => onFormChange({ ...form, plate: normalizeVehiclePlateInput(form.plate) })}
            className={`w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 ${
              plateLooksValid
                ? "border border-line focus:border-brand-400"
                : "border border-rose-300 focus:border-rose-400"
            }`}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-700">Durum</span>
          <select
            value={form.status}
            onChange={(event) => onFormChange({ ...form, status: event.target.value as VehicleStatus })}
            className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 focus:border-brand-400"
          >
            <option value="active">Aktif</option>
            <option value="maintenance">Bakim</option>
            <option value="inactive">Pasif</option>
          </select>
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-700">Marka</span>
          <input
            value={form.brand}
            onChange={(event) => onFormChange({ ...form, brand: event.target.value })}
            onBlur={() => onFormChange({ ...form, brand: normalizeTextInput(form.brand) })}
            className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 focus:border-brand-400"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-700">Model</span>
          <input
            value={form.model}
            onChange={(event) => onFormChange({ ...form, model: event.target.value })}
            onBlur={() => onFormChange({ ...form, model: normalizeTextInput(form.model) })}
            className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 focus:border-brand-400"
          />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-700">Yil</span>
          <input
            inputMode="numeric"
            step={1}
            min={1980}
            max={new Date().getFullYear() + 1}
            aria-invalid={!yearLooksValid}
            value={form.year}
            onChange={(event) => onFormChange({ ...form, year: event.target.value })}
            onBlur={() => onFormChange({ ...form, year: normalizeOptionalVehicleIntegerInput(form.year) })}
            className={`w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 ${
              yearLooksValid
                ? "border border-line focus:border-brand-400"
                : "border border-rose-300 focus:border-rose-400"
            }`}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-700">Kapasite</span>
          <input
            inputMode="numeric"
            step={1}
            min={1}
            max={200}
            aria-invalid={!capacityLooksValid}
            value={form.capacity}
            onChange={(event) => onFormChange({ ...form, capacity: event.target.value })}
            onBlur={() =>
              onFormChange({ ...form, capacity: normalizeOptionalVehicleIntegerInput(form.capacity) })
            }
            className={`w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 ${
              capacityLooksValid
                ? "border border-line focus:border-brand-400"
                : "border border-rose-300 focus:border-rose-400"
            }`}
          />
        </label>
      </div>

      {!plateLooksValid || !yearLooksValid || !capacityLooksValid ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          Plaka en az 4 karakter olmali; yil 1980+ ve kapasite 1-200 araliginda olmali.
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"
        >
          {error}
        </div>
      ) : null}
      {successMessage ? (
        <div
          aria-live="polite"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700"
        >
          {successMessage}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3 pt-1">
        <p className="text-xs text-slate-500">
          {hasChanges
            ? "Patch yalniz degisen alanlar için gonderilir. Duplicate plaka `already-exists` dondurebilir."
            : "Degisiklik yapmadan guncelleme gonderilmez."}
        </p>
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {pending ? "Kaydediliyor..." : "Güncelle"}
        </button>
      </div>
    </form>
  );
}


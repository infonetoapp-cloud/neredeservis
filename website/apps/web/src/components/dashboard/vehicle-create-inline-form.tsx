"use client";

import { FormEvent, useMemo, useState } from "react";

import { normalizeTextInput } from "@/components/dashboard/input-normalization";
import {
  createVehicleCallable,
  mapCompanyCallableErrorToMessage,
} from "@/features/company/company-callables";
import type { VehicleStatus } from "@/features/company/company-types";
import {
  isVehicleCapacityInputValid,
  isVehiclePlateInputValid,
  isVehicleYearInputValid,
  normalizeVehiclePlateInput,
  normalizeOptionalVehicleIntegerInput,
  parseOptionalVehicleIntegerInput,
} from "@/components/dashboard/vehicle-form-validation";

type Props = {
  companyId: string;
  onCreated?: (created: { vehicleId: string }) => Promise<void> | void;
};

type FormState = {
  plate: string;
  brand: string;
  model: string;
  year: string;
  capacity: string;
  status: VehicleStatus;
};

const INITIAL_FORM: FormState = {
  plate: "",
  brand: "",
  model: "",
  year: "",
  capacity: "",
  status: "active",
};

function toNullableTrimmed(value: string): string | null | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function VehicleCreateInlineForm({ companyId, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const plateLooksValid = isVehiclePlateInputValid(form.plate);
  const yearLooksValid = isVehicleYearInputValid(form.year);
  const capacityLooksValid = isVehicleCapacityInputValid(form.capacity);
  const canSubmit = !pending && plateLooksValid && yearLooksValid && capacityLooksValid;

  const submitLabel = useMemo(() => (pending ? "Kaydediliyor..." : "Arac Ekle"), [pending]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setPending(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const year = parseOptionalVehicleIntegerInput(form.year);
      const capacity = parseOptionalVehicleIntegerInput(form.capacity);
      if (year === null || !yearLooksValid || capacity === null || !capacityLooksValid) {
        throw new Error("Yil veya kapasite gecersiz. Yil 1980+ ve kapasite 1-200 olmali.");
      }

      const created = await createVehicleCallable({
        ownerType: "company",
        companyId,
        plate: normalizeVehiclePlateInput(form.plate),
        brand: toNullableTrimmed(form.brand),
        model: toNullableTrimmed(form.model),
        year,
        capacity,
        status: form.status,
      });

      setForm(INITIAL_FORM);
      setSuccessMessage(`Arac olusturuldu (${created.vehicleId.slice(0, 8)})`);
      if (onCreated) {
        await onCreated({ vehicleId: created.vehicleId });
      }
    } catch (nextError) {
      if (
        nextError instanceof Error &&
        nextError.message === "Yil veya kapasite gecersiz. Yil 1980+ ve kapasite 1-200 olmali."
      ) {
        setError(nextError.message);
      } else {
        setError(mapCompanyCallableErrorToMessage(nextError));
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Arac Ekle</h3>
          <p className="text-xs text-slate-500">
            Company-scoped vehicle create callable ile ilk arac kaydini olustur.
          </p>
        </div>
        <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
          createVehicle
        </span>
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-700">Plaka *</span>
            <input
              aria-invalid={!plateLooksValid}
              value={form.plate}
              onChange={(event) => setForm((prev) => ({ ...prev, plate: event.target.value }))}
              onBlur={() =>
                setForm((prev) => ({ ...prev, plate: normalizeVehiclePlateInput(prev.plate) }))
              }
              placeholder="34 ABC 123"
              className={`w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 ${
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
              onChange={(event) =>
                setForm((prev) => ({ ...prev, status: event.target.value as VehicleStatus }))
              }
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
              onChange={(event) => setForm((prev) => ({ ...prev, brand: event.target.value }))}
              onBlur={() => setForm((prev) => ({ ...prev, brand: normalizeTextInput(prev.brand) }))}
              placeholder="Ford"
              className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-brand-400"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-700">Model</span>
            <input
              value={form.model}
              onChange={(event) => setForm((prev) => ({ ...prev, model: event.target.value }))}
              onBlur={() => setForm((prev) => ({ ...prev, model: normalizeTextInput(prev.model) }))}
              placeholder="Transit"
              className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-brand-400"
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
              onChange={(event) => setForm((prev) => ({ ...prev, year: event.target.value }))}
              onBlur={() =>
                setForm((prev) => ({ ...prev, year: normalizeOptionalVehicleIntegerInput(prev.year) }))
              }
              placeholder="2021"
              className={`w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 ${
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
              onChange={(event) => setForm((prev) => ({ ...prev, capacity: event.target.value }))}
              onBlur={() =>
                setForm((prev) => ({
                  ...prev,
                  capacity: normalizeOptionalVehicleIntegerInput(prev.capacity),
                }))
              }
              placeholder="16"
              className={`w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 ${
                capacityLooksValid
                  ? "border border-line focus:border-brand-400"
                  : "border border-rose-300 focus:border-rose-400"
              }`}
            />
          </label>
        </div>

        {!plateLooksValid ? (
          <p className="text-xs text-amber-700">Kayit icin plaka alani en az 2 karakter olmali.</p>
        ) : null}
        {!yearLooksValid || !capacityLooksValid ? (
          <p className="text-xs text-amber-700">
            Yil 1980+ olmali, kapasite 1-200 araliginda olmali.
          </p>
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
            Detay duzenleme icin sag paneldeki Arac Guncelle formunu kullan.
          </p>
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </section>
  );
}

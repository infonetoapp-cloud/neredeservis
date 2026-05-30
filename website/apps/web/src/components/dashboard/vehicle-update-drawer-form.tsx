"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  VehicleUpdateFormSection,
  type VehicleFormState,
} from "@/components/dashboard/vehicle-update-form-section";
import {
  isVehicleCapacityInputValid,
  isVehiclePlateInputValid,
  isVehicleYearInputValid,
  normalizeVehiclePlateInput,
  parseOptionalVehicleIntegerInput,
} from "@/components/dashboard/vehicle-form-validation";
import {
  mapCompanyCallableErrorToMessage,
  updateVehicleCallable,
} from "@/features/company/company-callables";
import type { CompanyVehicleSummary, VehicleStatus } from "@/features/company/company-types";

type Props = {
  companyId: string;
  vehicles: readonly CompanyVehicleSummary[];
  selectedVehicleId: string | null;
  onSelectedVehicleIdChange: (vehicleId: string) => void;
  onUpdated?: () => Promise<void> | void;
};

function buildFormState(vehicle: CompanyVehicleSummary): VehicleFormState {
  return {
    plate: vehicle.plate,
    brand: vehicle.brand ?? "",
    model: vehicle.model ?? "",
    year: vehicle.year ? String(vehicle.year) : "",
    capacity: vehicle.capacity ? String(vehicle.capacity) : "",
    status: vehicle.status,
  };
}

function toNullableTrimmed(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function fieldChanged<T>(current: T, next: T): boolean {
  return current !== next;
}

export function VehicleUpdateDrawerForm({
  companyId,
  vehicles,
  selectedVehicleId,
  onSelectedVehicleIdChange,
  onUpdated,
}: Props) {
  const selectedVehicle =
    (selectedVehicleId
      ? vehicles.find((vehicle) => vehicle.vehicleId === selectedVehicleId) ?? null
      : vehicles[0] ?? null) ?? null;

  const [form, setForm] = useState<VehicleFormState | null>(
    selectedVehicle ? buildFormState(selectedVehicle) : null,
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedVehicle) {
      setForm(null);
      return;
    }
    setForm(buildFormState(selectedVehicle));
    setError(null);
    setSuccessMessage(null);
  }, [selectedVehicle]);

  const plateLooksValid = form ? isVehiclePlateInputValid(form.plate) : false;
  const yearLooksValid = form ? isVehicleYearInputValid(form.year) : false;
  const capacityLooksValid = form ? isVehicleCapacityInputValid(form.capacity) : false;

  const hasChanges = useMemo(() => {
    if (!selectedVehicle || !form) return false;
    const parsedYear = parseOptionalVehicleIntegerInput(form.year);
    const parsedCapacity = parseOptionalVehicleIntegerInput(form.capacity);
    return (
      fieldChanged(selectedVehicle.plate, normalizeVehiclePlateInput(form.plate)) ||
      fieldChanged(selectedVehicle.brand ?? null, toNullableTrimmed(form.brand)) ||
      fieldChanged(selectedVehicle.model ?? null, toNullableTrimmed(form.model)) ||
      fieldChanged(
        selectedVehicle.year ?? null,
        parsedYear === undefined || parsedYear === null ? null : parsedYear,
      ) ||
      fieldChanged(
        selectedVehicle.capacity ?? null,
        parsedCapacity === undefined || parsedCapacity === null ? null : parsedCapacity,
      ) ||
      fieldChanged(selectedVehicle.status, form.status)
    );
  }, [form, selectedVehicle]);

  const canSubmit = Boolean(
    selectedVehicle &&
      form &&
      !pending &&
      plateLooksValid &&
      yearLooksValid &&
      capacityLooksValid &&
      hasChanges,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedVehicle || !form || !canSubmit) return;

    if (!hasChanges) {
      setSuccessMessage("Degisiklik yok, kayıt gonderilmedi.");
      setError(null);
      return;
    }
    if (!plateLooksValid || !yearLooksValid || !capacityLooksValid) {
      setError("Plaka, yil veya kapasite alanlarinda gecersiz deger var.");
      return;
    }

    setPending(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const patch: {
        plate?: string;
        brand?: string | null;
        model?: string | null;
        year?: number | null;
        capacity?: number | null;
        status?: VehicleStatus;
      } = {};

      const nextPlate = normalizeVehiclePlateInput(form.plate);
      const nextBrand = toNullableTrimmed(form.brand);
      const nextModel = toNullableTrimmed(form.model);
      const parsedYear = parseOptionalVehicleIntegerInput(form.year);
      const parsedCapacity = parseOptionalVehicleIntegerInput(form.capacity);
      if (parsedYear === null || parsedCapacity === null) {
        throw new Error("Plaka, yil veya kapasite alanlarinda gecersiz deger var.");
      }
      const nextYear = parsedYear ?? null;
      const nextCapacity = parsedCapacity ?? null;

      if (nextPlate && nextPlate !== selectedVehicle.plate) patch.plate = nextPlate;
      if (nextBrand !== (selectedVehicle.brand ?? null)) patch.brand = nextBrand;
      if (nextModel !== (selectedVehicle.model ?? null)) patch.model = nextModel;
      if (nextYear !== (selectedVehicle.year ?? null)) patch.year = nextYear;
      if (nextCapacity !== (selectedVehicle.capacity ?? null)) patch.capacity = nextCapacity;
      if (form.status !== selectedVehicle.status) patch.status = form.status;

      if (Object.keys(patch).length === 0) {
        setSuccessMessage("Degisiklik yok, kayıt gonderilmedi.");
        return;
      }

      await updateVehicleCallable({
        companyId,
        vehicleId: selectedVehicle.vehicleId,
        patch,
      });

      setSuccessMessage("Araç bilgileri guncellendi.");
      if (onUpdated) {
        await onUpdated();
      }
    } catch (nextError) {
      if (
        nextError instanceof Error &&
        nextError.message === "Plaka, yil veya kapasite alanlarinda gecersiz deger var."
      ) {
        setError(nextError.message);
      } else {
        setError(mapCompanyCallableErrorToMessage(nextError));
      }
    } finally {
      setPending(false);
    }
  }

  if (!selectedVehicle || !form) {
    return (
      <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">Araç Güncelle</div>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Liste bos oldugunda guncelleme formu devreye girmez.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Araç Güncelle</h3>
          <p className="text-xs text-slate-500">
            `updateVehicle` patch mutasyonu ile secili araç ozet alanlari guncellenir.
          </p>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
          updateVehicle
        </span>
      </div>

      <VehicleUpdateFormSection
        selectedVehicle={selectedVehicle}
        vehicles={vehicles}
        form={form}
        plateLooksValid={plateLooksValid}
        yearLooksValid={yearLooksValid}
        capacityLooksValid={capacityLooksValid}
        hasChanges={hasChanges}
        canSubmit={canSubmit}
        pending={pending}
        error={error}
        successMessage={successMessage}
        onSubmit={handleSubmit}
        onSelectedVehicleIdChange={onSelectedVehicleIdChange}
        onFormChange={(next) => setForm(next)}
      />
    </section>
  );
}




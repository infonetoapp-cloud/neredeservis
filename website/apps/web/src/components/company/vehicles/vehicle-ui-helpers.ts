import type { VehicleStatus } from "@/features/company/company-client-shared";

export type VehicleDraft = {
  plate: string;
  brand: string;
  model: string;
  year: string;
  capacity: string;
  status: VehicleStatus;
};

export function normalizePlateInput(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

export const VEHICLE_CAPACITY_MIN = 1;
export const VEHICLE_CAPACITY_MAX = 200;

export const VEHICLE_STATUS_OPTIONS: { value: VehicleStatus; label: string; color: string }[] = [
  { value: "active", label: "Aktif", color: "emerald" },
  { value: "maintenance", label: "Bakımda", color: "amber" },
  { value: "inactive", label: "Pasif", color: "slate" },
];

export function vehicleDraftFromItem(v: {
  plate: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  capacity: number | null;
  status: VehicleStatus;
}): VehicleDraft {
  return {
    plate: v.plate,
    brand: v.brand ?? "",
    model: v.model ?? "",
    year: v.year != null ? String(v.year) : "",
    capacity: v.capacity != null ? String(v.capacity) : "",
    status: v.status,
  };
}

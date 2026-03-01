export type VehicleDraft = {
  plate: string;
  label: string;
  capacity: string;
  isActive: boolean;
};

export function normalizePlateInput(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

export const VEHICLE_CAPACITY_MIN = 1;
export const VEHICLE_CAPACITY_MAX = 120;

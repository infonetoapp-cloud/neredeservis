"use client";

const VEHICLE_YEAR_MIN = 1980;
const VEHICLE_YEAR_MAX_OFFSET = 1;
const VEHICLE_CAPACITY_MIN = 1;
const VEHICLE_CAPACITY_MAX = 200;
const VEHICLE_PLATE_MIN_LENGTH = 4;
const INTEGER_PATTERN = /^\d+$/;

export function normalizeVehiclePlateInput(value: string): string {
  return value.toUpperCase().replace(/\s+/g, " ").trim();
}

export function isVehiclePlateInputValid(value: string): boolean {
  return normalizeVehiclePlateInput(value).replace(/\s+/g, "").length >= VEHICLE_PLATE_MIN_LENGTH;
}

export function parseOptionalVehicleIntegerInput(
  value: string,
): number | undefined | null {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!INTEGER_PATTERN.test(trimmed)) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export function normalizeOptionalVehicleIntegerInput(value: string): string {
  const parsed = parseOptionalVehicleIntegerInput(value);
  if (parsed === undefined) return "";
  if (parsed === null) return value.trim();
  return String(parsed);
}

export function isVehicleYearInputValid(value: string): boolean {
  const parsed = parseOptionalVehicleIntegerInput(value);
  if (parsed === undefined) return true;
  if (parsed === null) return false;
  const maxYear = new Date().getFullYear() + VEHICLE_YEAR_MAX_OFFSET;
  return parsed >= VEHICLE_YEAR_MIN && parsed <= maxYear;
}

export function isVehicleCapacityInputValid(value: string): boolean {
  const parsed = parseOptionalVehicleIntegerInput(value);
  if (parsed === undefined) return true;
  if (parsed === null) return false;
  return parsed >= VEHICLE_CAPACITY_MIN && parsed <= VEHICLE_CAPACITY_MAX;
}

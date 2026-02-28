"use client";

import type { CompanyRouteStopSummary } from "@/features/company/company-types";

export type StopFormState = {
  stopId: string | null;
  name: string;
  order: number;
  lat: string;
  lng: string;
};

export type ValidatedStopForm = {
  name: string;
  order: number;
  lat: number;
  lng: number;
};

const STOP_COORDINATE_PATTERN = /^[+-]?\d+(?:[.,]\d+)?$/;
const STOP_ORDER_MIN = 0;
const STOP_ORDER_MAX = 500;

export function normalizeStopCoordinateInput(value: string): string {
  return value.trim().replace(/,/g, ".");
}

function parseStopCoordinateInput(value: string): number {
  const trimmed = normalizeStopCoordinateInput(value);
  if (!trimmed) return Number.NaN;
  if (!STOP_COORDINATE_PATTERN.test(trimmed)) return Number.NaN;
  return Number(trimmed);
}

export function buildEmptyForm(nextOrder: number): StopFormState {
  return {
    stopId: null,
    name: "",
    order: nextOrder,
    lat: "",
    lng: "",
  };
}

export function buildEditForm(stop: CompanyRouteStopSummary): StopFormState {
  return {
    stopId: stop.stopId,
    name: stop.name,
    order: stop.order,
    lat: String(stop.location.lat),
    lng: String(stop.location.lng),
  };
}

export function isValidStopLatitudeInput(value: string): boolean {
  const lat = parseStopCoordinateInput(value);
  return Number.isFinite(lat) && lat >= -90 && lat <= 90;
}

export function isValidStopLongitudeInput(value: string): boolean {
  const lng = parseStopCoordinateInput(value);
  return Number.isFinite(lng) && lng >= -180 && lng <= 180;
}

export function isValidStopOrderInput(value: number): boolean {
  return (
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= STOP_ORDER_MIN &&
    value <= STOP_ORDER_MAX
  );
}

export function normalizeStopOrderInput(value: number, fallbackOrder: number): number {
  if (!Number.isFinite(value)) {
    return Math.min(STOP_ORDER_MAX, Math.max(STOP_ORDER_MIN, Math.trunc(fallbackOrder)));
  }
  return Math.min(STOP_ORDER_MAX, Math.max(STOP_ORDER_MIN, Math.trunc(value)));
}

export function validateStopFormInput(
  form: StopFormState,
): { ok: true; data: ValidatedStopForm } | { ok: false; error: string } {
  const name = form.name.trim();
  if (name.length < 2) {
    return { ok: false, error: "Durak adi en az 2 karakter olmali." };
  }

  const lat = parseStopCoordinateInput(form.lat);
  if (!isValidStopLatitudeInput(form.lat)) {
    return { ok: false, error: "Lat degeri gecersiz." };
  }

  const lng = parseStopCoordinateInput(form.lng);
  if (!isValidStopLongitudeInput(form.lng)) {
    return { ok: false, error: "Lng degeri gecersiz." };
  }

  if (!isValidStopOrderInput(form.order)) {
    return { ok: false, error: "Durak sirasi 0-500 araliginda tam sayi olmali." };
  }

  return {
    ok: true,
    data: {
      name,
      order: Math.trunc(form.order),
      lat,
      lng,
    },
  };
}

export function findStopOrderConflict(
  stops: CompanyRouteStopSummary[],
  form: StopFormState,
): CompanyRouteStopSummary | null {
  if (!isValidStopOrderInput(form.order)) return null;
  return (
    stops.find((stop) => stop.order === form.order && stop.stopId !== form.stopId) ?? null
  );
}

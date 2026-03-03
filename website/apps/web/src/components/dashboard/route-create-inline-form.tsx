"use client";

import { FormEvent, useMemo, useState } from "react";

import { isValidRouteTime } from "@/components/dashboard/route-time-validation";
import { normalizeTextInput } from "@/components/dashboard/input-normalization";
import {
  createCompanyRouteCallable,
  mapCompanyCallableErrorToMessage,
} from "@/features/company/company-callables";

type Props = {
  companyId: string;
  onCreated?: (created: { routeId: string; srvCode: string }) => Promise<void> | void;
};

type RouteCreateFormState = {
  name: string;
  startAddress: string;
  endAddress: string;
  startLat: string;
  startLng: string;
  endLat: string;
  endLng: string;
  scheduledTime: string;
  timeSlot: "morning" | "midday" | "evening" | "custom";
  allowGuestTracking: boolean;
};

const INITIAL_FORM: RouteCreateFormState = {
  name: "",
  startAddress: "Baslangic Noktasi",
  endAddress: "Bitis Noktasi",
  startLat: "41.0082",
  startLng: "28.9784",
  endLat: "41.0150",
  endLng: "28.9900",
  scheduledTime: "08:00",
  timeSlot: "morning",
  allowGuestTracking: true,
};

const COORDINATE_PATTERN = /^[+-]?\d+(?:[.,]\d+)?$/;

function normalizeCoordinateInput(value: string): string {
  return value.trim().replace(/,/g, ".");
}

function parseCoordinateInput(value: string): number {
  const trimmed = normalizeCoordinateInput(value);
  if (!trimmed) return Number.NaN;
  if (!COORDINATE_PATTERN.test(trimmed)) return Number.NaN;
  return Number(trimmed);
}

function isValidCoordinateInput(value: string, min: number, max: number): boolean {
  const parsed = parseCoordinateInput(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max;
}

function parseCoordinate(value: string, field: string, min: number, max: number): number {
  const parsed = parseCoordinateInput(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${field} koordinati gecerli degil.`);
  }
  if (parsed < min || parsed > max) {
    throw new Error(`${field} koordinati aralik disinda.`);
  }
  return parsed;
}

export function RouteCreateInlineForm({ companyId, onCreated }: Props) {
  const [form, setForm] = useState<RouteCreateFormState>(INITIAL_FORM);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const isScheduledTimeValid = isValidRouteTime(form.scheduledTime);
  const isStartLatValid = isValidCoordinateInput(form.startLat, -90, 90);
  const isStartLngValid = isValidCoordinateInput(form.startLng, -180, 180);
  const isEndLatValid = isValidCoordinateInput(form.endLat, -90, 90);
  const isEndLngValid = isValidCoordinateInput(form.endLng, -180, 180);
  const isCoordinateSetValid = isStartLatValid && isStartLngValid && isEndLatValid && isEndLngValid;

  const canSubmit =
    !pending &&
    form.name.trim().length >= 2 &&
    form.startAddress.trim().length >= 3 &&
    form.endAddress.trim().length >= 3 &&
    isCoordinateSetValid &&
    isScheduledTimeValid;

  const submitLabel = useMemo(() => (pending ? "Olusturuluyor..." : "Rota Olustur"), [pending]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    if (!isValidRouteTime(form.scheduledTime)) {
      setError("Saat HH:MM formatinda olmali.");
      return;
    }
    if (!isCoordinateSetValid) {
      setError("Koordinat alanlarinda gecersiz deger var.");
      return;
    }

    setPending(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const startPoint = {
        lat: parseCoordinate(form.startLat, "Baslangic lat", -90, 90),
        lng: parseCoordinate(form.startLng, "Baslangic lng", -180, 180),
      };
      const endPoint = {
        lat: parseCoordinate(form.endLat, "Bitis lat", -90, 90),
        lng: parseCoordinate(form.endLng, "Bitis lng", -180, 180),
      };

      const idempotencyKey =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `route-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

      const result = await createCompanyRouteCallable({
        companyId,
        name: form.name.trim(),
        startPoint,
        startAddress: form.startAddress.trim(),
        endPoint,
        endAddress: form.endAddress.trim(),
        scheduledTime: form.scheduledTime,
        timeSlot: form.timeSlot,
        allowGuestTracking: form.allowGuestTracking,
        authorizedDriverIds: [],
        idempotencyKey,
      });

      setForm((prev) => ({ ...INITIAL_FORM, startLat: prev.startLat, startLng: prev.startLng, endLat: prev.endLat, endLng: prev.endLng }));
      setSuccessMessage(`Rota olusturuldu (${result.srvCode})`);
      if (onCreated) {
        await onCreated({ routeId: result.routeId, srvCode: result.srvCode });
      }
    } catch (nextError) {
      if (nextError instanceof Error && nextError.message.includes("koordinati")) {
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
          <h3 className="text-sm font-semibold text-slate-900">Rota Olustur</h3>
        </div>
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-medium text-slate-700">Rota Adi *</span>
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              onBlur={() => setForm((prev) => ({ ...prev, name: normalizeTextInput(prev.name) }))}
              placeholder="Sabah Vardiya A"
              className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-400"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-700">Saat *</span>
            <input
              type="time"
              aria-invalid={!isScheduledTimeValid}
              value={form.scheduledTime}
              onChange={(e) => setForm((prev) => ({ ...prev, scheduledTime: e.target.value }))}
              className={`w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ${
                isScheduledTimeValid
                  ? "border border-line focus:border-brand-400"
                  : "border border-rose-300 focus:border-rose-400"
              }`}
            />
            {!isScheduledTimeValid ? (
              <p className="text-[11px] font-medium text-rose-700">Saat HH:MM formatinda olmali.</p>
            ) : null}
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-700">Slot</span>
            <select
              value={form.timeSlot}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  timeSlot: e.target.value as RouteCreateFormState["timeSlot"],
                }))
              }
              className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-400"
            >
              <option value="morning">Sabah</option>
              <option value="midday">Ogle</option>
              <option value="evening">Aksam</option>
              <option value="custom">Custom</option>
            </select>
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-700">Baslangic Adresi *</span>
            <input
              value={form.startAddress}
              onChange={(e) => setForm((prev) => ({ ...prev, startAddress: e.target.value }))}
              onBlur={() =>
                setForm((prev) => ({ ...prev, startAddress: normalizeTextInput(prev.startAddress) }))
              }
              className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-400"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-700">Bitis Adresi *</span>
            <input
              value={form.endAddress}
              onChange={(e) => setForm((prev) => ({ ...prev, endAddress: e.target.value }))}
              onBlur={() =>
                setForm((prev) => ({ ...prev, endAddress: normalizeTextInput(prev.endAddress) }))
              }
              className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-400"
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-700">Baslangic Lat</span>
              <input
                inputMode="decimal"
                aria-invalid={!isStartLatValid}
                value={form.startLat}
                onChange={(e) => setForm((prev) => ({ ...prev, startLat: e.target.value }))}
                onBlur={() =>
                  setForm((prev) => ({ ...prev, startLat: normalizeCoordinateInput(prev.startLat) }))
                }
                className={`w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ${
                  isStartLatValid
                    ? "border border-line focus:border-brand-400"
                    : "border border-rose-300 focus:border-rose-400"
                }`}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-700">Baslangic Lng</span>
              <input
                inputMode="decimal"
                aria-invalid={!isStartLngValid}
                value={form.startLng}
                onChange={(e) => setForm((prev) => ({ ...prev, startLng: e.target.value }))}
                onBlur={() =>
                  setForm((prev) => ({ ...prev, startLng: normalizeCoordinateInput(prev.startLng) }))
                }
                className={`w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ${
                  isStartLngValid
                    ? "border border-line focus:border-brand-400"
                    : "border border-rose-300 focus:border-rose-400"
                }`}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-700">Bitis Lat</span>
              <input
                inputMode="decimal"
                aria-invalid={!isEndLatValid}
                value={form.endLat}
                onChange={(e) => setForm((prev) => ({ ...prev, endLat: e.target.value }))}
                onBlur={() =>
                  setForm((prev) => ({ ...prev, endLat: normalizeCoordinateInput(prev.endLat) }))
                }
                className={`w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ${
                  isEndLatValid
                    ? "border border-line focus:border-brand-400"
                    : "border border-rose-300 focus:border-rose-400"
                }`}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-700">Bitis Lng</span>
              <input
                inputMode="decimal"
                aria-invalid={!isEndLngValid}
                value={form.endLng}
                onChange={(e) => setForm((prev) => ({ ...prev, endLng: e.target.value }))}
                onBlur={() =>
                  setForm((prev) => ({ ...prev, endLng: normalizeCoordinateInput(prev.endLng) }))
                }
                className={`w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ${
                  isEndLngValid
                    ? "border border-line focus:border-brand-400"
                    : "border border-rose-300 focus:border-rose-400"
                }`}
              />
            </label>
          </div>
        </div>
        {!isCoordinateSetValid ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
            Koordinatlar gecersiz. Lat -90..90, Lng -180..180 araliginda olmali. Virgullu giris
            desteklenir (ornek: 41,015).
          </div>
        ) : null}

        <label className="flex items-center gap-2 rounded-xl border border-line bg-slate-50 px-3 py-2.5 text-sm text-slate-800">
          <input
            type="checkbox"
            checked={form.allowGuestTracking}
            onChange={(e) => setForm((prev) => ({ ...prev, allowGuestTracking: e.target.checked }))}
            className="h-4 w-4 rounded border-line"
          />
          Misafir takip linki acik olsun
        </label>

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
            Konum alanlari manuel koordinat girisiyle calisir.
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

"use client";

import type { FormEvent } from "react";

import {
  isValidStopLatitudeInput,
  isValidStopLongitudeInput,
  isValidStopOrderInput,
  normalizeStopOrderInput,
  normalizeStopCoordinateInput,
  type StopFormState,
} from "@/components/dashboard/route-stops-editor-helpers";
import { normalizeTextInput } from "@/components/dashboard/input-normalization";

type Props = {
  form: StopFormState;
  nextOrder: number;
  pending: boolean;
  canSubmit: boolean;
  structuralLocked: boolean;
  structuralLockMessage: string;
  error: string | null;
  orderConflictMessage: string | null;
  successMessage: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onResetCreateMode: () => void;
  onNameChange: (value: string) => void;
  onOrderChange: (value: number) => void;
  onLatChange: (value: string) => void;
  onLngChange: (value: string) => void;
};

export function RouteStopsFormSection({
  form,
  nextOrder,
  pending,
  canSubmit,
  structuralLocked,
  structuralLockMessage,
  error,
  orderConflictMessage,
  successMessage,
  onSubmit,
  onResetCreateMode,
  onNameChange,
  onOrderChange,
  onLatChange,
  onLngChange,
}: Props) {
  const isOrderValid = isValidStopOrderInput(form.order);
  const hasOrderConflict = Boolean(orderConflictMessage);
  const isLatValid = isValidStopLatitudeInput(form.lat);
  const isLngValid = isValidStopLongitudeInput(form.lng);

  return (
    <form className="space-y-3 rounded-xl border border-line bg-white p-3" onSubmit={onSubmit}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-slate-800">
          {form.stopId ? "Durak Guncelle" : "Yeni Durak Ekle"}
        </div>
        {form.stopId ? (
          <button
            type="button"
            onClick={onResetCreateMode}
            className="inline-flex items-center rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50"
          >
            Yeni Durak Modu
          </button>
        ) : null}
      </div>

      <label className="space-y-1">
        <span className="text-xs font-medium text-slate-700">Durak Adi</span>
        <input
          value={form.name}
          onChange={(event) => onNameChange(event.target.value)}
          onBlur={() => onNameChange(normalizeTextInput(form.name))}
          className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-400"
          placeholder="Merkez Kapisi"
        />
      </label>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-700">Sira</span>
          <input
            type="number"
            min={0}
            max={500}
            step={1}
            aria-invalid={!isOrderValid || hasOrderConflict}
            value={Number.isFinite(form.order) ? form.order : nextOrder}
            onChange={(event) => {
              const raw = event.target.value.trim();
              onOrderChange(raw.length === 0 ? Number.NaN : Number(raw));
            }}
            onBlur={() => onOrderChange(normalizeStopOrderInput(form.order, nextOrder))}
            disabled={pending || structuralLocked}
            className={`w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ${
              isOrderValid && !hasOrderConflict
                ? "border border-line focus:border-brand-400"
                : "border border-rose-300 focus:border-rose-400"
            }`}
          />
          {!isOrderValid || hasOrderConflict ? (
            <p className="text-[11px] font-medium text-rose-700">
              {orderConflictMessage ?? "Sira 0-500 araliginda tam sayi olmali."}
            </p>
          ) : null}
        </label>
        <label className="space-y-1 md:col-span-1">
          <span className="text-xs font-medium text-slate-700">Lat</span>
          <input
            inputMode="decimal"
            aria-invalid={!isLatValid}
            value={form.lat}
            onChange={(event) => onLatChange(event.target.value)}
            onBlur={() => onLatChange(normalizeStopCoordinateInput(form.lat))}
            className={`w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ${
              isLatValid
                ? "border border-line focus:border-brand-400"
                : "border border-rose-300 focus:border-rose-400"
            }`}
            placeholder="41.015137"
          />
          {!isLatValid ? (
            <p className="text-[11px] font-medium text-rose-700">
              Lat zorunlu. -90 ile 90 arasinda olmali.
            </p>
          ) : null}
        </label>
        <label className="space-y-1 md:col-span-1">
          <span className="text-xs font-medium text-slate-700">Lng</span>
          <input
            inputMode="decimal"
            aria-invalid={!isLngValid}
            value={form.lng}
            onChange={(event) => onLngChange(event.target.value)}
            onBlur={() => onLngChange(normalizeStopCoordinateInput(form.lng))}
            className={`w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ${
              isLngValid
                ? "border border-line focus:border-brand-400"
                : "border border-rose-300 focus:border-rose-400"
            }`}
            placeholder="28.979530"
          />
          {!isLngValid ? (
            <p className="text-[11px] font-medium text-rose-700">
              Lng zorunlu. -180 ile 180 arasinda olmali.
            </p>
          ) : null}
        </label>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"
        >
          {error}
        </div>
      ) : null}
      {structuralLocked && !form.stopId ? (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800"
        >
          {structuralLockMessage}
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

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Siralama icin Basa/Yukari/Asagi/Sona ve surukle-birak aksiyonlari aktif.
        </p>
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {pending ? "Kaydediliyor..." : form.stopId ? "Durak Guncelle" : "Durak Ekle"}
        </button>
      </div>
    </form>
  );
}

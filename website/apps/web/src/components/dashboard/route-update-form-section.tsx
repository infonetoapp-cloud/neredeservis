"use client";

import type { FormEvent } from "react";

import { RouteAuthorizedMembersFieldset } from "@/components/dashboard/route-authorized-members-fieldset";
import { normalizeTextInput } from "@/components/dashboard/input-normalization";
import type { CompanyMemberSummary, CompanyRouteSummary } from "@/features/company/company-types";

export type RouteTimeSlot = "morning" | "midday" | "evening" | "custom";

export type RouteFormState = {
  name: string;
  scheduledTime: string;
  timeSlot: RouteTimeSlot;
  allowGuestTracking: boolean;
  isArchived: boolean;
  authorizedDriverIds: string[];
};

type Props = {
  selectedRoute: CompanyRouteSummary;
  routes: readonly CompanyRouteSummary[];
  form: RouteFormState;
  isScheduledTimeValid: boolean;
  hasChanges: boolean;
  activeMembers: readonly CompanyMemberSummary[];
  membersLoadStatus: "idle" | "loading" | "success" | "error";
  canSubmit: boolean;
  pending: boolean;
  error: string | null;
  successMessage: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSelectedRouteIdChange: (routeId: string) => void;
  onFormChange: (next: RouteFormState) => void;
  onToggleAuthorizedMember: (memberUid: string, checked: boolean) => void;
};

export function RouteUpdateFormSection({
  selectedRoute,
  routes,
  form,
  isScheduledTimeValid,
  hasChanges,
  activeMembers,
  membersLoadStatus,
  canSubmit,
  pending,
  error,
  successMessage,
  onSubmit,
  onSelectedRouteIdChange,
  onFormChange,
  onToggleAuthorizedMember,
}: Props) {
  const isNameValid = form.name.trim().length >= 2;

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <label className="space-y-1">
        <span className="text-xs font-medium text-slate-700">Secili Rota</span>
        <select
          value={selectedRoute.routeId}
          onChange={(event) => onSelectedRouteIdChange(event.target.value)}
          className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 focus:border-brand-400"
        >
          {routes.map((route) => (
            <option key={route.routeId} value={route.routeId}>
              {route.isArchived ? "[Arsiv] " : ""}
              {route.name} - {route.scheduledTime ?? "--:--"}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1">
        <span className="text-xs font-medium text-slate-700">Rota Adi</span>
        <input
          value={form.name}
          onChange={(event) => onFormChange({ ...form, name: event.target.value })}
          onBlur={() => onFormChange({ ...form, name: normalizeTextInput(form.name) })}
          aria-invalid={!isNameValid}
          className={`w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 ${
            isNameValid
              ? "border border-line focus:border-brand-400"
              : "border border-rose-300 focus:border-rose-400"
          }`}
        />
        {!isNameValid ? (
          <p className="text-[11px] font-medium text-rose-700">Rota adi en az 2 karakter olmali.</p>
        ) : null}
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-700">Saat</span>
          <input
            type="time"
            aria-invalid={!isScheduledTimeValid}
            value={form.scheduledTime}
            onChange={(event) => onFormChange({ ...form, scheduledTime: event.target.value })}
            className={`w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 ${
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
            onChange={(event) => onFormChange({ ...form, timeSlot: event.target.value as RouteTimeSlot })}
            className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 focus:border-brand-400"
          >
            <option value="morning">Sabah</option>
            <option value="midday">Ogle</option>
            <option value="evening">Aksam</option>
            <option value="custom">Custom</option>
          </select>
        </label>
      </div>

      <div className="grid gap-2">
        <label className="flex items-center gap-2 rounded-xl border border-line bg-slate-50 px-3 py-2.5 text-sm text-slate-800">
          <input
            type="checkbox"
            checked={form.allowGuestTracking}
            onChange={(event) => onFormChange({ ...form, allowGuestTracking: event.target.checked })}
            className="h-4 w-4 rounded border-line"
          />
          Misafir takip linki acik olsun
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-line bg-slate-50 px-3 py-2.5 text-sm text-slate-800">
          <input
            type="checkbox"
            checked={!form.isArchived}
            onChange={(event) => onFormChange({ ...form, isArchived: !event.target.checked })}
            className="h-4 w-4 rounded border-line"
          />
          Rota aktif (kapatirsan arsive alinir)
        </label>
      </div>

      <RouteAuthorizedMembersFieldset
        membersLoadStatus={membersLoadStatus}
        activeMembers={activeMembers}
        authorizedDriverIds={form.authorizedDriverIds}
        onToggleMember={onToggleAuthorizedMember}
      />

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
            ? "Durak yapisini duzenlemek için Duraklar panelini kullan."
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


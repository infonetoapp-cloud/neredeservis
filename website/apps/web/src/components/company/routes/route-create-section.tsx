"use client";

import type { CompanyRouteTimeSlot } from "@/features/company/company-client";

import { AddressAutocompleteInput, type AddressSuggestion } from "./place-autocomplete-input";
import type { RouteTimeSlotOption } from "./routes-management-types";

type Props = {
  canMutate: boolean;
  createName: string;
  createScheduledTime: string;
  createStartAddress: string;
  createEndAddress: string;
  createStartSuggestion: AddressSuggestion | null;
  createEndSuggestion: AddressSuggestion | null;
  createTimeSlot: RouteTimeSlotOption;
  createAllowGuestTracking: boolean;
  createPending: boolean;
  canCreate: boolean;
  showCreateValidation: boolean;
  createValidationIssues: string[];
  timeSlotOptions: RouteTimeSlotOption[];
  onSetCreateName: (value: string) => void;
  onSetCreateScheduledTime: (value: string) => void;
  onSetCreateStartAddress: (value: string) => void;
  onSetCreateEndAddress: (value: string) => void;
  onSelectCreateStartSuggestion: (suggestion: AddressSuggestion) => void;
  onSelectCreateEndSuggestion: (suggestion: AddressSuggestion) => void;
  onSetCreateTimeSlot: (value: Exclude<CompanyRouteTimeSlot, null>) => void;
  onSetCreateAllowGuestTracking: (checked: boolean) => void;
  onCreateRoute: () => void;
  onResetCreateForm: () => void;
};

export function RouteCreateSection({
  canMutate,
  createName,
  createScheduledTime,
  createStartAddress,
  createEndAddress,
  createStartSuggestion,
  createEndSuggestion,
  createTimeSlot,
  createAllowGuestTracking,
  createPending,
  canCreate,
  showCreateValidation,
  createValidationIssues,
  timeSlotOptions,
  onSetCreateName,
  onSetCreateScheduledTime,
  onSetCreateStartAddress,
  onSetCreateEndAddress,
  onSelectCreateStartSuggestion,
  onSelectCreateEndSuggestion,
  onSetCreateTimeSlot,
  onSetCreateAllowGuestTracking,
  onCreateRoute,
  onResetCreateForm,
}: Props) {
  const timeSlotLabels: Record<RouteTimeSlotOption, string> = {
    morning: "Sabah",
    midday: "Öğlen",
    evening: "Akşam",
    custom: "Özel",
  };

  if (!canMutate) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        Bu rolde rota oluşturma/güncelleme kapalı. Sadece rota ve duraklar görüntülenir.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Route Name + Time Row */}
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Rota Adı
          </span>
          <input
            type="text"
            value={createName}
            onChange={(e) => onSetCreateName(e.target.value)}
            maxLength={80}
            placeholder="Sabah Levent Hattı"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Çıkış Saati
            </span>
            <input
              type="time"
              value={createScheduledTime}
              onChange={(e) => onSetCreateScheduledTime(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Dilim
            </span>
            <select
              value={createTimeSlot}
              onChange={(e) => onSetCreateTimeSlot(e.target.value as RouteTimeSlotOption)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {timeSlotOptions.map((slot) => (
                <option key={slot} value={slot}>
                  {timeSlotLabels[slot]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Start / End Addresses with visual connector */}
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <div className="mt-7 flex flex-col items-center gap-0.5">
            <span className="h-3 w-3 rounded-full border-2 border-green-500 bg-green-400" />
            <span className="h-10 w-0.5 bg-gradient-to-b from-green-300 to-red-300" />
            <span className="h-3 w-3 rounded-full border-2 border-red-500 bg-red-400" />
          </div>
          <div className="flex-1 space-y-2">
            <AddressAutocompleteInput
              label="Başlangıç noktası"
              value={createStartAddress}
              placeholder="Kadıköy İskele, Merkez..."
              maxLength={256}
              selectedSuggestion={createStartSuggestion}
              required
              onValueChange={onSetCreateStartAddress}
              onSelectSuggestion={onSelectCreateStartSuggestion}
            />
            <AddressAutocompleteInput
              label="Bitiş noktası"
              value={createEndAddress}
              placeholder="Gebze Otogar, Merkez..."
              maxLength={256}
              selectedSuggestion={createEndSuggestion}
              required
              onValueChange={onSetCreateEndAddress}
              onSelectSuggestion={onSelectCreateEndSuggestion}
            />
          </div>
        </div>
      </div>

      {/* Guest tracking */}
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50">
        <input
          type="checkbox"
          checked={createAllowGuestTracking}
          onChange={(e) => onSetCreateAllowGuestTracking(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        Misafir takip açık
      </label>

      {/* Validation */}
      {showCreateValidation && createValidationIssues.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
          {createValidationIssues.map((issue) => (
            <div key={issue} className="flex items-center gap-1.5">
              <span className="text-amber-500">●</span> {issue}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCreateRoute}
          disabled={!canCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createPending ? (
            <>
              <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Oluşturuluyor...
            </>
          ) : (
            "Rotayı Oluştur"
          )}
        </button>
        <button
          type="button"
          onClick={onResetCreateForm}
          className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
        >
          Temizle
        </button>
      </div>
    </div>
  );
}

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
    midday: "Oglen",
    evening: "Aksam",
    custom: "Ozel",
  };

  return (
    <section className="glass-panel rounded-2xl p-4">
      <div className="mb-2 text-sm font-semibold text-slate-900">Yeni rota olustur</div>
      {canMutate ? (
        <>
          <p className="mb-3 text-xs text-muted">
            Baslangic ve bitis noktalarini yazarak sec. Sistem once kayitli adresleri onerir,
            gerekirse harita onerileriyle tamamlar.
          </p>
          <div className="mb-3 rounded-xl border border-[#d8e5f3] bg-[#f6f9ff] p-3 text-xs text-[#49627e]">
            Maliyet notu: Onerilerde once kayitli adresler gosterilir, harita sorgusu sadece gerekli
            oldugunda devreye girer.
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <label className="space-y-1 text-xs font-semibold text-slate-700">
              <span>Rota adi</span>
              <input
                type="text"
                value={createName}
                onChange={(event) => onSetCreateName(event.target.value)}
                maxLength={80}
                placeholder="Ornek: Sabah Levent Hatti"
                className="glass-input w-full rounded-xl px-3 py-2 text-sm font-normal text-slate-900"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold text-slate-700">
              <span>Planlanan cikis saati</span>
              <input
                type="time"
                value={createScheduledTime}
                onChange={(event) => onSetCreateScheduledTime(event.target.value)}
                className="glass-input w-full rounded-xl px-3 py-2 text-sm font-normal text-slate-900"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold text-slate-700">
              <span>Zaman dilimi</span>
              <select
                value={createTimeSlot}
                onChange={(event) => onSetCreateTimeSlot(event.target.value as RouteTimeSlotOption)}
                className="glass-input w-full rounded-xl px-3 py-2 text-sm font-normal text-slate-900"
              >
                {timeSlotOptions.map((slot) => (
                  <option key={slot} value={slot}>
                    {timeSlotLabels[slot]}
                  </option>
                ))}
              </select>
            </label>
            <label className="glass-input inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-900">
              <input
                type="checkbox"
                checked={createAllowGuestTracking}
                onChange={(event) => onSetCreateAllowGuestTracking(event.target.checked)}
              />
              Misafir takip acik
            </label>
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="glass-panel-muted space-y-2 rounded-xl p-3">
              <div className="text-xs font-semibold text-slate-700">Baslangic noktasi</div>
              <AddressAutocompleteInput
                label="Adres"
                value={createStartAddress}
                placeholder="Ornek: Kadikoy Iskele"
                maxLength={256}
                selectedSuggestion={createStartSuggestion}
                required
                onValueChange={onSetCreateStartAddress}
                onSelectSuggestion={onSelectCreateStartSuggestion}
              />
            </div>
            <div className="glass-panel-muted space-y-2 rounded-xl p-3">
              <div className="text-xs font-semibold text-slate-700">Bitis noktasi</div>
              <AddressAutocompleteInput
                label="Adres"
                value={createEndAddress}
                placeholder="Ornek: Levent Metro"
                maxLength={256}
                selectedSuggestion={createEndSuggestion}
                required
                onValueChange={onSetCreateEndAddress}
                onSelectSuggestion={onSelectCreateEndSuggestion}
              />
            </div>
          </div>
          {showCreateValidation && createValidationIssues.length > 0 ? (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <div className="font-semibold">Rota olusturmadan once tamamlanmasi gerekenler:</div>
              <div className="mt-1 space-y-1">
                {createValidationIssues.map((issue) => (
                  <div key={issue}>- {issue}</div>
                ))}
              </div>
            </div>
          ) : null}
          <div className="mt-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onCreateRoute}
                disabled={!canCreate}
                className="glass-button-primary inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createPending ? "Olusturuluyor..." : "Rotayi olustur"}
              </button>
              <button
                type="button"
                onClick={onResetCreateForm}
                className="glass-button inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold"
              >
                Formu temizle
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Bu rolde rota olusturma/guncelleme kapali. Sadece rota ve duraklar goruntulenir.
        </div>
      )}
    </section>
  );
}

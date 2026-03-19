"use client";

import { useState } from "react";

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
  createIntermediateStopQuery: string;
  createIntermediateStopSuggestion: AddressSuggestion | null;
  createIntermediateStops: AddressSuggestion[];
  createTimeSlot: RouteTimeSlotOption;
  createAllowGuestTracking: boolean;
  createPending: boolean;
  canCreate: boolean;
  showCreateValidation: boolean;
  createValidationIssues: string[];
  timeSlotOptions: RouteTimeSlotOption[];
  canCopyFromSelectedRoute?: boolean;
  surface?: "panel" | "plain";
  onSetCreateName: (value: string) => void;
  onSetCreateScheduledTime: (value: string) => void;
  onSetCreateStartAddress: (value: string) => void;
  onSetCreateEndAddress: (value: string) => void;
  onSetCreateIntermediateStopQuery: (value: string) => void;
  onSelectCreateStartSuggestion: (suggestion: AddressSuggestion) => void;
  onSelectCreateEndSuggestion: (suggestion: AddressSuggestion) => void;
  onSelectCreateIntermediateStopSuggestion: (suggestion: AddressSuggestion) => void;
  onSetCreateTimeSlot: (value: Exclude<CompanyRouteTimeSlot, null>) => void;
  onSetCreateAllowGuestTracking: (checked: boolean) => void;
  onCreateRoute: () => void;
  onResetCreateForm: () => void;
  onSwapCreateEndpoints: () => void;
  onApplyRouteTemplate: () => void;
  onCopySelectedRouteToDraft: () => void;
  onAddCreateIntermediateStop: () => void;
  onRemoveCreateIntermediateStop: (index: number) => void;
  onReorderCreateIntermediateStop: (fromIndex: number, toIndex: number) => void;
};

function StepBadge({ label, done }: { label: string; done: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        done
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      {label}
    </span>
  );
}

export function RouteCreateSection({
  canMutate,
  createName,
  createScheduledTime,
  createStartAddress,
  createEndAddress,
  createStartSuggestion,
  createEndSuggestion,
  createIntermediateStopQuery,
  createIntermediateStopSuggestion,
  createIntermediateStops,
  createTimeSlot,
  createAllowGuestTracking,
  createPending,
  canCreate,
  showCreateValidation,
  createValidationIssues,
  timeSlotOptions,
  canCopyFromSelectedRoute = false,
  surface = "panel",
  onSetCreateName,
  onSetCreateScheduledTime,
  onSetCreateStartAddress,
  onSetCreateEndAddress,
  onSetCreateIntermediateStopQuery,
  onSelectCreateStartSuggestion,
  onSelectCreateEndSuggestion,
  onSelectCreateIntermediateStopSuggestion,
  onSetCreateTimeSlot,
  onSetCreateAllowGuestTracking,
  onCreateRoute,
  onResetCreateForm,
  onSwapCreateEndpoints,
  onApplyRouteTemplate,
  onCopySelectedRouteToDraft,
  onAddCreateIntermediateStop,
  onRemoveCreateIntermediateStop,
  onReorderCreateIntermediateStop,
}: Props) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const timeSlotLabels: Record<RouteTimeSlotOption, string> = {
    morning: "Sabah",
    midday: "Öğlen",
    evening: "Akşam",
    custom: "Özel",
  };

  const hasName = createName.trim().length >= 2;
  const hasStart = Boolean(createStartSuggestion);
  const hasEnd = Boolean(createEndSuggestion);
  const timeValid = /^([01]\d|2[0-3]):[0-5]\d$/.test(createScheduledTime.trim());
  const containerClassName =
    surface === "plain" ? "rounded-2xl bg-transparent p-0" : "glass-panel rounded-2xl p-5";

  if (!canMutate) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        Bu rolde rota oluşturma ve güncelleme kapalı. Sadece rota ve duraklar görüntülenir.
      </div>
    );
  }

  return (
    <section className={containerClassName}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <StepBadge label="1. Temel bilgi" done={hasName && timeValid} />
        <StepBadge label="2. Noktaları seç" done={hasStart && hasEnd} />
        <StepBadge label="3. Rotayı oluştur" done={canCreate} />
      </div>

      <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        Rota önce plan olarak açılır. Şoför ve araç atamasını daha sonra tek yerden yönetebilirsin.
      </div>

      <div className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_140px_150px]">
          <label className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Rota adı</span>
            <input
              type="text"
              value={createName}
              onChange={(event) => onSetCreateName(event.target.value)}
              maxLength={80}
              placeholder="Sabah Merkez Ring"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Çıkış saati</span>
            <input
              type="time"
              value={createScheduledTime}
              onChange={(event) => onSetCreateScheduledTime(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Zaman dilimi</span>
            <select
              value={createTimeSlot}
              onChange={(event) => onSetCreateTimeSlot(event.target.value as RouteTimeSlotOption)}
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

        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="mt-7 flex flex-col items-center gap-0.5">
              <span className="h-3 w-3 rounded-full border-2 border-green-500 bg-green-400" />
              <span className="h-10 w-0.5 bg-gradient-to-b from-green-300 to-blue-300" />
              <span className="h-3 w-3 rounded-full border-2 border-blue-500 bg-blue-400" />
              <span className="h-10 w-0.5 bg-gradient-to-b from-blue-300 to-red-300" />
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

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[220px] flex-1">
                    <AddressAutocompleteInput
                      label="Ara durak (opsiyonel)"
                      value={createIntermediateStopQuery}
                      placeholder="Mecidiyeköy, Beşiktaş..."
                      maxLength={256}
                      selectedSuggestion={createIntermediateStopSuggestion}
                      onValueChange={onSetCreateIntermediateStopQuery}
                      onSelectSuggestion={onSelectCreateIntermediateStopSuggestion}
                      onEnterPressed={onAddCreateIntermediateStop}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={onAddCreateIntermediateStop}
                    disabled={!createIntermediateStopSuggestion}
                    className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Durak ekle
                  </button>
                </div>

                {createIntermediateStops.length > 0 ? (
                  <div className="mt-2">
                    <p className="mb-1 text-[11px] text-slate-500">
                      Durakları sürükleyip bırakarak sırayı değiştirebilirsin.
                    </p>
                    <div className="overflow-x-auto pb-1">
                      <div className="inline-flex min-w-max items-center gap-2">
                        {createIntermediateStops.map((stop, index) => (
                          <div
                            key={`${stop.id}-${index}`}
                            draggable
                            onDragStart={() => {
                              setDraggingIndex(index);
                              setDragOverIndex(index);
                            }}
                            onDragOver={(event) => {
                              event.preventDefault();
                              setDragOverIndex(index);
                            }}
                            onDrop={(event) => {
                              event.preventDefault();
                              if (draggingIndex === null || draggingIndex === index) {
                                return;
                              }
                              onReorderCreateIntermediateStop(draggingIndex, index);
                              setDraggingIndex(null);
                              setDragOverIndex(null);
                            }}
                            onDragEnd={() => {
                              setDraggingIndex(null);
                              setDragOverIndex(null);
                            }}
                            className={`inline-flex max-w-[300px] items-center gap-2 rounded-lg border bg-white px-2.5 py-1.5 text-xs ${
                              dragOverIndex === index
                                ? "border-blue-300 ring-2 ring-blue-100"
                                : "border-slate-200"
                            }`}
                          >
                            <button
                              type="button"
                              className="cursor-grab text-slate-400 active:cursor-grabbing"
                              aria-label={`${index + 1}. durak sürükleme tutacağı`}
                            >
                              ⋮⋮
                            </button>
                            <span className="truncate text-slate-700">
                              {index + 1}. {stop.label}
                            </span>
                            <button
                              type="button"
                              onClick={() => onRemoveCreateIntermediateStop(index)}
                              className="rounded border border-rose-200 px-1.5 py-0.5 text-[10px] text-rose-600"
                            >
                              Sil
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onSwapCreateEndpoints}
                  className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Başlangıç ↔ Bitiş değiştir
                </button>
              </div>

              <AddressAutocompleteInput
                label="Bitiş noktası"
                value={createEndAddress}
                placeholder="Levent, Beşiktaş..."
                maxLength={256}
                selectedSuggestion={createEndSuggestion}
                required
                onValueChange={onSetCreateEndAddress}
                onSelectSuggestion={onSelectCreateEndSuggestion}
              />
            </div>
          </div>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50">
          <input
            type="checkbox"
            checked={createAllowGuestTracking}
            onChange={(event) => onSetCreateAllowGuestTracking(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Misafir takip açık
        </label>

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
          <div className="font-semibold text-slate-900">Eksik kontrolü</div>
          <div className="mt-1.5 grid gap-1 sm:grid-cols-2">
            <div>{hasName ? "✓" : "•"} Rota adı en az 2 karakter</div>
            <div>{timeValid ? "✓" : "•"} Saat formatı HH:mm</div>
            <div>{hasStart ? "✓" : "•"} Başlangıç listeden seçildi</div>
            <div>{hasEnd ? "✓" : "•"} Bitiş listeden seçildi</div>
            <div>{createIntermediateStops.length > 0 ? "✓" : "•"} Ara durak: {createIntermediateStops.length}</div>
            <div>✓ Şoför ve araç ataması sonra yapılır</div>
          </div>
        </div>

        {showCreateValidation && createValidationIssues.length > 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
            {createValidationIssues.map((issue) => (
              <div key={issue}>• {issue}</div>
            ))}
          </div>
        ) : null}

        <div className="space-y-2 pt-1">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <button
              type="button"
              onClick={onCreateRoute}
              disabled={createPending || !canMutate}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createPending ? (
                <>
                  <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Oluşturuluyor...
                </>
              ) : (
                "Rotayı oluştur"
              )}
            </button>

            <button
              type="button"
              onClick={onResetCreateForm}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
            >
              Temizle
            </button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onApplyRouteTemplate}
              className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
            >
              Örnek rota doldur
            </button>

            <button
              type="button"
              onClick={onCopySelectedRouteToDraft}
              disabled={!canCopyFromSelectedRoute}
              className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Seçili rotayı kopyala
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

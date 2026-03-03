"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";

import { AddressAutocompleteInput } from "@/components/dashboard/route-address-autocomplete-input";
import { RouteCreationMapPreview } from "@/components/dashboard/route-creation-map-preview";
import {
  type RouteWaypoint,
  calculateRouteDistances,
  formatDistanceKm,
} from "@/components/dashboard/route-distance-helpers";
import type { AddressSuggestion } from "@/components/dashboard/use-address-autocomplete";
import { isValidRouteTime } from "@/components/dashboard/route-time-validation";
import {
  createCompanyRouteCallable,
  mapCompanyCallableErrorToMessage,
  upsertCompanyRouteStopCallable,
} from "@/features/company/company-callables";

// ─── Types ───────────────────────────────────────────────────────────

type Props = {
  companyId: string;
  onCreated?: (created: { routeId: string; srvCode: string }) => Promise<void> | void;
  onCancel?: () => void;
};

type PointState = {
  address: string;
  lat: number | null;
  lng: number | null;
  resolved: boolean;
};

type StopEntry = {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  resolved: boolean;
};

type WizardStep = "details" | "route" | "review";

const EMPTY_POINT: PointState = { address: "", lat: null, lng: null, resolved: false };

function makeStopId(): string {
  return `stop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Icons ───────────────────────────────────────────────────────────

function IconMapPin({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function IconChevronUp({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  );
}

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function IconRoute({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────

export function RouteCreateWizardForm({ companyId, onCreated, onCancel }: Props) {
  // Form state
  const [name, setName] = useState("");
  const [scheduledTime, setScheduledTime] = useState("08:00");
  const [timeSlot, setTimeSlot] = useState<"morning" | "midday" | "evening" | "custom">("morning");
  const [allowGuestTracking, setAllowGuestTracking] = useState(true);

  const [startPoint, setStartPoint] = useState<PointState>(EMPTY_POINT);
  const [endPoint, setEndPoint] = useState<PointState>(EMPTY_POINT);
  const [stops, setStops] = useState<StopEntry[]>([]);

  const [step, setStep] = useState<WizardStep>("details");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [creationProgress, setCreationProgress] = useState("");

  // ─── Derived ─────────────────────────────────────────────────────

  const isTimeValid = isValidRouteTime(scheduledTime);
  const isDetailsValid = name.trim().length >= 2 && isTimeValid;
  const isStartValid = startPoint.resolved && startPoint.lat !== null;
  const isEndValid = endPoint.resolved && endPoint.lat !== null;
  const resolvedStops = stops.filter((s) => s.resolved && s.lat !== null);
  const isRouteValid = isStartValid && isEndValid;

  const waypoints = useMemo<RouteWaypoint[]>(() => {
    const result: RouteWaypoint[] = [];

    if (startPoint.resolved && startPoint.lat !== null && startPoint.lng !== null) {
      result.push({
        id: "start",
        label: startPoint.address || "Başlangıç",
        lat: startPoint.lat,
        lng: startPoint.lng,
        type: "start",
      });
    }

    for (const stop of stops) {
      if (stop.resolved && stop.lat !== null && stop.lng !== null) {
        result.push({
          id: stop.id,
          label: stop.name || stop.address || `Durak`,
          lat: stop.lat,
          lng: stop.lng,
          type: "stop",
        });
      }
    }

    if (endPoint.resolved && endPoint.lat !== null && endPoint.lng !== null) {
      result.push({
        id: "end",
        label: endPoint.address || "Bitiş",
        lat: endPoint.lat,
        lng: endPoint.lng,
        type: "end",
      });
    }

    return result;
  }, [startPoint, endPoint, stops]);

  const { totalKm } = calculateRouteDistances(waypoints);

  const canSubmit =
    !pending && isDetailsValid && isRouteValid;

  // ─── Handlers ────────────────────────────────────────────────────

  const handleAddStop = useCallback(() => {
    setStops((prev) => [
      ...prev,
      { id: makeStopId(), name: "", address: "", lat: null, lng: null, resolved: false },
    ]);
  }, []);

  const handleRemoveStop = useCallback((stopId: string) => {
    setStops((prev) => prev.filter((s) => s.id !== stopId));
  }, []);

  const handleStopAddressSelect = useCallback((stopId: string, suggestion: AddressSuggestion) => {
    setStops((prev) =>
      prev.map((s) =>
        s.id === stopId
          ? {
              ...s,
              address: suggestion.shortName,
              lat: suggestion.lat,
              lng: suggestion.lng,
              resolved: true,
              name: s.name || suggestion.shortName.split(",")[0].trim(),
            }
          : s,
      ),
    );
  }, []);

  const handleStopNameChange = useCallback((stopId: string, newName: string) => {
    setStops((prev) =>
      prev.map((s) => (s.id === stopId ? { ...s, name: newName } : s)),
    );
  }, []);

  const handleMoveStop = useCallback((stopId: string, direction: "up" | "down") => {
    setStops((prev) => {
      const index = prev.findIndex((s) => s.id === stopId);
      if (index < 0) return prev;
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
      return next;
    });
  }, []);

  const handleStartSelect = useCallback((suggestion: AddressSuggestion) => {
    setStartPoint({
      address: suggestion.shortName,
      lat: suggestion.lat,
      lng: suggestion.lng,
      resolved: true,
    });
  }, []);

  const handleEndSelect = useCallback((suggestion: AddressSuggestion) => {
    setEndPoint({
      address: suggestion.shortName,
      lat: suggestion.lat,
      lng: suggestion.lng,
      resolved: true,
    });
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!canSubmit) return;

      setPending(true);
      setError(null);
      setSuccessMessage(null);
      setCreationProgress("Rota oluşturuluyor...");

      try {
        const idempotencyKey =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `route-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

        // Step 1: Create the route
        const result = await createCompanyRouteCallable({
          companyId,
          name: name.trim(),
          startPoint: { lat: startPoint.lat!, lng: startPoint.lng! },
          startAddress: startPoint.address.trim() || "Baslangic",
          endPoint: { lat: endPoint.lat!, lng: endPoint.lng! },
          endAddress: endPoint.address.trim() || "Bitis",
          scheduledTime,
          timeSlot,
          allowGuestTracking,
          authorizedDriverIds: [],
          idempotencyKey,
        });

        // Step 2: Create stops
        const validStops = stops.filter(
          (s) => s.resolved && s.lat !== null && s.lng !== null && s.name.trim().length >= 2,
        );

        if (validStops.length > 0) {
          setCreationProgress(`Rota oluşturuldu. ${validStops.length} durak ekleniyor...`);

          for (let i = 0; i < validStops.length; i++) {
            const stop = validStops[i];
            setCreationProgress(
              `Durak ekleniyor (${i + 1}/${validStops.length}): ${stop.name}`,
            );

            try {
              await upsertCompanyRouteStopCallable({
                companyId,
                routeId: result.routeId,
                name: stop.name.trim(),
                order: i,
                location: { lat: stop.lat!, lng: stop.lng! },
              });
            } catch (stopErr) {
              console.warn(`Durak eklenemedi: ${stop.name}`, stopErr);
              // Continue with other stops
            }
          }
        }

        setSuccessMessage(
          `Rota "${name.trim()}" oluşturuldu (${result.srvCode})${validStops.length > 0 ? ` · ${validStops.length} durak eklendi` : ""}`,
        );
        setCreationProgress("");

        // Reset form
        setName("");
        setScheduledTime("08:00");
        setTimeSlot("morning");
        setStartPoint(EMPTY_POINT);
        setEndPoint(EMPTY_POINT);
        setStops([]);
        setStep("details");

        if (onCreated) {
          await onCreated({ routeId: result.routeId, srvCode: result.srvCode });
        }
      } catch (nextError) {
        setError(mapCompanyCallableErrorToMessage(nextError));
        setCreationProgress("");
      } finally {
        setPending(false);
      }
    },
    [
      canSubmit,
      companyId,
      name,
      startPoint,
      endPoint,
      scheduledTime,
      timeSlot,
      allowGuestTracking,
      stops,
      onCreated,
    ],
  );

  // ─── Step navigation ─────────────────────────────────────────────

  const stepLabels: { key: WizardStep; label: string; completed: boolean }[] = [
    { key: "details", label: "Rota Bilgileri", completed: isDetailsValid },
    { key: "route", label: "Güzergah", completed: isRouteValid },
    { key: "review", label: "Önizleme", completed: false },
  ];

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <section className="rounded-2xl border border-line bg-white shadow-sm">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50">
            <IconRoute className="h-5 w-5 text-brand-600" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-slate-900">Yeni Rota Oluştur</h3>
            <p className="text-xs text-slate-500">
              Adres arayarak kolay rota ve durak tanımlayın
            </p>
          </div>
        </div>
        <svg
          className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded ? (
        <form onSubmit={handleSubmit}>
          {/* Step indicator */}
          <div className="border-t border-line px-5 py-3">
            <div className="flex items-center gap-1">
              {stepLabels.map((s, i) => (
                <div key={s.key} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setStep(s.key)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      step === s.key
                        ? "bg-brand-50 text-brand-700"
                        : s.completed
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                        step === s.key
                          ? "bg-brand-600 text-white"
                          : s.completed
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {s.completed && step !== s.key ? "✓" : i + 1}
                    </span>
                    {s.label}
                  </button>
                  {i < stepLabels.length - 1 ? (
                    <span className="mx-0.5 text-slate-300">›</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5 border-t border-line p-5 lg:grid-cols-2">
            {/* Left: Form inputs */}
            <div className="space-y-4">
              {/* Step 1: Details */}
              {step === "details" ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-slate-800">Rota Bilgileri</h4>
                    <div className="space-y-3">
                      <label className="block space-y-1">
                        <span className="text-xs font-medium text-slate-700">Rota Adı *</span>
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="ör: Sabah Vardiya A, Öğle Servisi"
                          className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors hover:border-slate-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                        />
                      </label>

                      <div className="grid grid-cols-2 gap-3">
                        <label className="block space-y-1">
                          <span className="text-xs font-medium text-slate-700">Kalkış Saati *</span>
                          <input
                            type="time"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            className={`w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors ${
                              isTimeValid
                                ? "border border-line focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                                : "border border-rose-300 focus:border-rose-400"
                            }`}
                          />
                        </label>

                        <label className="block space-y-1">
                          <span className="text-xs font-medium text-slate-700">Zaman Dilimi</span>
                          <select
                            value={timeSlot}
                            onChange={(e) =>
                              setTimeSlot(e.target.value as typeof timeSlot)
                            }
                            className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors hover:border-slate-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                          >
                            <option value="morning">Sabah</option>
                            <option value="midday">Öğle</option>
                            <option value="evening">Akşam</option>
                            <option value="custom">Özel</option>
                          </select>
                        </label>
                      </div>

                      <label className="flex items-center gap-2.5 rounded-xl border border-line bg-slate-50 px-3 py-2.5 text-sm text-slate-800 transition-colors hover:bg-slate-100">
                        <input
                          type="checkbox"
                          checked={allowGuestTracking}
                          onChange={(e) => setAllowGuestTracking(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-brand-600"
                        />
                        Misafir takip linki açık olsun
                      </label>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          disabled={!isDetailsValid}
                          onClick={() => setStep("route")}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          Devam
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Step 2: Route points */}
              {step === "route" ? (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-800">Güzergah Noktaları</h4>

                  {/* Start Point */}
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-[10px] font-bold text-white">
                        B
                      </span>
                      <span className="text-xs font-semibold text-green-800">Başlangıç Noktası</span>
                      {isStartValid ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                          ✓ Seçildi
                        </span>
                      ) : null}
                    </div>
                    <AddressAutocompleteInput
                      label=""
                      placeholder="Başlangıç adresi arayın..."
                      value={startPoint.address}
                      onAddressSelect={handleStartSelect}
                      onValueChange={(v) =>
                        setStartPoint((prev) => ({
                          ...prev,
                          address: v,
                          resolved: false,
                          lat: null,
                          lng: null,
                        }))
                      }
                      icon={<IconMapPin className="h-4 w-4" />}
                      required
                    />
                    {isStartValid ? (
                      <div className="mt-1.5 text-[11px] text-slate-500">
                        {startPoint.lat!.toFixed(5)}, {startPoint.lng!.toFixed(5)}
                      </div>
                    ) : null}
                  </div>

                  {/* Stops */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">
                        Ara Duraklar ({stops.length})
                      </span>
                      <button
                        type="button"
                        onClick={handleAddStop}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                      >
                        <IconPlus className="h-3.5 w-3.5" />
                        Durak Ekle
                      </button>
                    </div>

                    {stops.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center">
                        <IconMapPin className="mx-auto mb-2 h-6 w-6 text-slate-300" />
                        <p className="text-xs text-slate-500">
                          Henüz durak eklenmedi. Durakları eklemek isteğe bağlıdır.
                        </p>
                        <button
                          type="button"
                          onClick={handleAddStop}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                        >
                          <IconPlus className="h-3.5 w-3.5" /> İlk durağı ekle
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {stops.map((stop, index) => (
                          <div
                            key={stop.id}
                            className="rounded-xl border border-blue-100 bg-blue-50/30 p-3"
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                                  {index + 1}
                                </span>
                                <span className="text-xs font-medium text-blue-800">
                                  Durak {index + 1}
                                </span>
                                {stop.resolved ? (
                                  <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                                    ✓
                                  </span>
                                ) : null}
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={index === 0}
                                  onClick={() => handleMoveStop(stop.id, "up")}
                                  className="rounded-md p-1 text-slate-400 transition-colors hover:bg-white hover:text-slate-600 disabled:opacity-30"
                                  title="Yukarı taşı"
                                >
                                  <IconChevronUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={index === stops.length - 1}
                                  onClick={() => handleMoveStop(stop.id, "down")}
                                  className="rounded-md p-1 text-slate-400 transition-colors hover:bg-white hover:text-slate-600 disabled:opacity-30"
                                  title="Aşağı taşı"
                                >
                                  <IconChevronDown className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStop(stop.id)}
                                  className="rounded-md p-1 text-rose-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                  title="Durağı sil"
                                >
                                  <IconTrash className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="block space-y-1">
                                <span className="text-[11px] font-medium text-slate-600">
                                  Durak Adı
                                </span>
                                <input
                                  value={stop.name}
                                  onChange={(e) => handleStopNameChange(stop.id, e.target.value)}
                                  placeholder="ör: Okul Önü, AVM Durağı"
                                  className="w-full rounded-lg border border-line bg-white px-2.5 py-2 text-sm text-slate-900 outline-none transition-colors hover:border-slate-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                                />
                              </label>
                              <AddressAutocompleteInput
                                label="Konum"
                                placeholder="Durak adresini arayın..."
                                value={stop.address}
                                onAddressSelect={(s) => handleStopAddressSelect(stop.id, s)}
                                onValueChange={(v) =>
                                  setStops((prev) =>
                                    prev.map((s) =>
                                      s.id === stop.id
                                        ? { ...s, address: v, resolved: false, lat: null, lng: null }
                                        : s,
                                    ),
                                  )
                                }
                                icon={<IconMapPin className="h-3.5 w-3.5" />}
                              />
                              {stop.resolved && stop.lat !== null ? (
                                <div className="text-[10px] text-slate-400">
                                  {stop.lat.toFixed(5)}, {stop.lng!.toFixed(5)}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* End Point */}
                  <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                        S
                      </span>
                      <span className="text-xs font-semibold text-red-800">Bitiş Noktası</span>
                      {isEndValid ? (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-700">
                          ✓ Seçildi
                        </span>
                      ) : null}
                    </div>
                    <AddressAutocompleteInput
                      label=""
                      placeholder="Bitiş adresi arayın..."
                      value={endPoint.address}
                      onAddressSelect={handleEndSelect}
                      onValueChange={(v) =>
                        setEndPoint((prev) => ({
                          ...prev,
                          address: v,
                          resolved: false,
                          lat: null,
                          lng: null,
                        }))
                      }
                      icon={<IconMapPin className="h-4 w-4" />}
                      required
                    />
                    {isEndValid ? (
                      <div className="mt-1.5 text-[11px] text-slate-500">
                        {endPoint.lat!.toFixed(5)}, {endPoint.lng!.toFixed(5)}
                      </div>
                    ) : null}
                  </div>

                  {/* Distance summary */}
                  {waypoints.length >= 2 ? (
                    <div className="flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3">
                      <IconRoute className="h-5 w-5 text-brand-600" />
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {formatDistanceKm(totalKm)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {waypoints.length} nokta · kuş uçuşu mesafe
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setStep("details")}
                      className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      ← Geri
                    </button>
                    <button
                      type="button"
                      disabled={!isRouteValid}
                      onClick={() => setStep("review")}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      Önizleme
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Step 3: Review */}
              {step === "review" ? (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-800">Rota Özeti</h4>

                  <div className="rounded-xl border border-line bg-slate-50 p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Rota Adı</span>
                        <span className="text-sm font-semibold text-slate-900">{name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Kalkış Saati</span>
                        <span className="text-sm font-medium text-slate-900">{scheduledTime}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Zaman Dilimi</span>
                        <span className="text-sm font-medium text-slate-900">
                          {{ morning: "Sabah", midday: "Öğle", evening: "Akşam", custom: "Özel" }[timeSlot]}
                        </span>
                      </div>
                      <div className="border-t border-line pt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">Başlangıç</span>
                          <span className="max-w-[200px] truncate text-right text-sm text-slate-900">
                            {startPoint.address}
                          </span>
                        </div>
                      </div>
                      {resolvedStops.length > 0 ? (
                        <div className="space-y-1.5">
                          {resolvedStops.map((stop, i) => (
                            <div key={stop.id} className="flex items-center justify-between">
                              <span className="text-xs text-slate-500">Durak {i + 1}</span>
                              <span className="max-w-[200px] truncate text-right text-sm text-slate-900">
                                {stop.name || stop.address}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Bitiş</span>
                        <span className="max-w-[200px] truncate text-right text-sm text-slate-900">
                          {endPoint.address}
                        </span>
                      </div>
                      {waypoints.length >= 2 ? (
                        <div className="flex items-center justify-between border-t border-line pt-3">
                          <span className="text-xs font-medium text-slate-600">Toplam Mesafe</span>
                          <span className="text-sm font-bold text-brand-700">
                            {formatDistanceKm(totalKm)}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setStep("route")}
                      className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      ← Düzenle
                    </button>
                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {pending ? (
                        <>
                          <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Oluşturuluyor...
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Rotayı Oluştur
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Right: Map preview */}
            <div className="space-y-3">
              <RouteCreationMapPreview waypoints={waypoints} height="480px" />
              {waypoints.length >= 2 && waypoints.length > 2 ? (
                <div className="space-y-1.5 rounded-xl border border-line bg-slate-50 p-3">
                  <div className="text-xs font-semibold text-slate-700">Etap Detayları</div>
                  {(() => {
                    const { segmentDistances: segments } = calculateRouteDistances(waypoints);
                    return segments.map((seg, i) => {
                      const fromWp = waypoints.find((wp) => wp.id === seg.from);
                      const toWp = waypoints.find((wp) => wp.id === seg.to);
                      return (
                        <div
                          key={`${seg.from}-${seg.to}`}
                          className="flex items-center justify-between text-[11px]"
                        >
                          <span className="truncate text-slate-600">
                            {fromWp?.label ?? "?"} → {toWp?.label ?? "?"}
                          </span>
                          <span className="ml-2 flex-shrink-0 font-medium text-slate-900">
                            {formatDistanceKm(seg.km)}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : null}
            </div>
          </div>

          {/* Messages */}
          {creationProgress ? (
            <div className="border-t border-line px-5 py-3">
              <div className="flex items-center gap-2 text-xs text-brand-700">
                <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                {creationProgress}
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="border-t border-line px-5 py-3">
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                {error}
              </div>
            </div>
          ) : null}

          {successMessage ? (
            <div className="border-t border-line px-5 py-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                {successMessage}
              </div>
            </div>
          ) : null}
        </form>
      ) : null}
    </section>
  );
}

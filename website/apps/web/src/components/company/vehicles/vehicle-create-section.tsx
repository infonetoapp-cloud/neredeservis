"use client";

type Props = {
  canMutate: boolean;
  createPlate: string;
  createLabel: string;
  createCapacity: string;
  createPending: boolean;
  canCreate: boolean;
  onSetCreatePlate: (value: string) => void;
  onSetCreateLabel: (value: string) => void;
  onSetCreateCapacity: (value: string) => void;
  onCreateVehicle: () => void;
};

export function VehicleCreateSection({
  canMutate,
  createPlate,
  createLabel,
  createCapacity,
  createPending,
  canCreate,
  onSetCreatePlate,
  onSetCreateLabel,
  onSetCreateCapacity,
  onCreateVehicle,
}: Props) {
  return (
    <section className="glass-panel rounded-2xl p-4">
      <div className="mb-2 text-sm font-semibold text-slate-900">Yeni arac ekle</div>
      {canMutate ? (
        <div className="grid gap-2 md:grid-cols-[180px_1fr_140px_120px]">
          <input
            type="text"
            value={createPlate}
            onChange={(event) => onSetCreatePlate(event.target.value)}
            placeholder="34ABC123"
            className="glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-900"
          />
          <input
            type="text"
            value={createLabel}
            onChange={(event) => onSetCreateLabel(event.target.value)}
            placeholder="Servis Minibus 1"
            className="glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-900"
          />
          <input
            type="number"
            min={1}
            max={120}
            value={createCapacity}
            onChange={(event) => onSetCreateCapacity(event.target.value)}
            placeholder="Kapasite"
            className="glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-900"
          />
          <button
            type="button"
            onClick={onCreateVehicle}
            disabled={!canCreate}
            className="glass-button-primary inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createPending ? "Ekleniyor..." : "Arac Ekle"}
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Bu rolde arac ekleme/guncelleme kapali. Sadece arac listesi goruntulenir.
        </div>
      )}
    </section>
  );
}

"use client";

type Props = {
  canMutate: boolean;
  createPlate: string;
  createBrand: string;
  createModel: string;
  createYear: string;
  createCapacity: string;
  createPending: boolean;
  canCreate: boolean;
  onSetCreatePlate: (value: string) => void;
  onSetCreateBrand: (value: string) => void;
  onSetCreateModel: (value: string) => void;
  onSetCreateYear: (value: string) => void;
  onSetCreateCapacity: (value: string) => void;
  onCreateVehicle: () => void;
};

export function VehicleCreateSection({
  canMutate,
  createPlate,
  createBrand,
  createModel,
  createYear,
  createCapacity,
  createPending,
  canCreate,
  onSetCreatePlate,
  onSetCreateBrand,
  onSetCreateModel,
  onSetCreateYear,
  onSetCreateCapacity,
  onCreateVehicle,
}: Props) {
  return (
    <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 text-sm font-semibold text-slate-900">Yeni araç ekle</div>
      {canMutate ? (
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="text"
              value={createPlate}
              onChange={(event) => onSetCreatePlate(event.target.value)}
              placeholder="34ABC123"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <input
              type="text"
              value={createBrand}
              onChange={(event) => onSetCreateBrand(event.target.value)}
              placeholder="Marka"
              maxLength={80}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <input
              type="text"
              value={createModel}
              onChange={(event) => onSetCreateModel(event.target.value)}
              placeholder="Model"
              maxLength={80}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={1900}
                max={2100}
                value={createYear}
                onChange={(event) => onSetCreateYear(event.target.value)}
                placeholder="Yıl"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <input
                type="number"
                min={1}
                max={200}
                value={createCapacity}
                onChange={(event) => onSetCreateCapacity(event.target.value)}
                placeholder="Kapasite"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={onCreateVehicle}
            disabled={!canCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createPending ? "Ekleniyor..." : "Araç Ekle"}
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Bu rolde araç ekleme/güncelleme kapalı. Sadece araç listesi görüntülenir.
        </div>
      )}
    </section>
  );
}

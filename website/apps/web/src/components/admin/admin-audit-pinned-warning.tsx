"use client";

type AdminAuditPinnedWarningProps = {
  visible: boolean;
  onClearPinned: () => void;
};

export function AdminAuditPinnedWarning({ visible, onClearPinned }: AdminAuditPinnedWarningProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
      <span>Secili auditId mevcut filtrede gorunmuyor. Filtreyi genislet veya kayit vurgusunu kaldir.</span>
      <button
        type="button"
        onClick={onClearPinned}
        className="rounded-lg border border-amber-200 bg-white px-2 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-100"
      >
        Vurguyu Temizle
      </button>
    </div>
  );
}

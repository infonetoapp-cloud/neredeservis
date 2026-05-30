"use client";

import {
  commandGroupBadge,
  type CommandAction,
} from "@/components/dashboard/dashboard-command-palette-helpers";

type Props = {
  query: string;
  filteredActions: readonly CommandAction[];
  effectiveActiveIndex: number;
  recentIds: ReadonlySet<string>;
  summaryText: string | null;
  hasRecentActions: boolean;
  onQueryChange: (value: string) => void;
  onArrowDown: () => void;
  onArrowUp: () => void;
  onSubmitActiveAction: () => void;
  onClose: () => void;
  onHoverIndex: (index: number) => void;
  onRunAction: (action: CommandAction) => void;
  onClearRecents: () => void;
};

export function DashboardCommandPaletteDialog({
  query,
  filteredActions,
  effectiveActiveIndex,
  recentIds,
  summaryText,
  hasRecentActions,
  onQueryChange,
  onArrowDown,
  onArrowUp,
  onSubmitActiveAction,
  onClose,
  onHoverIndex,
  onRunAction,
  onClearRecents,
}: Props) {
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-slate-950/25 px-4 pt-20 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Komut paleti"
        className="w-full max-w-xl rounded-2xl border border-line bg-white p-3 shadow-xl"
      >
        <input
          autoFocus
          type="text"
          value={query}
          aria-controls="dashboard-command-listbox"
          aria-activedescendant={
            filteredActions[effectiveActiveIndex]
              ? `command-action-${filteredActions[effectiveActiveIndex].id}`
              : undefined
          }
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              onArrowDown();
              return;
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              onArrowUp();
              return;
            }
            if (event.key === "Enter") {
              event.preventDefault();
              onSubmitActiveAction();
              return;
            }
            if (event.key === "Escape") {
              event.preventDefault();
              onClose();
            }
          }}
          placeholder="Ekran, araç veya işlem ara..."
          className="mb-2 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
        />

        <div
          id="dashboard-command-listbox"
          role="listbox"
          className="max-h-72 space-y-1 overflow-y-auto p-1"
        >
          {filteredActions.length > 0 ? (
            filteredActions.map((action, index) => {
              const badge = commandGroupBadge(action.group);
              const isRecent = recentIds.has(action.id);
              return (
                <button
                  key={action.id}
                  id={`command-action-${action.id}`}
                  type="button"
                  onClick={() => onRunAction(action)}
                  onMouseEnter={() => onHoverIndex(index)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left ${
                    index === effectiveActiveIndex ? "bg-slate-100" : "hover:bg-slate-50"
                  }`}
                >
                  <span>
                    <span className="block text-sm font-medium text-slate-900">{action.title}</span>
                    <span className="block text-xs text-muted">{action.hint}</span>
                  </span>
                  <span className="inline-flex items-center gap-2">
                    {isRecent && query.trim().length === 0 ? (
                      <span className="rounded-md border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                        Son
                      </span>
                    ) : null}
                    {badge ? (
                      <span
                        className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    ) : null}
                    <span className="text-xs font-medium text-muted">Enter</span>
                  </span>
                </button>
              );
            })
          ) : (
            <div className="rounded-xl border border-dashed border-line px-3 py-4 text-sm text-muted">
              Sonuç bulunamadı.
            </div>
          )}
        </div>

        {summaryText ? <div className="mt-2 px-1 text-xs text-muted">{summaryText}</div> : null}

        <div className="mt-2 flex items-center justify-between px-1 text-xs text-muted">
          <span>Komut paleti: hızlı ekran geçişi</span>
          <div className="inline-flex items-center gap-2">
            {hasRecentActions ? (
              <button
                type="button"
                onClick={onClearRecents}
                className="rounded-lg border border-line bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Geçmişi Temizle
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-line bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


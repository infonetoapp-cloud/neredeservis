"use client";

import { ArrowUp, ArrowDown, Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

interface CmsSortableListProps<T> {
  items: T[];
  onChange: (items: T[]) => void;
  /** Yeni boş öğe oluşturucu */
  createEmpty: () => T;
  /** Öğe render fonksiyonu */
  renderItem: (item: T, index: number, update: (patch: Partial<T>) => void) => ReactNode;
  /** Ekle butonu yazısı */
  addLabel?: string;
  /** Maks öğe sayısı */
  maxItems?: number;
}

export function CmsSortableList<T>({
  items,
  onChange,
  createEmpty,
  renderItem,
  addLabel = "Ekle",
  maxItems = 20,
}: CmsSortableListProps<T>) {
  function move(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, patch: Partial<T>) {
    const next = items.map((it, i) => (i === index ? { ...it, ...patch } : it));
    onChange(next);
  }

  function add() {
    if (items.length >= maxItems) return;
    onChange([...items, createEmpty()]);
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="group relative rounded-xl border border-slate-200 bg-white p-4"
        >
          {/* Toolbar */}
          <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => move(i, i - 1)}
              disabled={i === 0}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30"
              title="Yukarı taşı"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => move(i, i + 1)}
              disabled={i === items.length - 1}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30"
              title="Aşağı taşı"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => remove(i)}
              className="rounded-lg p-1 text-slate-400 hover:bg-rose-100 hover:text-rose-600"
              title="Sil"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Content */}
          {renderItem(item, i, (patch) => updateItem(i, patch))}
        </div>
      ))}

      {items.length < maxItems && (
        <button
          type="button"
          onClick={add}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm text-slate-500 hover:border-teal-300 hover:text-teal-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {addLabel}
        </button>
      )}
    </div>
  );
}

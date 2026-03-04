"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import {
  LANDING_ICON_MAP,
  AVAILABLE_ICON_NAMES,
  resolveIcon,
} from "@/components/marketing/landing-icon-map";

interface CmsIconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

export function CmsIconPicker({ value, onChange }: CmsIconPickerProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = search
    ? AVAILABLE_ICON_NAMES.filter((n) => n.toLowerCase().includes(search.toLowerCase()))
    : AVAILABLE_ICON_NAMES;

  const SelectedIcon = resolveIcon(value);

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-700">İkon</label>

      {/* Selected preview + toggle */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 hover:border-teal-300 transition-colors"
      >
        <SelectedIcon className="h-5 w-5 text-teal-600" />
        <span>{value || "Seç…"}</span>
      </button>

      {/* Dropdown grid */}
      {open && (
        <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İkon ara…"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* Grid */}
          <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto">
            {filtered.map((name) => {
              const Icon = LANDING_ICON_MAP[name as keyof typeof LANDING_ICON_MAP];
              if (!Icon) return null;
              const isSelected = name === value;
              return (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => {
                    onChange(name);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`flex items-center justify-center rounded-lg p-2 transition-colors ${
                    isSelected
                      ? "bg-teal-100 text-teal-700 ring-2 ring-teal-300"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="col-span-6 py-3 text-center text-xs text-slate-400">
                Sonuç bulunamadı
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

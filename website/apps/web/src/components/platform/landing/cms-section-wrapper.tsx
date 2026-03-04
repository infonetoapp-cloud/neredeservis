"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";

interface CmsSectionWrapperProps {
  title: string;
  /** Gösterilecek dirty (değişmiş) göstergesi */
  dirty?: boolean;
  /** Başlangıçta açık mı? */
  defaultOpen?: boolean;
  children: ReactNode;
}

export function CmsSectionWrapper({
  title,
  dirty = false,
  defaultOpen = false,
  children,
}: CmsSectionWrapperProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          {title}
          {dirty && (
            <span className="h-2 w-2 rounded-full bg-amber-400" title="Kaydedilmemiş değişiklik" />
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

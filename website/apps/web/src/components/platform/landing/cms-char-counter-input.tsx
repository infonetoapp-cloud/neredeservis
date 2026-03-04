"use client";

import { useId } from "react";

interface CmsCharCounterInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  maxLength: number;
  /** true ise textarea, false ise input */
  multiline?: boolean;
  placeholder?: string;
  rows?: number;
}

export function CmsCharCounterInput({
  label,
  value,
  onChange,
  maxLength,
  multiline = false,
  placeholder,
  rows = 3,
}: CmsCharCounterInputProps) {
  const id = useId();
  const remaining = maxLength - value.length;
  const overLimit = remaining < 0;

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100";

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-slate-700">
        {label}
      </label>

      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
          rows={rows}
          className={`${inputClass} resize-y`}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
          className={inputClass}
        />
      )}

      <p className={`mt-1 text-right text-xs ${overLimit ? "text-rose-500 font-medium" : "text-slate-400"}`}>
        {value.length}/{maxLength}
      </p>
    </div>
  );
}

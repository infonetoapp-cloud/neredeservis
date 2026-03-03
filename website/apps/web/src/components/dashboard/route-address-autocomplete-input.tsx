"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  type AddressSuggestion,
  useAddressAutocomplete,
} from "@/components/dashboard/use-address-autocomplete";

type AddressAutocompleteInputProps = {
  label: string;
  placeholder?: string;
  value: string;
  onAddressSelect: (suggestion: AddressSuggestion) => void;
  onValueChange: (value: string) => void;
  icon?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
};

export function AddressAutocompleteInput({
  label,
  placeholder = "Adres ara...",
  value,
  onAddressSelect,
  onValueChange,
  icon,
  required,
  disabled,
}: AddressAutocompleteInputProps) {
  const { query, setQuery, suggestions, isLoading, isOpen, setIsOpen, clearSuggestions } =
    useAddressAutocomplete();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Sync external value → internal query (for controlled usage)
  useEffect(() => {
    if (!isFocused) {
      setQuery(value);
    }
  }, [value, isFocused, setQuery]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = e.target.value;
      setQuery(nextValue);
      onValueChange(nextValue);
    },
    [onValueChange, setQuery],
  );

  const handleSelect = useCallback(
    (suggestion: AddressSuggestion) => {
      setQuery(suggestion.shortName);
      onValueChange(suggestion.shortName);
      onAddressSelect(suggestion);
      clearSuggestions();
      setIsOpen(false);
      inputRef.current?.blur();
    },
    [clearSuggestions, onAddressSelect, onValueChange, setIsOpen, setQuery],
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (suggestions.length > 0) setIsOpen(true);
  }, [setIsOpen, suggestions.length]);

  const handleBlur = useCallback(() => {
    // Delay to allow click on suggestion
    setTimeout(() => {
      setIsFocused(false);
      setIsOpen(false);
    }, 200);
  }, [setIsOpen]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsOpen]);

  return (
    <div ref={wrapperRef} className="relative">
      <label className="space-y-1">
        <span className="text-xs font-medium text-slate-700">
          {label}
          {required ? " *" : ""}
        </span>
        <div className="relative">
          {icon ? (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {icon}
            </span>
          ) : null}
          <input
            ref={inputRef}
            type="text"
            value={isFocused ? query : value}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
            className={`w-full rounded-xl border bg-white py-2.5 text-sm text-slate-900 outline-none transition-colors ${
              icon ? "pl-9 pr-3" : "px-3"
            } ${
              isFocused
                ? "border-brand-400 ring-2 ring-brand-100"
                : "border-line hover:border-slate-300"
            } ${disabled ? "cursor-not-allowed bg-slate-50 text-slate-400" : ""}`}
          />
          {isLoading ? (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              <span className="block h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500" />
            </span>
          ) : null}
        </div>
      </label>

      {isOpen && suggestions.length > 0 ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-line bg-white shadow-lg">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.placeId}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(suggestion)}
              className="flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl"
            >
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-slate-900">
                  {suggestion.shortName}
                </div>
                <div className="truncate text-xs text-slate-500">{suggestion.displayName}</div>
              </div>
            </button>
          ))}
          <div className="border-t border-line px-3 py-1.5 text-[10px] text-slate-400">
            © OpenStreetMap
          </div>
        </div>
      ) : null}
    </div>
  );
}

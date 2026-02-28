"use client";

export function normalizeTextInput(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}


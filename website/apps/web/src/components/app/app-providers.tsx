"use client";

import type { ReactNode } from "react";

import { AuthSessionProvider } from "@/features/auth/auth-session-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return <AuthSessionProvider>{children}</AuthSessionProvider>;
}

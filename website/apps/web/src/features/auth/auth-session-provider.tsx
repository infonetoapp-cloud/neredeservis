"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { AuthSessionUser } from "@/features/auth/auth-session-types";
import {
  readAuthStateSnapshot,
  refreshCurrentAuthSession,
  subscribeAuthState,
} from "@/features/auth/auth-client";
import { setClientSessionCookie } from "@/lib/auth/session-cookie-client";
import { getBackendApiBaseUrl } from "@/lib/env/public-env";

type AuthSessionStatus = "loading" | "signed_out" | "signed_in" | "disabled";

type AuthSessionContextValue = {
  status: AuthSessionStatus;
  user: AuthSessionUser | null;
  configReady: boolean;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const configReady = Boolean(getBackendApiBaseUrl());
  const initialSnapshot = readAuthStateSnapshot();
  const [user, setUser] = useState<AuthSessionUser | null>(initialSnapshot.user);
  const [resolved, setResolved] = useState<boolean>(
    configReady ? initialSnapshot.resolved : true,
  );

  useEffect(() => {
    if (!configReady) {
      setClientSessionCookie(false);
      setUser(null);
      setResolved(true);
      return;
    }

    const unsubscribe = subscribeAuthState((snapshot) => {
      setUser(snapshot.user);
      setResolved(snapshot.resolved);
    });

    void refreshCurrentAuthSession().catch(() => {
      setUser(null);
      setResolved(true);
      setClientSessionCookie(false);
    });

    return unsubscribe ?? undefined;
  }, [configReady]);

  const status: AuthSessionStatus = !configReady
    ? "disabled"
    : !resolved
      ? "loading"
      : user
        ? "signed_in"
        : "signed_out";

  const value = useMemo<AuthSessionContextValue>(
    () => ({ status, user, configReady }),
    [configReady, status, user],
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error("useAuthSession must be used within AuthSessionProvider");
  }
  return context;
}

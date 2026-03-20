"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  AUTH_SESSION_CHANGED_EVENT_NAME,
  readCurrentAuthSessionFromBackend,
  subscribeAuthState,
} from "@/features/auth/auth-client";
import type { AuthSessionUser } from "@/features/auth/auth-session-types";
import { setClientSessionCookie } from "@/lib/auth/session-cookie-client";
import { getBackendApiBaseUrl } from "@/lib/env/public-env";
import { getPublicConfigValidation } from "@/lib/env/firebase-public-config";

type AuthSessionStatus = "loading" | "signed_out" | "signed_in" | "disabled";

type AuthSessionContextValue = {
  status: AuthSessionStatus;
  user: AuthSessionUser | null;
  configReady: boolean;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const backendSessionEnabled = Boolean(getBackendApiBaseUrl());
  const firebaseConfigReady = getPublicConfigValidation().ok;
  const configReady = backendSessionEnabled || firebaseConfigReady;
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [resolved, setResolved] = useState<boolean>(!configReady);

  useEffect(() => {
    if (backendSessionEnabled) {
      let active = true;

      const syncFromBackend = async () => {
        try {
          const nextUser = await readCurrentAuthSessionFromBackend();
          if (!active) {
            return;
          }
          setUser(nextUser);
          setResolved(true);
          setClientSessionCookie(Boolean(nextUser));
        } catch {
          if (!active) {
            return;
          }
          setUser(null);
          setResolved(true);
          setClientSessionCookie(false);
        }
      };

      void syncFromBackend();
      const handleSessionChanged = () => {
        void syncFromBackend();
      };

      window.addEventListener(AUTH_SESSION_CHANGED_EVENT_NAME, handleSessionChanged);
      return () => {
        active = false;
        window.removeEventListener(AUTH_SESSION_CHANGED_EVENT_NAME, handleSessionChanged);
      };
    }

    if (!firebaseConfigReady) {
      setClientSessionCookie(false);
      return;
    }

    const unsubscribe = subscribeAuthState((nextUser) => {
      setUser(nextUser);
      setResolved(true);
      setClientSessionCookie(Boolean(nextUser));
    });

    if (!unsubscribe) {
      setClientSessionCookie(false);
      return;
    }

    return unsubscribe;
  }, [backendSessionEnabled, firebaseConfigReady]);

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

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";

import { subscribeAuthState } from "@/features/auth/auth-client";
import { setClientSessionCookie } from "@/lib/auth/session-cookie-client";
import { getPublicConfigValidation } from "@/lib/env/firebase-public-config";

type AuthSessionStatus = "loading" | "signed_out" | "signed_in" | "disabled";

type AuthSessionContextValue = {
  status: AuthSessionStatus;
  user: User | null;
  configReady: boolean;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const configReady = getPublicConfigValidation().ok;
  const [user, setUser] = useState<User | null>(null);
  const [resolved, setResolved] = useState<boolean>(!configReady);

  useEffect(() => {
    if (!configReady) {
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

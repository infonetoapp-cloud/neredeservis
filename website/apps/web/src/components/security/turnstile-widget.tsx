"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type TurnstileRenderOptions = {
  sitekey: string;
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
};

type TurnstileInstance = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string | number;
  reset: (widgetId: string | number) => void;
  remove: (widgetId: string | number) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileInstance;
    __nsTurnstileLoadPromise?: Promise<void>;
  }
}

type TurnstileWidgetProps = {
  siteKey: string;
  onTokenChange: (token: string | null) => void;
};

function ensureTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  if (window.turnstile) {
    return Promise.resolve();
  }
  if (window.__nsTurnstileLoadPromise) {
    return window.__nsTurnstileLoadPromise;
  }

  window.__nsTurnstileLoadPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      "script[data-ns-turnstile='true']",
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("TURNSTILE_SCRIPT_ERROR")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.nsTurnstile = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("TURNSTILE_SCRIPT_ERROR"));
    document.head.appendChild(script);
  });

  return window.__nsTurnstileLoadPromise;
}

export function TurnstileWidget({ siteKey, onTokenChange }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const stableTokenHandler = useMemo(() => onTokenChange, [onTokenChange]);

  useEffect(() => {
    let cancelled = false;
    stableTokenHandler(null);

    void ensureTurnstileScript()
      .then(() => {
        if (cancelled) {
          return;
        }
        const turnstile = window.turnstile;
        if (!turnstile || !containerRef.current) {
          setLoadError("Captcha yuklenemedi.");
          return;
        }

        const widgetId = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => stableTokenHandler(token),
          "expired-callback": () => stableTokenHandler(null),
          "error-callback": () => stableTokenHandler(null),
        });
        widgetIdRef.current = widgetId;
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError("Captcha yuklenemedi.");
        }
      });

    return () => {
      cancelled = true;
      const turnstile = window.turnstile;
      const widgetId = widgetIdRef.current;
      if (turnstile && widgetId !== null) {
        try {
          turnstile.remove(widgetId);
        } catch {
          // no-op
        }
      }
      widgetIdRef.current = null;
      stableTokenHandler(null);
    };
  }, [siteKey, stableTokenHandler]);

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="min-h-[65px]" />
      {loadError ? (
        <p className="text-xs text-rose-700">{loadError}</p>
      ) : (
        <p className="text-xs text-muted">Guvenlik dogrulamasi gereklidir.</p>
      )}
    </div>
  );
}

"use client";

import React, { useCallback, useState, type ReactNode } from "react";

type ErrorStateProps = {
  /** Error message to display */
  message?: string;
  /** Optional detailed context */
  detail?: string;
  /** Retry callback — shows "Tekrar Dene" button */
  onRetry?: () => void | Promise<void>;
};

/**
 * Inline error block — replaces "Something went wrong" with actionable UI.
 * Explains what happened and what the user can do. Always rounded-2xl.
 */
export function ErrorState({
  message = "Bir hata oluştu",
  detail,
  onRetry,
}: ErrorStateProps) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = useCallback(async () => {
    if (!onRetry) return;
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  }, [onRetry]);

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/50 px-6 py-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-400">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="m15 9-6 6M9 9l6 6" />
        </svg>
      </div>

      <h3 className="text-sm font-semibold text-red-700">{message}</h3>

      {detail ? (
        <p className="mt-1 text-xs text-red-500/80">{detail}</p>
      ) : null}

      {onRetry ? (
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-red-100 px-4 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-200 disabled:opacity-50"
        >
          {retrying ? (
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-red-300 border-t-red-600" />
          ) : null}
          Tekrar Dene
        </button>
      ) : null}

      <p className="mt-3 text-[10px] text-red-400">
        Sorun devam ederse sayfayı yenileyin veya destek ile iletişime geçin.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Error Boundary wrapper (class component required for React)        */
/* ------------------------------------------------------------------ */

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class ModuleErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <ErrorState
            message="Bu modül yüklenemedi"
            detail={this.state.error?.message}
            onRetry={() => this.setState({ hasError: false, error: null })}
          />
        )
      );
    }

    return this.props.children;
  }
}

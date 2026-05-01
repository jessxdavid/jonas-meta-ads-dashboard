"use client";

import { AlertCircle, Inbox, RefreshCw } from "lucide-react";

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-6 py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-negative-soft)]">
        <AlertCircle size={24} className="text-[var(--color-negative)]" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-white">Something went wrong</h3>
      <p className="mb-4 max-w-md text-sm text-[var(--color-text-secondary)]">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title = "No data for this period",
  message = "Try expanding your date range or check back once your campaigns have data.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-6 py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-neutral-soft)]">
        <Inbox size={24} className="text-[var(--color-neutral)]" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-white">{title}</h3>
      <p className="max-w-md text-sm text-[var(--color-text-secondary)]">{message}</p>
    </div>
  );
}

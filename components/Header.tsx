"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Calendar } from "lucide-react";
import clsx from "clsx";
import { useDateRange } from "./DateRangeContext";
import { PRESETS } from "@/lib/date-range";

interface AccountInfo {
  name: string;
  id: string;
  isMock: boolean;
}

export function Header() {
  const { range, setPreset } = useDateRange();
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState<AccountInfo | null>(null);

  useEffect(() => {
    fetch("/api/account")
      .then((r) => r.json())
      .then((d) => setAccount(d))
      .catch(() => null);
  }, []);

  const activeLabel =
    PRESETS.find((p) => p.id === range.preset)?.label ?? "Custom Range";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-positive)]" />
        <div className="leading-tight">
          <div className="text-sm font-semibold text-white">
            {account?.name ?? "Loading account..."}
          </div>
          <div className="font-mono text-xs text-[var(--color-text-secondary)]">
            {account?.id ?? "—"}
            {account?.isMock && (
              <span className="ml-2 rounded-full bg-[var(--color-warning-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--color-warning)]">
                Demo Data
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-white transition hover:border-[var(--color-border-strong)]"
        >
          <Calendar size={14} className="text-[var(--color-text-secondary)]" />
          <span>{activeLabel}</span>
          <span className="font-mono text-xs text-[var(--color-text-secondary)]">
            {range.since} → {range.until}
          </span>
          <ChevronDown size={14} />
        </button>
        {open && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setPreset(p.id);
                    setOpen(false);
                  }}
                  className={clsx(
                    "block w-full px-3 py-2 text-left text-sm transition",
                    range.preset === p.id
                      ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                      : "text-white hover:bg-[var(--color-card-hover)]",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </header>
  );
}

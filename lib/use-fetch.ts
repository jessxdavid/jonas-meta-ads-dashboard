"use client";

import { useEffect, useRef, useState } from "react";
import { useDateRange } from "@/components/DateRangeContext";

export const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export interface FetchState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  refetch: () => void;
  lastFetchedAt: number | null;
}

export function useDashboardFetch<T>(endpoint: string): FetchState<T> {
  const { range } = useDateRange();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);
  const lastFetchedAtRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const url = `${endpoint}?since=${range.since}&until=${range.until}`;
    fetch(url)
      .then(async (r) => {
        const j = await r.json();
        if (cancelled) return;
        if (!r.ok) throw new Error(j?.error ?? `Request failed (${r.status})`);
        setData(j);
        setLoading(false);
        const now = Date.now();
        setLastFetchedAt(now);
        lastFetchedAtRef.current = now;
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [endpoint, range.since, range.until, tick]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setTick((t) => t + 1);
      }
    }, REFRESH_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const last = lastFetchedAtRef.current;
      if (last == null || Date.now() - last >= 60_000) {
        setTick((t) => t + 1);
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return { data, error, loading, refetch: () => setTick((t) => t + 1), lastFetchedAt };
}

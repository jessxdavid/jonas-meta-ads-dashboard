"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { DateRange, DateRangePreset } from "@/types/meta";
import { rangeFromPreset } from "@/lib/date-range";

interface DateRangeContextValue {
  range: DateRange;
  setPreset: (p: DateRangePreset) => void;
}

const DateRangeContext = createContext<DateRangeContextValue | null>(null);

export function DateRangeProvider({ children }: { children: React.ReactNode }) {
  const [preset, setPresetState] = useState<DateRangePreset>("last_30_days");
  const range = useMemo(() => rangeFromPreset(preset), [preset]);
  const value: DateRangeContextValue = useMemo(
    () => ({ range, setPreset: setPresetState }),
    [range],
  );
  return <DateRangeContext.Provider value={value}>{children}</DateRangeContext.Provider>;
}

export function useDateRange(): DateRangeContextValue {
  const ctx = useContext(DateRangeContext);
  if (!ctx) throw new Error("useDateRange must be used within <DateRangeProvider>");
  return ctx;
}

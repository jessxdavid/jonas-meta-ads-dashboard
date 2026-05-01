import type { DateRange, DateRangePreset } from "@/types/meta";

export const PRESETS: { id: DateRangePreset; label: string }[] = [
  { id: "last_7_days", label: "Last 7 Days" },
  { id: "last_14_days", label: "Last 14 Days" },
  { id: "last_30_days", label: "Last 30 Days" },
  { id: "last_90_days", label: "Last 90 Days" },
  { id: "this_month", label: "This Month" },
];

export function rangeFromPreset(preset: DateRangePreset): DateRange {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const until = today.toISOString().slice(0, 10);
  let since = until;

  switch (preset) {
    case "last_7_days": {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - 6);
      since = d.toISOString().slice(0, 10);
      break;
    }
    case "last_14_days": {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - 13);
      since = d.toISOString().slice(0, 10);
      break;
    }
    case "last_30_days": {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - 29);
      since = d.toISOString().slice(0, 10);
      break;
    }
    case "last_90_days": {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - 89);
      since = d.toISOString().slice(0, 10);
      break;
    }
    case "this_month": {
      const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
      since = d.toISOString().slice(0, 10);
      break;
    }
  }
  return { since, until, preset };
}

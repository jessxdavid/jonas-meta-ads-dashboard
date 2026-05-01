import { NextRequest } from "next/server";
import { rangeFromPreset } from "@/lib/date-range";
import type { DateRange, DateRangePreset } from "@/types/meta";

const VALID_PRESETS: DateRangePreset[] = [
  "last_7_days",
  "last_14_days",
  "last_30_days",
  "last_90_days",
  "this_month",
];

export function rangeFromRequest(req: NextRequest): DateRange {
  const params = req.nextUrl.searchParams;
  const since = params.get("since");
  const until = params.get("until");
  const preset = params.get("preset") as DateRangePreset | null;

  if (since && until) {
    return { since, until };
  }
  if (preset && VALID_PRESETS.includes(preset)) {
    return rangeFromPreset(preset);
  }
  return rangeFromPreset("last_30_days");
}

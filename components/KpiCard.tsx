import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import clsx from "clsx";
import { Card } from "./Card";
import { formatChange } from "@/lib/format";

interface KpiCardProps {
  label: string;
  value: string;
  current: number;
  previous: number;
  hint?: string;
  invertChange?: boolean;
}

export function KpiCard({ label, value, current, previous, hint, invertChange }: KpiCardProps) {
  const change = formatChange(current, previous);
  const isPositive = invertChange ? change.direction === "down" : change.direction === "up";
  const isNegative = invertChange ? change.direction === "up" : change.direction === "down";
  const Icon =
    change.direction === "up" ? ArrowUpRight : change.direction === "down" ? ArrowDownRight : Minus;
  const color = isPositive
    ? "text-[var(--color-positive)] bg-[var(--color-positive-soft)]"
    : isNegative
    ? "text-[var(--color-negative)] bg-[var(--color-negative-soft)]"
    : "text-[var(--color-neutral)] bg-[var(--color-neutral-soft)]";

  return (
    <Card>
      <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
        {label}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="font-mono text-2xl font-semibold text-white">{value}</div>
        <div
          className={clsx(
            "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
            color,
          )}
        >
          <Icon size={12} />
          {change.display}
        </div>
      </div>
      {hint && (
        <div className="mt-2 text-xs text-[var(--color-text-muted)]">{hint}</div>
      )}
    </Card>
  );
}

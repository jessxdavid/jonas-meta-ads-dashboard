import clsx from "clsx";

export type PerformanceTier = "top" | "average" | "underperforming";

export function tierFromRoas(roas: number): PerformanceTier {
  if (roas >= 5) return "top";
  if (roas >= 2) return "average";
  return "underperforming";
}

const TIER_STYLES: Record<PerformanceTier, string> = {
  top: "bg-[var(--color-positive-soft)] text-[var(--color-positive)]",
  average: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  underperforming: "bg-[var(--color-negative-soft)] text-[var(--color-negative)]",
};

const TIER_LABEL: Record<PerformanceTier, string> = {
  top: "Top Performer",
  average: "Average",
  underperforming: "Underperforming",
};

export function PerformanceBadge({ tier }: { tier: PerformanceTier }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        TIER_STYLES[tier],
      )}
    >
      {TIER_LABEL[tier]}
    </span>
  );
}

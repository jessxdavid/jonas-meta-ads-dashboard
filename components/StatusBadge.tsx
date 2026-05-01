import clsx from "clsx";
import type { CampaignStatus } from "@/types/meta";

const STATUS_STYLES: Record<CampaignStatus, string> = {
  ACTIVE: "bg-[var(--color-positive-soft)] text-[var(--color-positive)]",
  PAUSED: "bg-[var(--color-neutral-soft)] text-[var(--color-neutral)]",
  ENDED: "bg-[var(--color-negative-soft)] text-[var(--color-negative)]",
};

const STATUS_LABEL: Record<CampaignStatus, string> = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  ENDED: "Ended",
};

export function StatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}

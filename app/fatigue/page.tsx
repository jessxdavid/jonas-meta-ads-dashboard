"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import { Activity, AlertTriangle, CheckCircle2, MinusCircle, ArrowUp, ArrowDown } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/Card";
import { GridSkeleton } from "@/components/Skeleton";
import { ErrorState, EmptyState } from "@/components/States";
import { FatigueSparkline } from "@/components/charts/FatigueSparkline";
import { useDashboardFetch } from "@/lib/use-fetch";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRoas,
} from "@/lib/format";
import type { FatiguePayload, FatigueStatus } from "@/lib/fatigue";

const STATUS_META: Record<
  FatigueStatus,
  { label: string; cls: string; icon: React.ElementType }
> = {
  fatigued: {
    label: "Fatigued",
    cls: "bg-[var(--color-negative-soft)] text-[var(--color-negative)] border-l-[var(--color-negative)]",
    icon: AlertTriangle,
  },
  watch: {
    label: "Watch",
    cls: "bg-[var(--color-warning-soft)] text-[var(--color-warning)] border-l-[var(--color-warning)]",
    icon: Activity,
  },
  fresh: {
    label: "Fresh",
    cls: "bg-[var(--color-positive-soft)] text-[var(--color-positive)] border-l-[var(--color-positive)]",
    icon: CheckCircle2,
  },
  no_data: {
    label: "No Data",
    cls: "bg-[var(--color-neutral-soft)] text-[var(--color-neutral)] border-l-[var(--color-neutral)]",
    icon: MinusCircle,
  },
};

export default function FatiguePage() {
  const { data, loading, error, refetch } = useDashboardFetch<FatiguePayload>("/api/fatigue");
  const [filter, setFilter] = useState<FatigueStatus | "all">("all");

  const filtered = useMemo(() => {
    if (!data) return [];
    if (filter === "all") return data.creatives;
    return data.creatives.filter((c) => c.fatigue.status === filter);
  }, [data, filter]);

  const counts = useMemo(() => {
    const c = { fatigued: 0, watch: 0, fresh: 0, no_data: 0 };
    if (!data) return c;
    for (const cr of data.creatives) c[cr.fatigue.status]++;
    return c;
  }, [data]);

  return (
    <PageShell
      title="Creative Fatigue Detector"
      description="CTR + frequency trends per creative. Refresh creatives before performance crashes."
    >
      {loading && <GridSkeleton count={6} />}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}

      {data && !loading && !error && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <SummaryTile label="Fatigued" count={counts.fatigued} status="fatigued" onClick={() => setFilter("fatigued")} active={filter === "fatigued"} />
            <SummaryTile label="Watch" count={counts.watch} status="watch" onClick={() => setFilter("watch")} active={filter === "watch"} />
            <SummaryTile label="Fresh" count={counts.fresh} status="fresh" onClick={() => setFilter("fresh")} active={filter === "fresh"} />
            <SummaryTile label="No Data" count={counts.no_data} status="no_data" onClick={() => setFilter("no_data")} active={filter === "no_data"} />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setFilter("all")}
              className={clsx(
                "rounded-md px-3 py-1.5 text-xs font-medium transition",
                filter === "all"
                  ? "bg-[var(--color-accent)] text-white"
                  : "border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:text-white",
              )}
            >
              Show all ({data.creatives.length})
            </button>
            <div className="text-xs text-[var(--color-text-secondary)]">
              Showing {filtered.length} of {data.creatives.length}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="Nothing to show in this category" />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {filtered.map((c) => {
                const meta = STATUS_META[c.fatigue.status];
                const Icon = meta.icon;
                return (
                  <Card
                    key={c.id}
                    padded={false}
                    className={clsx("overflow-hidden border-l-4", meta.cls.split(" ").pop())}
                  >
                    <div className="flex gap-3 p-4">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-[var(--color-bg)]">
                        <Image
                          src={c.thumbnailUrl}
                          alt={c.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-white">{c.name}</div>
                            <div className="truncate text-xs text-[var(--color-text-secondary)]">
                              {c.campaignName}
                            </div>
                          </div>
                          <span
                            className={clsx(
                              "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                              meta.cls.split(" ").slice(0, 2).join(" "),
                            )}
                          >
                            <Icon size={11} />
                            {meta.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 pb-2">
                      <FatigueSparkline data={c.daily} />
                      <div className="mt-1 flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
                        <span>
                          <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-accent)]" />{" "}
                          CTR
                        </span>
                        <span>
                          <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-warning)]" />{" "}
                          Frequency
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-t border-[var(--color-border)] px-4 py-3 text-xs">
                      <Metric
                        label="CTR Δ 7d"
                        value={`${c.fatigue.ctrTrend > 0 ? "+" : ""}${c.fatigue.ctrTrend.toFixed(0)}%`}
                        direction={c.fatigue.ctrTrend < -10 ? "down" : c.fatigue.ctrTrend > 5 ? "up" : "flat"}
                      />
                      <Metric
                        label="Frequency"
                        value={`${c.fatigue.frequency.toFixed(2)}x`}
                        direction={c.fatigue.frequency > 3.5 ? "down" : c.fatigue.frequency > 2.5 ? "flat" : "up"}
                        invert
                      />
                      <Metric
                        label="CPC Δ 7d"
                        value={`${c.fatigue.cpcTrend > 0 ? "+" : ""}${c.fatigue.cpcTrend.toFixed(0)}%`}
                        direction={c.fatigue.cpcTrend > 15 ? "down" : c.fatigue.cpcTrend < -5 ? "up" : "flat"}
                        invert
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-t border-[var(--color-border)] px-4 py-3 text-xs">
                      <div>
                        <div className="text-[var(--color-text-muted)]">Spend</div>
                        <div className="font-mono text-white">{formatCurrency(c.totals.spend, { compact: true })}</div>
                      </div>
                      <div>
                        <div className="text-[var(--color-text-muted)]">Impressions</div>
                        <div className="font-mono text-white">{formatNumber(c.totals.impressions, { compact: true })}</div>
                      </div>
                      <div>
                        <div className="text-[var(--color-text-muted)]">ROAS</div>
                        <div className="font-mono text-white">{formatRoas(c.totals.roas)}</div>
                      </div>
                    </div>

                    <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-xs">
                      <span className="font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                        Action:
                      </span>{" "}
                      <span className="text-white">{c.recommendation}</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}

function SummaryTile({
  label,
  count,
  status,
  onClick,
  active,
}: {
  label: string;
  count: number;
  status: FatigueStatus;
  onClick: () => void;
  active: boolean;
}) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <button
      onClick={onClick}
      className={clsx(
        "rounded-xl border bg-[var(--color-card)] p-4 text-left transition",
        active
          ? "border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]"
          : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
          {label}
        </div>
        <Icon size={14} className={meta.cls.split(" ")[1]} />
      </div>
      <div className="mt-2 font-mono text-2xl font-semibold text-white">{count}</div>
    </button>
  );
}

function Metric({
  label,
  value,
  direction,
  invert,
}: {
  label: string;
  value: string;
  direction: "up" | "down" | "flat";
  invert?: boolean;
}) {
  const isPositive = invert ? direction === "down" : direction === "up";
  const isNegative = invert ? direction === "up" : direction === "down";
  const Icon = direction === "up" ? ArrowUp : direction === "down" ? ArrowDown : MinusCircle;
  return (
    <div>
      <div className="text-[var(--color-text-muted)]">{label}</div>
      <div
        className={clsx(
          "flex items-center gap-1 font-mono",
          isPositive
            ? "text-[var(--color-positive)]"
            : isNegative
              ? "text-[var(--color-negative)]"
              : "text-[var(--color-text-secondary)]",
        )}
      >
        {direction !== "flat" && <Icon size={11} />}
        {value}
      </div>
    </div>
  );
}

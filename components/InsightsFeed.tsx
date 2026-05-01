"use client";

import {
  TrendingUp,
  Octagon,
  AlertTriangle,
  Activity,
  Wallet,
  Users,
  Sparkles,
} from "lucide-react";
import clsx from "clsx";
import { Card, CardHeader } from "./Card";
import { Skeleton } from "./Skeleton";
import { useDashboardFetch } from "@/lib/use-fetch";
import type { InsightsPayload, OptimizationInsight } from "@/lib/insights-engine";

const CATEGORY_ICON: Record<OptimizationInsight["category"], React.ElementType> = {
  scale: TrendingUp,
  kill: Octagon,
  fatigue: Activity,
  anomaly: AlertTriangle,
  budget: Wallet,
  audience: Users,
};

const SEVERITY_STYLES: Record<
  OptimizationInsight["severity"],
  { ring: string; pill: string; icon: string }
> = {
  high: {
    ring: "border-l-[var(--color-negative)]",
    pill: "bg-[var(--color-negative-soft)] text-[var(--color-negative)]",
    icon: "text-[var(--color-negative)]",
  },
  medium: {
    ring: "border-l-[var(--color-warning)]",
    pill: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
    icon: "text-[var(--color-warning)]",
  },
  low: {
    ring: "border-l-[var(--color-neutral)]",
    pill: "bg-[var(--color-neutral-soft)] text-[var(--color-neutral)]",
    icon: "text-[var(--color-neutral)]",
  },
};

const SEVERITY_LABEL: Record<OptimizationInsight["severity"], string> = {
  high: "Action Now",
  medium: "Watch",
  low: "FYI",
};

export function InsightsFeed() {
  const { data, loading, error } = useDashboardFetch<InsightsPayload>("/api/insights");

  return (
    <Card>
      <CardHeader
        title="Optimization Insights"
        subtitle="Auto-generated suggestions from your campaign data"
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent-soft)] px-2.5 py-1 text-xs font-medium text-[var(--color-accent)]">
            <Sparkles size={12} />
            {data?.insights.length ?? 0} insights
          </span>
        }
      />

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="rounded-lg border border-[var(--color-negative-soft)] bg-[var(--color-negative-soft)] px-4 py-3 text-sm text-[var(--color-negative)]">
          Could not generate insights: {error}
        </div>
      )}

      {data && !loading && data.insights.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] py-10 text-center">
          <Sparkles size={20} className="mb-2 text-[var(--color-text-muted)]" />
          <div className="text-sm font-medium text-white">All clear</div>
          <p className="mt-1 max-w-sm text-xs text-[var(--color-text-secondary)]">
            No actions flagged for this period. Everything is within healthy thresholds.
          </p>
        </div>
      )}

      {data && !loading && data.insights.length > 0 && (
        <div className="space-y-2">
          {data.insights.map((ins) => {
            const Icon = CATEGORY_ICON[ins.category];
            const style = SEVERITY_STYLES[ins.severity];
            return (
              <div
                key={ins.id}
                className={clsx(
                  "rounded-lg border border-[var(--color-border)] border-l-4 bg-[var(--color-bg)] p-4 transition hover:border-[var(--color-border-strong)]",
                  style.ring,
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={clsx("mt-0.5", style.icon)}>
                    <Icon size={18} strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white">{ins.title}</h4>
                      <span
                        className={clsx(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                          style.pill,
                        )}
                      >
                        {SEVERITY_LABEL[ins.severity]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                      {ins.body}
                    </p>
                  </div>
                  {ins.metric && (
                    <div className="shrink-0 text-right">
                      <div className="font-mono text-lg font-semibold text-white">
                        {ins.metric.value}
                      </div>
                      <div className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
                        {ins.metric.label}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

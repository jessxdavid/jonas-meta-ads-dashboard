"use client";

import clsx from "clsx";
import { PageShell } from "@/components/PageShell";
import { Card, CardHeader } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { ChartSkeleton, KpiCardSkeleton } from "@/components/Skeleton";
import { ErrorState, EmptyState } from "@/components/States";
import { BudgetPacingChart } from "@/components/charts/BudgetPacingChart";
import { useDashboardFetch } from "@/lib/use-fetch";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { BudgetPayload } from "@/lib/meta-api";

const PACING_LABEL: Record<string, { label: string; cls: string; bar: string }> = {
  on_track: {
    label: "On Track",
    cls: "bg-[var(--color-positive-soft)] text-[var(--color-positive)]",
    bar: "bg-[var(--color-positive)]",
  },
  overpacing: {
    label: "Overpacing",
    cls: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
    bar: "bg-[var(--color-warning)]",
  },
  underpacing: {
    label: "Underpacing",
    cls: "bg-[var(--color-neutral-soft)] text-[var(--color-neutral)]",
    bar: "bg-[var(--color-neutral)]",
  },
  "n/a": {
    label: "—",
    cls: "bg-[var(--color-neutral-soft)] text-[var(--color-neutral)]",
    bar: "bg-[var(--color-text-muted)]",
  },
};

export default function BudgetPage() {
  const { data, loading, error, refetch } = useDashboardFetch<BudgetPayload>("/api/budget");

  return (
    <PageShell
      title="Budget Tracker"
      description="Daily pacing, spend-to-budget ratios, and projected month-end totals."
    >
      {loading && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </div>
          <ChartSkeleton height={320} />
        </>
      )}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}

      {data && !loading && !error && (
        <>
          <BudgetSummary data={data} />

          <Card>
            <CardHeader
              title="Daily Spend This Month"
              subtitle="Bars show daily spend; dashed line is the combined daily budget target"
            />
            {data.monthDailySpend.length === 0 ? (
              <EmptyState title="No spend data this month" />
            ) : (
              <BudgetPacingChart
                data={data.monthDailySpend}
                budgetTarget={data.monthBudgetTarget}
              />
            )}
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.campaigns.map((c) => {
              const budget =
                c.budgetType === "DAILY"
                  ? (c.dailyBudget ?? 0) * 30
                  : (c.lifetimeBudget ?? 0);
              const remaining = Math.max(0, budget - c.spendToDate);
              const pct = budget > 0 ? Math.min(100, (c.spendToDate / budget) * 100) : 0;
              const pacing = PACING_LABEL[c.pacing];
              return (
                <Card key={c.id} className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-white">{c.name}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs">
                        <StatusBadge status={c.status} />
                        <span className="font-mono uppercase text-[var(--color-text-muted)]">
                          {c.budgetType}
                        </span>
                      </div>
                    </div>
                    <span
                      className={clsx(
                        "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                        pacing.cls,
                      )}
                    >
                      {pacing.label}
                    </span>
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-[var(--color-text-secondary)]">Spent</span>
                      <span className="font-mono text-white">
                        {formatCurrency(c.spendToDate, { compact: true })} /{" "}
                        {formatCurrency(budget, { compact: true })}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--color-bg)]">
                      <div
                        className={clsx("h-full transition-all", pacing.bar)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-1 text-right font-mono text-xs text-[var(--color-text-secondary)]">
                      {formatPercent(pct, 1)} used
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-[var(--color-border)] pt-3 text-xs">
                    <div>
                      <div className="text-[var(--color-text-muted)]">Avg Daily</div>
                      <div className="font-mono text-white">{formatCurrency(c.avgDailySpend)}</div>
                    </div>
                    <div>
                      <div className="text-[var(--color-text-muted)]">Remaining</div>
                      <div className="font-mono text-white">
                        {formatCurrency(remaining, { compact: true })}
                      </div>
                    </div>
                    <div>
                      <div className="text-[var(--color-text-muted)]">Projected EOM</div>
                      <div className="font-mono text-white">
                        {formatCurrency(c.projectedMonthEnd, { compact: true })}
                      </div>
                    </div>
                    <div>
                      <div className="text-[var(--color-text-muted)]">Days Active</div>
                      <div className="font-mono text-white">{c.daysActive}</div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </PageShell>
  );
}

function BudgetSummary({ data }: { data: BudgetPayload }) {
  const totalSpend = data.campaigns.reduce((s, c) => s + c.spendToDate, 0);
  const totalProjected = data.campaigns.reduce((s, c) => s + c.projectedMonthEnd, 0);
  const activeCount = data.campaigns.filter((c) => c.status === "ACTIVE").length;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card>
        <div className="text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
          Spend to Date
        </div>
        <div className="mt-2 font-mono text-2xl font-semibold text-white">
          {formatCurrency(totalSpend)}
        </div>
        <div className="mt-1 text-xs text-[var(--color-text-secondary)]">
          Across {data.campaigns.length} campaigns
        </div>
      </Card>
      <Card>
        <div className="text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
          Projected Month-End
        </div>
        <div className="mt-2 font-mono text-2xl font-semibold text-white">
          {formatCurrency(totalProjected)}
        </div>
        <div className="mt-1 text-xs text-[var(--color-text-secondary)]">
          Based on current daily run-rate
        </div>
      </Card>
      <Card>
        <div className="text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
          Active Daily Target
        </div>
        <div className="mt-2 font-mono text-2xl font-semibold text-white">
          {formatCurrency(data.monthBudgetTarget)}
        </div>
        <div className="mt-1 text-xs text-[var(--color-text-secondary)]">
          {activeCount} active campaigns
        </div>
      </Card>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Card, CardHeader } from "@/components/Card";
import { KpiCard } from "@/components/KpiCard";
import { StatusBadge } from "@/components/StatusBadge";
import { ChartSkeleton, KpiCardSkeleton, TableSkeleton } from "@/components/Skeleton";
import { ErrorState, EmptyState } from "@/components/States";
import { SpendRoasChart } from "@/components/charts/SpendRoasChart";
import { InsightsFeed } from "@/components/InsightsFeed";
import { useDashboardFetch } from "@/lib/use-fetch";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRoas,
} from "@/lib/format";
import type { OverviewPayload } from "@/lib/meta-api";

export default function OverviewPage() {
  const { data, loading, error, refetch } = useDashboardFetch<OverviewPayload>("/api/overview");

  return (
    <PageShell
      title="Overview"
      description="High-level snapshot of account performance for the selected period."
    >
      {loading && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </div>
          <ChartSkeleton height={320} />
          <TableSkeleton rows={5} />
        </>
      )}

      {error && !loading && <ErrorState message={error} onRetry={refetch} />}

      {data && !loading && !error && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Total Spend"
              value={formatCurrency(data.current.spend)}
              current={data.current.spend}
              previous={data.previous.spend}
              hint={`Prev: ${formatCurrency(data.previous.spend, { compact: true })}`}
              invertChange
            />
            <KpiCard
              label="Total Revenue"
              value={formatCurrency(data.current.revenue)}
              current={data.current.revenue}
              previous={data.previous.revenue}
              hint={`Prev: ${formatCurrency(data.previous.revenue, { compact: true })}`}
            />
            <KpiCard
              label="Blended ROAS"
              value={formatRoas(data.current.roas)}
              current={data.current.roas}
              previous={data.previous.roas}
              hint={`Prev: ${formatRoas(data.previous.roas)}`}
            />
            <KpiCard
              label="Impressions"
              value={formatNumber(data.current.impressions, { compact: true })}
              current={data.current.impressions}
              previous={data.previous.impressions}
              hint={`CTR: ${formatPercent(data.current.ctr)}`}
            />
          </div>

          <InsightsFeed />

          <Card>
            <CardHeader
              title="Daily Spend & ROAS"
              subtitle="Spend on the left axis, ROAS on the right"
            />
            {data.daily.length === 0 ? (
              <EmptyState />
            ) : (
              <SpendRoasChart data={data.daily} />
            )}
          </Card>

          <Card padded={false}>
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Top Campaigns by Spend</h3>
                <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                  Top 5 campaigns in the selected period
                </p>
              </div>
              <Link
                href="/campaigns"
                className="inline-flex items-center gap-1 text-sm text-[var(--color-accent)] hover:underline"
              >
                View All <ChevronRight size={14} />
              </Link>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-secondary)]">
                  <th className="px-5 py-3 font-medium">Campaign</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Spend</th>
                  <th className="px-5 py-3 text-right font-medium">Revenue</th>
                  <th className="px-5 py-3 text-right font-medium">ROAS</th>
                  <th className="px-5 py-3 text-right font-medium">CTR</th>
                </tr>
              </thead>
              <tbody>
                {data.topCampaigns.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-[var(--color-text-secondary)]">
                      No campaign data for this period
                    </td>
                  </tr>
                )}
                {data.topCampaigns.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-[var(--color-border)] text-sm transition hover:bg-[var(--color-card-hover)]"
                  >
                    <td className="px-5 py-3 font-medium text-white">{c.name}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-white">
                      {formatCurrency(c.totals.spend)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-white">
                      {formatCurrency(c.totals.revenue)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-white">
                      {formatRoas(c.totals.roas)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-white">
                      {formatPercent(c.totals.ctr)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </PageShell>
  );
}

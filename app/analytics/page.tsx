"use client";

import clsx from "clsx";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Card, CardHeader } from "@/components/Card";
import { ChartSkeleton } from "@/components/Skeleton";
import { ErrorState, EmptyState } from "@/components/States";
import { SpendRoasChart } from "@/components/charts/SpendRoasChart";
import { CampaignRoasBar } from "@/components/charts/CampaignRoasBar";
import { ImpressionsClicksChart } from "@/components/charts/ImpressionsClicksChart";
import { useDashboardFetch } from "@/lib/use-fetch";
import {
  formatChange,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRoas,
} from "@/lib/format";
import type { AnalyticsPayload } from "@/lib/meta-api";

export default function AnalyticsPage() {
  const { data, loading, error, refetch } = useDashboardFetch<AnalyticsPayload>("/api/analytics");

  return (
    <PageShell
      title="Ad Performance Analytics"
      description="Daily trends, campaign comparisons, and period-over-period change."
    >
      {loading && (
        <>
          <ChartSkeleton height={320} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartSkeleton height={320} />
            <ChartSkeleton height={320} />
          </div>
        </>
      )}

      {error && !loading && <ErrorState message={error} onRetry={refetch} />}

      {data && !loading && !error && (
        <>
          <Card>
            <CardHeader title="Daily Spend & ROAS" subtitle="Spend left axis, ROAS right axis" />
            {data.daily.length === 0 ? <EmptyState /> : <SpendRoasChart data={data.daily} />}
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="ROAS by Campaign"
                subtitle="Color-coded: green ≥4x, yellow 2–4x, red <2x"
              />
              <CampaignRoasBar
                data={data.byCampaign.map((c) => ({
                  name: c.name,
                  roas: c.totals.roas,
                  spend: c.totals.spend,
                }))}
              />
            </Card>
            <Card>
              <CardHeader title="Impressions & Clicks" subtitle="Daily volume across the account" />
              <ImpressionsClicksChart data={data.daily} />
            </Card>
          </div>

          <Card padded={false}>
            <div className="border-b border-[var(--color-border)] px-5 py-4">
              <h3 className="text-sm font-semibold text-white">Period Comparison</h3>
              <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                Current period vs. previous equivalent period
              </p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-secondary)]">
                  <th className="px-5 py-3 font-medium">Metric</th>
                  <th className="px-5 py-3 text-right font-medium">Current</th>
                  <th className="px-5 py-3 text-right font-medium">Previous</th>
                  <th className="px-5 py-3 text-right font-medium">Change</th>
                </tr>
              </thead>
              <tbody>
                <ComparisonRow label="Spend" current={data.current.spend} previous={data.previous.spend} format="currency" invert />
                <ComparisonRow label="Revenue" current={data.current.revenue} previous={data.previous.revenue} format="currency" />
                <ComparisonRow label="Impressions" current={data.current.impressions} previous={data.previous.impressions} format="number" />
                <ComparisonRow label="Clicks" current={data.current.clicks} previous={data.previous.clicks} format="number" />
                <ComparisonRow label="CTR" current={data.current.ctr} previous={data.previous.ctr} format="percent" />
                <ComparisonRow label="CPC" current={data.current.cpc} previous={data.previous.cpc} format="currency" invert />
                <ComparisonRow label="CPM" current={data.current.cpm} previous={data.previous.cpm} format="currency" invert />
                <ComparisonRow label="ROAS" current={data.current.roas} previous={data.previous.roas} format="roas" />
              </tbody>
            </table>
          </Card>
        </>
      )}
    </PageShell>
  );
}

function ComparisonRow({
  label,
  current,
  previous,
  format,
  invert,
}: {
  label: string;
  current: number;
  previous: number;
  format: "currency" | "number" | "percent" | "roas";
  invert?: boolean;
}) {
  const fmt = (v: number) => {
    if (format === "currency") return formatCurrency(v);
    if (format === "percent") return formatPercent(v);
    if (format === "roas") return formatRoas(v);
    return formatNumber(v);
  };
  const change = formatChange(current, previous);
  const isPositive = invert ? change.direction === "down" : change.direction === "up";
  const isNegative = invert ? change.direction === "up" : change.direction === "down";
  const Icon =
    change.direction === "up" ? ArrowUpRight : change.direction === "down" ? ArrowDownRight : Minus;
  return (
    <tr className="border-b border-[var(--color-border)] text-sm">
      <td className="px-5 py-3 font-medium text-white">{label}</td>
      <td className="px-5 py-3 text-right font-mono text-white">{fmt(current)}</td>
      <td className="px-5 py-3 text-right font-mono text-[var(--color-text-secondary)]">{fmt(previous)}</td>
      <td className="px-5 py-3 text-right">
        <span
          className={clsx(
            "inline-flex items-center gap-1 font-mono font-medium",
            isPositive
              ? "text-[var(--color-positive)]"
              : isNegative
                ? "text-[var(--color-negative)]"
                : "text-[var(--color-neutral)]",
          )}
        >
          <Icon size={12} />
          {change.display}
        </span>
      </td>
    </tr>
  );
}

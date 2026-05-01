"use client";

import { useState } from "react";
import clsx from "clsx";
import { ArrowDown, ChevronDown } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Card, CardHeader } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { ChartSkeleton, KpiCardSkeleton } from "@/components/Skeleton";
import { ErrorState, EmptyState } from "@/components/States";
import { useDashboardFetch } from "@/lib/use-fetch";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import type { FunnelPayload, FunnelStage, FunnelByCampaign } from "@/lib/funnel";

const STAGE_GRADIENT = [
  "from-[#c8714a] to-[#e08a5e]",
  "from-[#e08a5e] to-[#e8a37c]",
  "from-[#e8a37c] to-[#cf9bc1]",
  "from-[#cf9bc1] to-[#a78bfa]",
  "from-[#a78bfa] to-[#7c8df0]",
  "from-[#7c8df0] to-[#60a5fa]",
];

export default function FunnelPage() {
  const { data, loading, error, refetch } = useDashboardFetch<FunnelPayload>("/api/funnel");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");

  return (
    <PageShell
      title="Funnel View"
      description="Track where users drop off — from impression all the way to purchase."
    >
      {loading && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </div>
          <ChartSkeleton height={500} />
        </>
      )}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}

      {data && !loading && !error && (
        <>
          <BenchmarkRow benchmarks={data.benchmarks} />

          <Card>
            <CardHeader
              title="Account Funnel"
              subtitle="Click any stage to see drop-off vs the previous step"
              action={
                <select
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-sm text-white focus:border-[var(--color-accent)] focus:outline-none"
                >
                  <option value="all">All Campaigns (Account Total)</option>
                  {data.byCampaign.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              }
            />
            {selectedCampaign === "all" ? (
              data.total[0].count === 0 ? (
                <EmptyState />
              ) : (
                <FunnelChart stages={data.total} />
              )
            ) : (
              (() => {
                const c = data.byCampaign.find((c) => c.id === selectedCampaign);
                if (!c) return <EmptyState />;
                return (
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{c.name}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <FunnelChart stages={c.stages} />
                  </div>
                );
              })()
            )}
          </Card>

          <Card padded={false}>
            <div className="border-b border-[var(--color-border)] px-5 py-4">
              <h3 className="text-sm font-semibold text-white">Funnel by Campaign</h3>
              <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                Conversion rate at each stage — find your weakest link
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-secondary)]">
                    <th className="px-5 py-3 font-medium">Campaign</th>
                    <th className="px-5 py-3 text-right font-medium">Impr.</th>
                    <th className="px-5 py-3 text-right font-medium">CTR</th>
                    <th className="px-5 py-3 text-right font-medium">LPV</th>
                    <th className="px-5 py-3 text-right font-medium">ATC %</th>
                    <th className="px-5 py-3 text-right font-medium">Checkout %</th>
                    <th className="px-5 py-3 text-right font-medium">Purchase %</th>
                    <th className="px-5 py-3 text-right font-medium">CPA</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byCampaign.map((c) => (
                    <CampaignFunnelRow key={c.id} c={c} />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </PageShell>
  );
}

function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const top = stages[0].count;
  return (
    <div className="space-y-2">
      {stages.map((s, i) => {
        const widthPct = top > 0 ? (s.count / top) * 100 : 0;
        const dropoff = i === 0 ? 0 : 100 - s.rateFromPrev;
        return (
          <div key={s.id}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">{s.label}</span>
                {i > 0 && (
                  <span className="font-mono text-[var(--color-text-secondary)]">
                    {formatPercent(s.rateFromPrev, 1)} from prev
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[var(--color-text-secondary)]">
                  CPA: {formatCurrency(s.cost, { compact: true })}
                </span>
                <span className="font-mono font-semibold text-white">
                  {formatNumber(s.count)}
                </span>
              </div>
            </div>
            <div className="relative h-12 w-full">
              <div
                className={clsx(
                  "absolute left-1/2 h-full -translate-x-1/2 rounded-md bg-gradient-to-r transition-all duration-500",
                  STAGE_GRADIENT[i],
                )}
                style={{ width: `${Math.max(2, widthPct)}%` }}
              >
                <div className="flex h-full items-center justify-center px-2">
                  <span className="font-mono text-sm font-semibold text-white drop-shadow">
                    {formatPercent(s.rateFromTop, 1)}
                  </span>
                </div>
              </div>
            </div>
            {i < stages.length - 1 && (
              <div className="flex items-center justify-center py-1 text-xs text-[var(--color-text-muted)]">
                <ArrowDown size={12} className="mr-1" />
                Drop-off:{" "}
                <span
                  className={clsx(
                    "ml-1 font-mono font-medium",
                    dropoff > 60
                      ? "text-[var(--color-negative)]"
                      : dropoff > 30
                        ? "text-[var(--color-warning)]"
                        : "text-[var(--color-positive)]",
                  )}
                >
                  -{dropoff.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BenchmarkRow({ benchmarks }: { benchmarks: FunnelPayload["benchmarks"] }) {
  const items: Array<{ label: string; value: number; benchmark: number; suffix: string }> = [
    { label: "CTR (Impr → Click)", value: benchmarks.impressionToClick.value, benchmark: benchmarks.impressionToClick.benchmark, suffix: "%" },
    { label: "Click → LPV", value: benchmarks.clickToLpv.value, benchmark: benchmarks.clickToLpv.benchmark, suffix: "%" },
    { label: "LPV → ATC", value: benchmarks.lpvToAtc.value, benchmark: benchmarks.lpvToAtc.benchmark, suffix: "%" },
    { label: "ATC → Checkout", value: benchmarks.atcToCheckout.value, benchmark: benchmarks.atcToCheckout.benchmark, suffix: "%" },
    { label: "Checkout → Purchase", value: benchmarks.checkoutToPurchase.value, benchmark: benchmarks.checkoutToPurchase.benchmark, suffix: "%" },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {items.map((it) => {
        const ratio = it.value / it.benchmark;
        const cls =
          ratio >= 0.95
            ? "text-[var(--color-positive)]"
            : ratio >= 0.7
              ? "text-[var(--color-warning)]"
              : "text-[var(--color-negative)]";
        return (
          <Card key={it.label}>
            <div className="text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
              {it.label}
            </div>
            <div className={clsx("mt-2 font-mono text-2xl font-semibold", cls)}>
              {it.value.toFixed(it.value < 5 ? 2 : 1)}
              <span className="text-base">{it.suffix}</span>
            </div>
            <div className="mt-1 text-xs text-[var(--color-text-muted)]">
              Benchmark: {it.benchmark}
              {it.suffix}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function CampaignFunnelRow({ c }: { c: FunnelByCampaign }) {
  const [open, setOpen] = useState(false);
  const stage = (id: string) => c.stages.find((s) => s.id === id)!;
  const ctr = stage("impressions").count > 0
    ? (stage("clicks").count / stage("impressions").count) * 100
    : 0;
  const purchases = stage("purchase").count;
  const cpa = purchases > 0 ? c.stages[0].cost * stage("impressions").count / purchases : 0;

  const lpv = stage("lpv");
  const atc = stage("atc");
  const checkout = stage("checkout");
  const purchase = stage("purchase");

  return (
    <>
      <tr
        className="border-b border-[var(--color-border)] text-sm transition hover:bg-[var(--color-card-hover)] cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        <td className="px-5 py-3">
          <div className="flex items-center gap-2">
            <ChevronDown
              size={14}
              className={clsx(
                "text-[var(--color-text-secondary)] transition",
                open && "rotate-180",
              )}
            />
            <span className="font-medium text-white">{c.name}</span>
            <StatusBadge status={c.status} />
          </div>
        </td>
        <td className="px-5 py-3 text-right font-mono text-white">
          {formatNumber(stage("impressions").count, { compact: true })}
        </td>
        <td className="px-5 py-3 text-right font-mono text-white">{formatPercent(ctr)}</td>
        <td className="px-5 py-3 text-right font-mono text-white">
          {formatNumber(lpv.count, { compact: true })}
        </td>
        <ConversionCell rate={atc.rateFromPrev} />
        <ConversionCell rate={checkout.rateFromPrev} />
        <ConversionCell rate={purchase.rateFromPrev} />
        <td className="px-5 py-3 text-right font-mono text-white">
          {purchases > 0 ? formatCurrency(c.stages[0].cost * stage("impressions").count / purchases) : "—"}
        </td>
      </tr>
      {open && (
        <tr className="bg-[var(--color-bg)]">
          <td colSpan={8} className="px-5 py-5">
            <FunnelChart stages={c.stages} />
          </td>
        </tr>
      )}
    </>
  );
}

function ConversionCell({ rate }: { rate: number }) {
  const cls =
    rate >= 60
      ? "text-[var(--color-positive)]"
      : rate >= 25
        ? "text-[var(--color-warning)]"
        : "text-[var(--color-negative)]";
  return (
    <td className={clsx("px-5 py-3 text-right font-mono font-semibold", cls)}>
      {formatPercent(rate, 1)}
    </td>
  );
}

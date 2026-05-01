"use client";

import { PageShell } from "@/components/PageShell";
import { Card, CardHeader } from "@/components/Card";
import { ChartSkeleton, TableSkeleton } from "@/components/Skeleton";
import { ErrorState, EmptyState } from "@/components/States";
import { AgeGenderChart } from "@/components/charts/AgeGenderChart";
import { DeviceDonut } from "@/components/charts/DeviceDonut";
import { PlacementBar } from "@/components/charts/PlacementBar";
import { useDashboardFetch } from "@/lib/use-fetch";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRoas,
} from "@/lib/format";
import type { AudiencesPayload } from "@/lib/meta-api";

export default function AudiencesPage() {
  const { data, loading, error, refetch } = useDashboardFetch<AudiencesPayload>("/api/audiences");

  return (
    <PageShell
      title="Audience Insights"
      description="Demographic, geographic, device, and placement breakdowns."
    >
      {loading && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartSkeleton height={320} />
            <ChartSkeleton height={320} />
          </div>
          <TableSkeleton rows={6} />
          <ChartSkeleton height={320} />
        </>
      )}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}

      {data && !loading && !error && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Age & Gender" subtitle="Impressions by demographic group" />
              {data.demographics.length === 0 ? (
                <EmptyState />
              ) : (
                <AgeGenderChart data={data.demographics} />
              )}
            </Card>

            <Card>
              <CardHeader title="Device Mix" subtitle="Spend distribution by device type" />
              {data.devices.length === 0 ? <EmptyState /> : <DeviceDonut data={data.devices} />}
            </Card>
          </div>

          <Card padded={false}>
            <div className="border-b border-[var(--color-border)] px-5 py-4">
              <h3 className="text-sm font-semibold text-white">Top Geographies</h3>
              <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                Top 10 countries by spend
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-secondary)]">
                    <th className="px-5 py-3 font-medium">Country</th>
                    <th className="px-5 py-3 text-right font-medium">Spend</th>
                    <th className="px-5 py-3 text-right font-medium">Impressions</th>
                    <th className="px-5 py-3 text-right font-medium">Clicks</th>
                    <th className="px-5 py-3 text-right font-medium">CTR</th>
                    <th className="px-5 py-3 text-right font-medium">ROAS</th>
                  </tr>
                </thead>
                <tbody>
                  {data.countries.map((c) => {
                    const ctr = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
                    const roas = c.spend > 0 ? c.revenue / c.spend : 0;
                    return (
                      <tr
                        key={c.countryCode}
                        className="border-b border-[var(--color-border)] text-sm transition hover:bg-[var(--color-card-hover)]"
                      >
                        <td className="px-5 py-3 text-white">
                          <span className="font-mono text-xs text-[var(--color-text-secondary)]">
                            {c.countryCode}
                          </span>{" "}
                          {c.country}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-white">
                          {formatCurrency(c.spend)}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-white">
                          {formatNumber(c.impressions)}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-white">
                          {formatNumber(c.clicks)}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-white">
                          {formatPercent(ctr)}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-white">
                          {formatRoas(roas)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader title="Placement Performance" subtitle="Spend by where the ad ran" />
            {data.placements.length === 0 ? (
              <EmptyState />
            ) : (
              <PlacementBar data={data.placements} />
            )}
          </Card>
        </>
      )}
    </PageShell>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import clsx from "clsx";
import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { TableSkeleton } from "@/components/Skeleton";
import { ErrorState, EmptyState } from "@/components/States";
import { useDashboardFetch } from "@/lib/use-fetch";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRoas,
} from "@/lib/format";
import type { AdSetsPayload } from "@/lib/meta-api";

export default function AdSetsPage() {
  const { data, loading, error, refetch } = useDashboardFetch<AdSetsPayload>("/api/ad-sets");
  const [query, setQuery] = useState("");
  const [campaignFilter, setCampaignFilter] = useState<string>("all");

  const campaignOptions = useMemo(() => {
    if (!data) return [];
    const seen = new Map<string, string>();
    for (const s of data.adSets) seen.set(s.campaignId, s.campaignName);
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [data]);

  const rows = useMemo(() => {
    if (!data) return [];
    return data.adSets
      .filter((s) => {
        const matchQuery =
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.campaignName.toLowerCase().includes(query.toLowerCase());
        const matchCampaign = campaignFilter === "all" || s.campaignId === campaignFilter;
        return matchQuery && matchCampaign;
      })
      .sort((a, b) => b.totals.spend - a.totals.spend);
  }, [data, query, campaignFilter]);

  return (
    <PageShell title="Ad Sets" description="Performance breakdown by ad set within each campaign.">
      {loading && <TableSkeleton rows={8} />}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}

      {data && !loading && !error && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search ad sets..."
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] py-2 pl-9 pr-3 text-sm text-white placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>
            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-white focus:border-[var(--color-accent)] focus:outline-none"
            >
              <option value="all">All Campaigns</option>
              {campaignOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="text-xs text-[var(--color-text-secondary)]">
              {rows.length} of {data.adSets.length} ad sets
            </div>
          </div>

          {rows.length === 0 ? (
            <EmptyState title="No ad sets match your filters" />
          ) : (
            <Card padded={false}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-secondary)]">
                      <th className="px-5 py-3 font-medium">Ad Set</th>
                      <th className="px-5 py-3 font-medium">Campaign</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 text-right font-medium">Spend</th>
                      <th className="px-5 py-3 text-right font-medium">Impressions</th>
                      <th className="px-5 py-3 text-right font-medium">Clicks</th>
                      <th className="px-5 py-3 text-right font-medium">CTR</th>
                      <th className="px-5 py-3 text-right font-medium">ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((s) => (
                      <tr
                        key={s.id}
                        className="border-b border-[var(--color-border)] text-sm transition hover:bg-[var(--color-card-hover)]"
                      >
                        <td className="max-w-[280px] truncate px-5 py-3 font-medium text-white">{s.name}</td>
                        <td className="px-5 py-3 text-[var(--color-text-secondary)]">
                          {s.campaignName}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={s.status} />
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-white">
                          {formatCurrency(s.totals.spend)}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-white">
                          {formatNumber(s.totals.impressions)}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-white">
                          {formatNumber(s.totals.clicks)}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-white">
                          {formatPercent(s.totals.ctr)}
                        </td>
                        <td
                          className={clsx(
                            "px-5 py-3 text-right font-mono font-semibold",
                            s.totals.roas >= 4
                              ? "text-[var(--color-positive)]"
                              : s.totals.roas >= 2
                                ? "text-[var(--color-warning)]"
                                : "text-[var(--color-negative)]",
                          )}
                        >
                          {formatRoas(s.totals.roas)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </PageShell>
  );
}

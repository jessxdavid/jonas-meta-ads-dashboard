"use client";

import { useMemo, useState } from "react";
import { Search, ArrowUp, ArrowDown } from "lucide-react";
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
import type { CampaignsPayload } from "@/lib/meta-api";

type SortKey = "name" | "spend" | "impressions" | "clicks" | "ctr" | "cpc" | "roas" | "followers" | "costPerFollower";
type SortDir = "asc" | "desc";

export default function CampaignsPage() {
  const { data, loading, error, refetch } = useDashboardFetch<CampaignsPayload>("/api/campaigns");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("spend");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [statusFilter, setStatusFilter] = useState<"all" | "ACTIVE" | "PAUSED" | "ENDED">("all");

  const rows = useMemo(() => {
    if (!data) return [];
    const filtered = data.campaigns.filter((c) => {
      const matchQuery = c.name.toLowerCase().includes(query.toLowerCase());
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      return matchQuery && matchStatus;
    });
    return filtered.sort((a, b) => {
      let av: number | string;
      let bv: number | string;
      if (sortKey === "name") {
        av = a.name;
        bv = b.name;
      } else {
        av = a.totals[sortKey];
        bv = b.totals[sortKey];
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, query, sortKey, sortDir, statusFilter]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setSortDir(k === "name" ? "asc" : "desc");
    }
  };

  return (
    <PageShell
      title="Campaigns"
      description="All campaigns and their performance for the selected period."
    >
      {loading && <TableSkeleton rows={6} />}
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
                placeholder="Search campaigns..."
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] py-2 pl-9 pr-3 text-sm text-white placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>
            <div className="flex gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-1">
              {(["all", "ACTIVE", "PAUSED", "ENDED"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={clsx(
                    "rounded-md px-3 py-1 text-xs font-medium transition",
                    statusFilter === s
                      ? "bg-[var(--color-accent)] text-white"
                      : "text-[var(--color-text-secondary)] hover:text-white",
                  )}
                >
                  {s === "all" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            <div className="text-xs text-[var(--color-text-secondary)]">
              {rows.length} of {data.campaigns.length} campaigns
            </div>
          </div>

          {rows.length === 0 ? (
            <EmptyState title="No campaigns match your filters" message="Try adjusting your search or status filter." />
          ) : (
            <Card padded={false}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-secondary)]">
                      <SortHeader label="Campaign" k="name" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 text-left font-medium">Objective</th>
                      <SortHeader label="Spend" k="spend" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                      <SortHeader label="Impressions" k="impressions" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                      <SortHeader label="Clicks" k="clicks" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                      <SortHeader label="CTR" k="ctr" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                      <SortHeader label="CPC" k="cpc" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                      <SortHeader label="Followers" k="followers" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                      <SortHeader label="Cost / Follower" k="costPerFollower" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                      <SortHeader label="ROAS" k="roas" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((c) => (
                      <tr
                        key={c.id}
                        className="border-b border-[var(--color-border)] text-sm transition hover:bg-[var(--color-card-hover)]"
                      >
                        <td className="max-w-[280px] truncate px-5 py-3 font-medium text-white">{c.name}</td>
                        <td className="px-5 py-3">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-[var(--color-text-secondary)]">
                          {c.objective.replace("OUTCOME_", "")}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-white">
                          {formatCurrency(c.totals.spend)}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-white">
                          {formatNumber(c.totals.impressions)}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-white">
                          {formatNumber(c.totals.clicks)}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-white">
                          {formatPercent(c.totals.ctr)}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-white">
                          {formatCurrency(c.totals.cpc)}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-white">
                          {formatNumber(c.totals.followers)}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-white">
                          {c.totals.followers > 0 ? formatCurrency(c.totals.costPerFollower) : "—"}
                        </td>
                        <td
                          className={clsx(
                            "px-5 py-3 text-right font-mono font-semibold",
                            c.totals.roas >= 4
                              ? "text-[var(--color-positive)]"
                              : c.totals.roas >= 2
                                ? "text-[var(--color-warning)]"
                                : "text-[var(--color-negative)]",
                          )}
                        >
                          {formatRoas(c.totals.roas)}
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

function SortHeader({
  label,
  k,
  sortKey,
  sortDir,
  onClick,
  align = "left",
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onClick: (k: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sortKey === k;
  return (
    <th className={clsx("px-5 py-3 font-medium", align === "right" && "text-right")}>
      <button
        onClick={() => onClick(k)}
        className={clsx(
          "inline-flex items-center gap-1 transition hover:text-white",
          active && "text-white",
        )}
      >
        {label}
        {active && (sortDir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
      </button>
    </th>
  );
}

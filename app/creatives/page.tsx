"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ExternalLink, Film, Image as ImageIcon, Layers, Play } from "lucide-react";
import clsx from "clsx";
import { PageShell } from "@/components/PageShell";
import { GridSkeleton } from "@/components/Skeleton";
import { ErrorState, EmptyState } from "@/components/States";
import { PerformanceBadge, tierFromRoas } from "@/components/PerformanceBadge";
import { useDashboardFetch } from "@/lib/use-fetch";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRoas,
} from "@/lib/format";
import type { CreativesPayload } from "@/lib/meta-api";

const FORMAT_ICON: Record<string, React.ElementType> = {
  image: ImageIcon,
  video: Film,
  carousel: Layers,
};

type CreativeRow = CreativesPayload["creatives"][number];

function CreativePreview({ creative }: { creative: CreativeRow }) {
  const [playing, setPlaying] = useState(false);
  const isVideo = creative.format === "video";
  const poster = creative.videoPosterUrl ?? creative.imageUrl ?? creative.thumbnailUrl;
  const stillImage = creative.imageUrl ?? creative.thumbnailUrl;

  if (isVideo && creative.videoUrl && playing) {
    return (
      <video
        src={creative.videoUrl}
        poster={poster}
        controls
        autoPlay
        playsInline
        className="absolute inset-0 h-full w-full bg-black object-contain"
      />
    );
  }

  return (
    <>
      {(isVideo ? poster : stillImage) ? (
        <Image
          src={isVideo ? poster : stillImage}
          alt={creative.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition group-hover:scale-105"
          unoptimized
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[var(--color-bg)] text-xs text-[var(--color-text-muted)]">
          No preview
        </div>
      )}
      {isVideo && creative.videoUrl && (
        <button
          onClick={(e) => {
            e.preventDefault();
            setPlaying(true);
          }}
          aria-label={`Play ${creative.name}`}
          className="absolute inset-0 flex items-center justify-center bg-black/30 transition hover:bg-black/50"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-black shadow-lg transition group-hover:scale-110">
            <Play size={24} fill="currentColor" />
          </span>
        </button>
      )}
      {isVideo && !creative.videoUrl && creative.permalinkUrl && (
        <a
          href={creative.permalinkUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${creative.name} on Facebook`}
          className="absolute inset-0 flex items-center justify-center bg-black/30 transition hover:bg-black/50"
        >
          <span className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-black shadow-lg">
            <ExternalLink size={14} /> Watch on Facebook
          </span>
        </a>
      )}
    </>
  );
}

export default function CreativesPage() {
  const { data, loading, error, refetch } = useDashboardFetch<CreativesPayload>("/api/creatives");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState<"all" | "top" | "average" | "underperforming">("all");

  const campaignOptions = useMemo(() => {
    if (!data) return [];
    const seen = new Map<string, string>();
    for (const c of data.creatives) seen.set(c.campaignId, c.campaignName);
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.creatives
      .filter((c) => {
        const matchCampaign = campaignFilter === "all" || c.campaignId === campaignFilter;
        const matchTier = tierFilter === "all" || tierFromRoas(c.totals.roas) === tierFilter;
        return matchCampaign && matchTier;
      })
      .sort((a, b) => b.totals.spend - a.totals.spend);
  }, [data, campaignFilter, tierFilter]);

  return (
    <PageShell
      title="Creative Library"
      description="Every ad creative with thumbnail and core performance metrics."
    >
      {loading && <GridSkeleton count={9} />}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}

      {data && !loading && !error && (
        <>
          <div className="flex flex-wrap items-center gap-3">
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
            <div className="flex gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-1">
              {([
                { id: "all", label: "All" },
                { id: "top", label: "Top" },
                { id: "average", label: "Average" },
                { id: "underperforming", label: "Underperforming" },
              ] as const).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTierFilter(t.id)}
                  className={clsx(
                    "rounded-md px-3 py-1 text-xs font-medium transition",
                    tierFilter === t.id
                      ? "bg-[var(--color-accent)] text-white"
                      : "text-[var(--color-text-secondary)] hover:text-white",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="text-xs text-[var(--color-text-secondary)]">
              {filtered.length} of {data.creatives.length} creatives
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="No creatives match your filters" />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c) => {
                const tier = tierFromRoas(c.totals.roas);
                const Icon = FORMAT_ICON[c.format] ?? ImageIcon;
                return (
                  <div
                    key={c.id}
                    className="group overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] transition hover:border-[var(--color-border-strong)]"
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-[var(--color-bg)]">
                      <CreativePreview creative={c} />
                      <div className="pointer-events-none absolute left-3 top-3">
                        <PerformanceBadge tier={tier} />
                      </div>
                      <div className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white backdrop-blur">
                        <Icon size={12} />
                        {c.format}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <div className="truncate text-sm font-semibold text-white">{c.name}</div>
                        {c.permalinkUrl && (
                          <a
                            href={c.permalinkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-[var(--color-text-muted)] hover:text-white"
                            aria-label="Open on Facebook"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                      <div className="mb-3 truncate text-xs text-[var(--color-text-secondary)]">
                        {c.campaignName}
                      </div>
                      <div className="grid grid-cols-2 gap-2 border-t border-[var(--color-border)] pt-3 text-xs">
                        <div>
                          <div className="text-[var(--color-text-muted)]">Spend</div>
                          <div className="font-mono text-white">{formatCurrency(c.totals.spend, { compact: true })}</div>
                        </div>
                        <div>
                          <div className="text-[var(--color-text-muted)]">Impr.</div>
                          <div className="font-mono text-white">{formatNumber(c.totals.impressions, { compact: true })}</div>
                        </div>
                        <div>
                          <div className="text-[var(--color-text-muted)]">CTR</div>
                          <div className="font-mono text-white">{formatPercent(c.totals.ctr)}</div>
                        </div>
                        <div>
                          <div className="text-[var(--color-text-muted)]">ROAS</div>
                          <div
                            className={clsx(
                              "font-mono font-semibold",
                              tier === "top"
                                ? "text-[var(--color-positive)]"
                                : tier === "average"
                                  ? "text-[var(--color-warning)]"
                                  : "text-[var(--color-negative)]",
                            )}
                          >
                            {formatRoas(c.totals.roas)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}

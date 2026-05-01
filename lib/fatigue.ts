import type { DateRange, Insight } from "@/types/meta";
import { filterInsights } from "./mock-data";
import { getCampaigns, getCreatives } from "./meta-api";

export type FatigueStatus = "fresh" | "watch" | "fatigued" | "no_data";

export interface FatigueScore {
  status: FatigueStatus;
  score: number;
  ctrTrend: number;
  frequency: number;
  cpcTrend: number;
}

export interface CreativeFatigueRow {
  id: string;
  campaignId: string;
  campaignName: string;
  name: string;
  thumbnailUrl: string;
  format: "image" | "video" | "carousel";
  daily: Array<{ date: string; ctr: number; frequency: number; cpc: number; spend: number }>;
  totals: { spend: number; impressions: number; clicks: number; revenue: number; ctr: number; cpc: number; roas: number };
  fatigue: FatigueScore;
  recommendation: string;
}

export interface FatiguePayload {
  creatives: CreativeFatigueRow[];
}

function ctrFromTotals(t: { clicks: number; impressions: number }): number {
  return t.impressions > 0 ? (t.clicks / t.impressions) * 100 : 0;
}

function reduceTotals(rows: Insight[]) {
  return rows.reduce(
    (a, r) => {
      a.spend += r.spend;
      a.impressions += r.impressions;
      a.clicks += r.clicks;
      a.revenue += r.revenue;
      return a;
    },
    { spend: 0, impressions: 0, clicks: 0, revenue: 0 },
  );
}

function computeFatigue(daily: Insight[]): FatigueScore {
  if (daily.length < 7) {
    return { status: "no_data", score: 0, ctrTrend: 0, frequency: 0, cpcTrend: 0 };
  }
  const recent = daily.slice(-7);
  const prior = daily.length >= 14 ? daily.slice(-14, -7) : [];

  const recentT = reduceTotals(recent);
  const priorT = prior.length > 0 ? reduceTotals(prior) : null;

  const recentCtr = ctrFromTotals(recentT);
  const priorCtr = priorT ? ctrFromTotals(priorT) : recentCtr;
  const ctrTrend = priorCtr > 0 ? ((recentCtr - priorCtr) / priorCtr) * 100 : 0;

  const recentCpc = recentT.clicks > 0 ? recentT.spend / recentT.clicks : 0;
  const priorCpc = priorT && priorT.clicks > 0 ? priorT.spend / priorT.clicks : recentCpc;
  const cpcTrend = priorCpc > 0 ? ((recentCpc - priorCpc) / priorCpc) * 100 : 0;

  const totalImpr = daily.reduce((s, d) => s + d.impressions, 0);
  const reachEstimate = Math.max(1, totalImpr / 2.2);
  const frequency = totalImpr / reachEstimate;

  let score = 0;
  if (ctrTrend < -25) score += 40;
  else if (ctrTrend < -10) score += 20;
  if (cpcTrend > 25) score += 25;
  else if (cpcTrend > 10) score += 12;
  if (frequency > 3.5) score += 25;
  else if (frequency > 2.5) score += 12;

  let status: FatigueStatus;
  if (score >= 50) status = "fatigued";
  else if (score >= 20) status = "watch";
  else status = "fresh";

  return { status, score, ctrTrend, frequency, cpcTrend };
}

function recommendationFor(f: FatigueScore): string {
  if (f.status === "fatigued") {
    if (f.frequency > 3.5) return "Audience saturated. Pause this creative and ship a fresh angle.";
    if (f.ctrTrend < -25) return "CTR is declining sharply. Refresh the hook or visuals.";
    return "Pause this creative. Ship a fresh angle.";
  }
  if (f.status === "watch") {
    if (f.frequency > 2.5) return "Frequency is climbing. Queue a refresh in the next 7 days.";
    return "Soft decline detected. Monitor daily — refresh if it worsens.";
  }
  if (f.status === "no_data") return "Not enough history yet (needs 7+ days).";
  return "Performing well. Keep running.";
}

export async function getFatiguePayload(range: DateRange): Promise<FatiguePayload> {
  const [campaigns, ads] = await Promise.all([getCampaigns(range), getCreatives(range)]);
  const campaignName = (id: string) => campaigns.find((c) => c.id === id)?.name ?? "—";

  const creatives: CreativeFatigueRow[] = ads.map((cr) => {
    const slice = filterInsights(cr.daily, range.since, range.until);
    const fatigue = computeFatigue(slice);
    const totals = reduceTotals(slice);
    const ctr = ctrFromTotals(totals);
    const cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
    const roas = totals.spend > 0 ? totals.revenue / totals.spend : 0;

    let runningReach = 0;
    const daily = slice.map((d) => {
      runningReach += d.impressions / 2.2;
      const cumImpr = slice
        .filter((row) => row.date <= d.date)
        .reduce((s, r) => s + r.impressions, 0);
      const cumReach = Math.max(1, cumImpr / 2.2);
      return {
        date: d.date,
        ctr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0,
        frequency: cumImpr / cumReach,
        cpc: d.clicks > 0 ? d.spend / d.clicks : 0,
        spend: d.spend,
      };
    });

    return {
      id: cr.id,
      campaignId: cr.campaignId,
      campaignName: campaignName(cr.campaignId),
      name: cr.name,
      thumbnailUrl: cr.thumbnailUrl,
      format: cr.format,
      daily,
      totals: { ...totals, ctr, cpc, roas },
      fatigue,
      recommendation: recommendationFor(fatigue),
    };
  });

  const STATUS_RANK: Record<FatigueStatus, number> = {
    fatigued: 0,
    watch: 1,
    fresh: 2,
    no_data: 3,
  };
  creatives.sort((a, b) => {
    const r = STATUS_RANK[a.fatigue.status] - STATUS_RANK[b.fatigue.status];
    if (r !== 0) return r;
    return b.totals.spend - a.totals.spend;
  });
  return { creatives };
}

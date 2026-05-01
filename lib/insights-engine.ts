import type { DateRange, Insight } from "@/types/meta";
import { filterInsights } from "./mock-data";
import { campaignTotals, getAudiences, getCampaigns, getCreatives } from "./meta-api";

export type InsightSeverity = "high" | "medium" | "low";
export type InsightCategory = "scale" | "kill" | "fatigue" | "anomaly" | "budget" | "audience";

export interface OptimizationInsight {
  id: string;
  severity: InsightSeverity;
  category: InsightCategory;
  title: string;
  body: string;
  metric?: { label: string; value: string };
  entity?: { type: "campaign" | "creative" | "ad_set"; id: string; name: string };
}

const SEVERITY_RANK: Record<InsightSeverity, number> = { high: 0, medium: 1, low: 2 };

function totalsOver(insights: Insight[]) {
  return insights.reduce(
    (a, i) => {
      a.spend += i.spend;
      a.impressions += i.impressions;
      a.clicks += i.clicks;
      a.revenue += i.revenue;
      return a;
    },
    { spend: 0, impressions: 0, clicks: 0, revenue: 0 },
  );
}

function ctrOf(t: { clicks: number; impressions: number }) {
  return t.impressions > 0 ? (t.clicks / t.impressions) * 100 : 0;
}

function roasOf(t: { revenue: number; spend: number }) {
  return t.spend > 0 ? t.revenue / t.spend : 0;
}

function lastNDays(daily: Insight[], n: number): Insight[] {
  return daily.slice(-n);
}

function priorNDays(daily: Insight[], n: number, skip: number): Insight[] {
  if (daily.length < skip + n) return [];
  return daily.slice(-skip - n, -skip);
}

export async function generateInsights(range: DateRange): Promise<OptimizationInsight[]> {
  const [campaigns, ads, audiences] = await Promise.all([
    getCampaigns(range),
    getCreatives(range),
    getAudiences(range),
  ]);
  const out: OptimizationInsight[] = [];

  const accountTotals = (() => {
    const all = campaigns.flatMap((c) => filterInsights(c.daily, range.since, range.until));
    return totalsOver(all);
  })();
  const accountSpend = accountTotals.spend;

  for (const c of campaigns) {
    const slice = filterInsights(c.daily, range.since, range.until);
    if (slice.length === 0) continue;
    const t = campaignTotals(c, range);
    const sharePct = accountSpend > 0 ? (t.spend / accountSpend) * 100 : 0;

    if (c.status === "ACTIVE" && t.roas >= 5 && sharePct < 20 && t.spend > 200) {
      out.push({
        id: `scale-${c.id}`,
        severity: "high",
        category: "scale",
        title: `Scale "${c.name}"`,
        body: `${c.name} is delivering ${t.roas.toFixed(1)}x ROAS but only consuming ${sharePct.toFixed(1)}% of total spend. Increase the daily budget by 20–30% and re-evaluate in 3 days.`,
        metric: { label: "ROAS", value: `${t.roas.toFixed(2)}x` },
        entity: { type: "campaign", id: c.id, name: c.name },
      });
    }

    if (c.status === "ACTIVE" && t.revenue > 0 && t.roas < 1.5 && t.spend > 500) {
      out.push({
        id: `kill-${c.id}`,
        severity: "high",
        category: "kill",
        title: `Pause "${c.name}"`,
        body: `${c.name} has ${t.roas.toFixed(2)}x ROAS over the period and has consumed ${t.spend.toFixed(0)} USD. It's losing money — pause and reallocate.`,
        metric: { label: "ROAS", value: `${t.roas.toFixed(2)}x` },
        entity: { type: "campaign", id: c.id, name: c.name },
      });
    }

    if (c.status === "ACTIVE" && slice.length >= 14) {
      const recent = totalsOver(lastNDays(slice, 7));
      const prior = totalsOver(priorNDays(slice, 7, 7));
      const recentRoas = roasOf(recent);
      const priorRoas = roasOf(prior);
      if (priorRoas > 0 && recentRoas / priorRoas <= 0.65 && recent.spend > 300) {
        out.push({
          id: `roas-drop-${c.id}`,
          severity: "high",
          category: "anomaly",
          title: `ROAS crash on "${c.name}"`,
          body: `Last 7 days ROAS is ${recentRoas.toFixed(2)}x vs ${priorRoas.toFixed(2)}x the week before — a ${(((recentRoas - priorRoas) / priorRoas) * 100).toFixed(0)}% drop. Investigate creative fatigue or audience saturation.`,
          metric: { label: "Δ ROAS", value: `${(((recentRoas - priorRoas) / priorRoas) * 100).toFixed(0)}%` },
          entity: { type: "campaign", id: c.id, name: c.name },
        });
      }

      const recentCtr = ctrOf(recent);
      const priorCtr = ctrOf(prior);
      if (priorCtr > 0 && recentCtr / priorCtr <= 0.7 && recent.impressions > 50000) {
        out.push({
          id: `ctr-drop-${c.id}`,
          severity: "medium",
          category: "fatigue",
          title: `CTR fatigue on "${c.name}"`,
          body: `CTR dropped from ${priorCtr.toFixed(2)}% to ${recentCtr.toFixed(2)}% over the last 7 days. Refresh creatives — audiences likely saturating.`,
          metric: { label: "CTR Δ", value: `${(((recentCtr - priorCtr) / priorCtr) * 100).toFixed(0)}%` },
          entity: { type: "campaign", id: c.id, name: c.name },
        });
      }

      const recentCpc = recent.clicks > 0 ? recent.spend / recent.clicks : 0;
      const priorCpc = prior.clicks > 0 ? prior.spend / prior.clicks : 0;
      if (priorCpc > 0 && recentCpc / priorCpc >= 1.4 && recent.spend > 200) {
        out.push({
          id: `cpc-spike-${c.id}`,
          severity: "medium",
          category: "anomaly",
          title: `CPC spike on "${c.name}"`,
          body: `CPC jumped from $${priorCpc.toFixed(2)} to $${recentCpc.toFixed(2)} — auction is getting expensive. Check competitive density or refresh creative.`,
          metric: { label: "CPC", value: `$${recentCpc.toFixed(2)}` },
          entity: { type: "campaign", id: c.id, name: c.name },
        });
      }
    }

    if (c.status === "ACTIVE" && c.budgetType === "DAILY" && c.dailyBudget) {
      const recentSpend = totalsOver(lastNDays(slice, 7)).spend / Math.min(7, slice.length);
      const utilization = recentSpend / c.dailyBudget;
      if (utilization < 0.6 && recentSpend > 0) {
        out.push({
          id: `underspend-${c.id}`,
          severity: "low",
          category: "budget",
          title: `"${c.name}" is underspending`,
          body: `Average daily spend is $${recentSpend.toFixed(0)} vs $${c.dailyBudget} budget (${(utilization * 100).toFixed(0)}% utilization). Audience may be too narrow, or bid is too low.`,
          metric: { label: "Utilization", value: `${(utilization * 100).toFixed(0)}%` },
          entity: { type: "campaign", id: c.id, name: c.name },
        });
      }
    }
  }

  for (const cr of ads) {
    const slice = filterInsights(cr.daily, range.since, range.until);
    if (slice.length < 14) continue;
    const t = totalsOver(slice);
    if (t.spend < 200) continue;
    const recent = totalsOver(lastNDays(slice, 7));
    const prior = totalsOver(priorNDays(slice, 7, 7));
    const recentCtr = ctrOf(recent);
    const priorCtr = ctrOf(prior);
    if (priorCtr > 0 && recentCtr / priorCtr <= 0.6 && recent.impressions > 20000) {
      out.push({
        id: `creative-fatigue-${cr.id}`,
        severity: "medium",
        category: "fatigue",
        title: `Creative fatigue: "${cr.name}"`,
        body: `CTR fell ${(((recentCtr - priorCtr) / priorCtr) * 100).toFixed(0)}% in the last 7 days (${priorCtr.toFixed(2)}% → ${recentCtr.toFixed(2)}%). Pause this ad and ship a fresh hook.`,
        metric: { label: "CTR drop", value: `${(((recentCtr - priorCtr) / priorCtr) * 100).toFixed(0)}%` },
        entity: { type: "creative", id: cr.id, name: cr.name },
      });
    }
  }

  const mobileSpend = audiences.devices.find((d) => d.device === "mobile");
  const desktopSpend = audiences.devices.find((d) => d.device === "desktop");
  if (mobileSpend && desktopSpend) {
    const mobileRoas = roasOf(mobileSpend);
    const desktopRoas = roasOf(desktopSpend);
    if (mobileRoas > 0 && desktopRoas > 0 && desktopRoas / mobileRoas >= 1.5) {
      out.push({
        id: "device-tilt",
        severity: "low",
        category: "audience",
        title: "Desktop is over-indexing on ROAS",
        body: `Desktop is delivering ${desktopRoas.toFixed(2)}x vs ${mobileRoas.toFixed(2)}x on mobile. Consider a desktop-only ad set with a higher budget — checkout flow may favor desktop users.`,
        metric: { label: "Desktop ROAS", value: `${desktopRoas.toFixed(2)}x` },
      });
    }
  }

  return out.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
}

export interface InsightsPayload {
  insights: OptimizationInsight[];
  generatedAt: string;
}

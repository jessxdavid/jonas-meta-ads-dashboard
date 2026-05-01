import type {
  Campaign,
  CountrySlice,
  Creative,
  DashboardData,
  DateRange,
  DemographicSlice,
  DeviceSlice,
  Insight,
  MetricTotals,
  PlacementSlice,
} from "@/types/meta";
import { filterInsights, getMockDashboardData, previousPeriod } from "./mock-data";
import {
  getLiveAccountInfo,
  getLiveAdSets,
  getLiveAudiences,
  getLiveCampaigns,
  getLiveCreatives,
  getLiveDashboardData,
} from "./meta-live";

function isMockMode(): boolean {
  const flag = process.env.USE_MOCK_DATA;
  if (flag === "false") return false;
  if (flag === "true") return true;
  return !process.env.META_ACCESS_TOKEN;
}

export async function getDashboardData(range: DateRange): Promise<DashboardData> {
  if (isMockMode()) return getMockDashboardData();
  return getLiveDashboardData(range);
}

export async function getCampaigns(range: DateRange): Promise<Campaign[]> {
  if (isMockMode()) return getMockDashboardData().campaigns;
  return getLiveCampaigns(range);
}

export async function getAdSets(range: DateRange) {
  if (isMockMode()) return getMockDashboardData().adSets;
  return getLiveAdSets(range);
}

export async function getCreatives(range: DateRange) {
  if (isMockMode()) return getMockDashboardData().creatives;
  return getLiveCreatives(range);
}

export async function getAudiences(range: DateRange) {
  if (isMockMode()) {
    const d = getMockDashboardData();
    return {
      demographics: d.demographics,
      devices: d.devices,
      countries: d.countries,
      placements: d.placements,
    };
  }
  return getLiveAudiences(range);
}

export async function getAccountInfo() {
  if (isMockMode()) {
    const d = getMockDashboardData();
    return { name: d.accountName, id: d.accountId, currency: d.currency, timezone: d.timezone };
  }
  return getLiveAccountInfo();
}

function totalsFromInsights(insights: Insight[]): MetricTotals {
  const t = insights.reduce(
    (acc, i) => {
      acc.spend += i.spend;
      acc.impressions += i.impressions;
      acc.clicks += i.clicks;
      acc.conversions += i.conversions;
      acc.revenue += i.revenue;
      return acc;
    },
    { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 },
  );
  return {
    ...t,
    ctr: t.impressions > 0 ? (t.clicks / t.impressions) * 100 : 0,
    cpc: t.clicks > 0 ? t.spend / t.clicks : 0,
    cpm: t.impressions > 0 ? (t.spend / t.impressions) * 1000 : 0,
    roas: t.spend > 0 ? t.revenue / t.spend : 0,
  };
}

function aggregateAcrossCampaigns(campaigns: Campaign[], range: DateRange): Insight[] {
  const byDate = new Map<string, Insight>();
  for (const c of campaigns) {
    for (const d of filterInsights(c.daily, range.since, range.until)) {
      const existing = byDate.get(d.date);
      if (existing) {
        existing.spend += d.spend;
        existing.impressions += d.impressions;
        existing.clicks += d.clicks;
        existing.conversions += d.conversions;
        existing.revenue += d.revenue;
      } else {
        byDate.set(d.date, { ...d });
      }
    }
  }
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function aggregateAccountInsights(data: DashboardData, range: DateRange): Insight[] {
  return aggregateAcrossCampaigns(data.campaigns, range);
}

export function campaignTotals(campaign: Campaign, range: DateRange): MetricTotals {
  return totalsFromInsights(filterInsights(campaign.daily, range.since, range.until));
}

export interface OverviewPayload {
  account: { name: string; id: string; currency: string };
  current: MetricTotals;
  previous: MetricTotals;
  daily: Insight[];
  topCampaigns: Array<{
    id: string;
    name: string;
    status: Campaign["status"];
    totals: MetricTotals;
  }>;
}

export interface CampaignsPayload {
  campaigns: Array<{
    id: string;
    name: string;
    status: Campaign["status"];
    objective: string;
    budgetType: Campaign["budgetType"];
    dailyBudget?: number;
    lifetimeBudget?: number;
    totals: MetricTotals;
  }>;
}

export interface AdSetsPayload {
  adSets: Array<{
    id: string;
    campaignId: string;
    campaignName: string;
    name: string;
    status: Campaign["status"];
    targeting: string;
    totals: MetricTotals;
  }>;
}

export interface CreativesPayload {
  creatives: Array<{
    id: string;
    campaignId: string;
    campaignName: string;
    name: string;
    thumbnailUrl: string;
    imageUrl?: string;
    videoUrl?: string;
    videoPosterUrl?: string;
    permalinkUrl?: string;
    previewIframeUrl?: string;
    format: Creative["format"];
    totals: MetricTotals;
  }>;
}

export interface AnalyticsPayload {
  current: MetricTotals;
  previous: MetricTotals;
  daily: Insight[];
  byCampaign: Array<{ id: string; name: string; status: Campaign["status"]; totals: MetricTotals }>;
}

export interface AudiencesPayload {
  demographics: DemographicSlice[];
  devices: DeviceSlice[];
  countries: CountrySlice[];
  placements: PlacementSlice[];
}

export interface BudgetPayload {
  campaigns: Array<{
    id: string;
    name: string;
    status: Campaign["status"];
    budgetType: Campaign["budgetType"];
    dailyBudget?: number;
    lifetimeBudget?: number;
    spendCap?: number;
    spendToDate: number;
    daysActive: number;
    avgDailySpend: number;
    projectedMonthEnd: number;
    pacing: "on_track" | "overpacing" | "underpacing" | "n/a";
  }>;
  monthDailySpend: Array<{ date: string; spend: number }>;
  monthBudgetTarget: number;
}

export async function getOverview(range: DateRange): Promise<OverviewPayload> {
  const [account, campaigns] = await Promise.all([getAccountInfo(), getCampaigns(range)]);
  const dailyAcct = aggregateAcrossCampaigns(campaigns, range);
  const current = totalsFromInsights(dailyAcct);
  const prev = previousPeriod(range.since, range.until);
  const previous = totalsFromInsights(aggregateAcrossCampaigns(campaigns, { since: prev.since, until: prev.until }));
  const topCampaigns = campaigns
    .map((c) => ({ id: c.id, name: c.name, status: c.status, totals: campaignTotals(c, range) }))
    .sort((a, b) => b.totals.spend - a.totals.spend)
    .slice(0, 5);
  return {
    account: { name: account.name, id: account.id, currency: account.currency },
    current,
    previous,
    daily: dailyAcct,
    topCampaigns,
  };
}

export async function getCampaignsPayload(range: DateRange): Promise<CampaignsPayload> {
  const campaigns = await getCampaigns(range);
  return {
    campaigns: campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      objective: c.objective,
      budgetType: c.budgetType,
      dailyBudget: c.dailyBudget,
      lifetimeBudget: c.lifetimeBudget,
      totals: campaignTotals(c, range),
    })),
  };
}

export async function getAdSetsPayload(range: DateRange): Promise<AdSetsPayload> {
  const [campaigns, adSets] = await Promise.all([getCampaigns(range), getAdSets(range)]);
  const campaignName = (id: string) => campaigns.find((c) => c.id === id)?.name ?? "—";
  return {
    adSets: adSets.map((s) => ({
      id: s.id,
      campaignId: s.campaignId,
      campaignName: campaignName(s.campaignId),
      name: s.name,
      status: s.status,
      targeting: s.targeting,
      totals: totalsFromInsights(filterInsights(s.daily, range.since, range.until)),
    })),
  };
}

export async function getCreativesPayload(range: DateRange): Promise<CreativesPayload> {
  const [campaigns, creatives] = await Promise.all([getCampaigns(range), getCreatives(range)]);
  const campaignName = (id: string) => campaigns.find((c) => c.id === id)?.name ?? "—";
  return {
    creatives: creatives.map((cr) => ({
      id: cr.id,
      campaignId: cr.campaignId,
      campaignName: campaignName(cr.campaignId),
      name: cr.name,
      thumbnailUrl: cr.thumbnailUrl,
      imageUrl: cr.imageUrl,
      videoUrl: cr.videoUrl,
      videoPosterUrl: cr.videoPosterUrl,
      permalinkUrl: cr.permalinkUrl,
      previewIframeUrl: cr.previewIframeUrl,
      format: cr.format,
      totals: totalsFromInsights(filterInsights(cr.daily, range.since, range.until)),
    })),
  };
}

export async function getAnalyticsPayload(range: DateRange): Promise<AnalyticsPayload> {
  const campaigns = await getCampaigns(range);
  const dailyAcct = aggregateAcrossCampaigns(campaigns, range);
  const current = totalsFromInsights(dailyAcct);
  const prev = previousPeriod(range.since, range.until);
  const previous = totalsFromInsights(aggregateAcrossCampaigns(campaigns, { since: prev.since, until: prev.until }));
  const byCampaign = campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    status: c.status,
    totals: campaignTotals(c, range),
  }));
  return { current, previous, daily: dailyAcct, byCampaign };
}

export async function getAudiencesPayload(range: DateRange): Promise<AudiencesPayload> {
  return getAudiences(range);
}

export async function getBudgetPayload(range: DateRange): Promise<BudgetPayload> {
  const campaigns = await getCampaigns(range);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));
  const monthSince = monthStart.toISOString().slice(0, 10);
  const monthUntil = today.toISOString().slice(0, 10);
  const daysInMonth = monthEnd.getUTCDate();
  const dayOfMonth = today.getUTCDate();

  const monthCampaigns = monthSince === range.since && monthUntil === range.until
    ? campaigns
    : await getCampaigns({ since: monthSince, until: monthUntil });
  const monthDaily = aggregateAcrossCampaigns(monthCampaigns, { since: monthSince, until: monthUntil });
  const monthDailySpend = monthDaily.map((d) => ({ date: d.date, spend: d.spend }));
  const monthDailyTarget = campaigns
    .filter((c) => c.status === "ACTIVE" && c.budgetType === "DAILY")
    .reduce((s, c) => s + (c.dailyBudget ?? 0), 0);

  const out = campaigns.map((c) => {
    const totals = campaignTotals(c, range);
    const allTimeSpend = c.daily.reduce((s, d) => s + d.spend, 0);
    const daysActive = c.daily.length;
    const avgDailySpend = daysActive > 0 ? allTimeSpend / daysActive : 0;
    const projectedMonthEnd = avgDailySpend * daysInMonth;

    let pacing: "on_track" | "overpacing" | "underpacing" | "n/a" = "n/a";
    if (c.budgetType === "DAILY" && c.dailyBudget && c.status === "ACTIVE") {
      const ratio = avgDailySpend / c.dailyBudget;
      if (ratio > 1.1) pacing = "overpacing";
      else if (ratio < 0.85) pacing = "underpacing";
      else pacing = "on_track";
    } else if (c.budgetType === "LIFETIME" && c.lifetimeBudget) {
      const expected = (dayOfMonth / daysInMonth) * c.lifetimeBudget;
      const ratio = allTimeSpend / Math.max(1, expected);
      if (ratio > 1.1) pacing = "overpacing";
      else if (ratio < 0.85) pacing = "underpacing";
      else pacing = "on_track";
    }

    return {
      id: c.id,
      name: c.name,
      status: c.status,
      budgetType: c.budgetType,
      dailyBudget: c.dailyBudget,
      lifetimeBudget: c.lifetimeBudget,
      spendCap: c.spendCap,
      spendToDate: Number(totals.spend.toFixed(2)),
      daysActive,
      avgDailySpend: Number(avgDailySpend.toFixed(2)),
      projectedMonthEnd: Number(projectedMonthEnd.toFixed(2)),
      pacing,
    };
  });

  return { campaigns: out, monthDailySpend, monthBudgetTarget: monthDailyTarget };
}

export function isUsingMockData(): boolean {
  return isMockMode();
}

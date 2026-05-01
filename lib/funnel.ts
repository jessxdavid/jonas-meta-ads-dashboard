import type { Campaign, DateRange } from "@/types/meta";
import { filterInsights } from "./mock-data";
import { getCampaigns } from "./meta-api";

export interface FunnelStage {
  id: string;
  label: string;
  count: number;
  cost: number;
  rateFromTop: number;
  rateFromPrev: number;
}

export interface FunnelByCampaign {
  id: string;
  name: string;
  status: Campaign["status"];
  stages: FunnelStage[];
}

export interface FunnelPayload {
  total: FunnelStage[];
  byCampaign: FunnelByCampaign[];
  benchmarks: {
    impressionToClick: { value: number; benchmark: number };
    clickToLpv: { value: number; benchmark: number };
    lpvToAtc: { value: number; benchmark: number };
    atcToCheckout: { value: number; benchmark: number };
    checkoutToPurchase: { value: number; benchmark: number };
  };
}

interface RawFunnel {
  spend: number;
  impressions: number;
  clicks: number;
  landingPageViews: number;
  addToCart: number;
  initiateCheckout: number;
  purchases: number;
}

const SEED = (campaignId: string) => {
  let s = 0;
  for (let i = 0; i < campaignId.length; i++) s = (s * 31 + campaignId.charCodeAt(i)) % 1000003;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

function rawFunnelFor(campaign: Campaign, range: DateRange): RawFunnel {
  const slice = filterInsights(campaign.daily, range.since, range.until);
  const totals = slice.reduce(
    (a, d) => {
      a.spend += d.spend;
      a.impressions += d.impressions;
      a.clicks += d.clicks;
      a.conversions += d.conversions;
      return a;
    },
    { spend: 0, impressions: 0, clicks: 0, conversions: 0 },
  );

  const rng = SEED(campaign.id);
  const lpvRate = 0.78 + rng() * 0.12;
  const atcRate = 0.18 + rng() * 0.12;
  const checkoutRate = 0.55 + rng() * 0.18;
  const purchaseRate = 0.62 + rng() * 0.18;

  const landingPageViews = Math.round(totals.clicks * lpvRate);
  const addToCart = Math.round(landingPageViews * atcRate);
  const initiateCheckout = Math.round(addToCart * checkoutRate);
  const purchases = Math.max(totals.conversions, Math.round(initiateCheckout * purchaseRate));

  return {
    spend: totals.spend,
    impressions: totals.impressions,
    clicks: totals.clicks,
    landingPageViews,
    addToCart,
    initiateCheckout,
    purchases,
  };
}

const STAGE_DEFS: Array<{ id: string; label: string }> = [
  { id: "impressions", label: "Impressions" },
  { id: "clicks", label: "Clicks" },
  { id: "lpv", label: "Landing Page Views" },
  { id: "atc", label: "Add to Cart" },
  { id: "checkout", label: "Initiate Checkout" },
  { id: "purchase", label: "Purchase" },
];

function buildStages(raw: RawFunnel): FunnelStage[] {
  const counts = [
    raw.impressions,
    raw.clicks,
    raw.landingPageViews,
    raw.addToCart,
    raw.initiateCheckout,
    raw.purchases,
  ];
  const top = counts[0] || 1;
  return STAGE_DEFS.map((def, i) => {
    const c = counts[i];
    const prev = i === 0 ? c : counts[i - 1];
    return {
      id: def.id,
      label: def.label,
      count: c,
      cost: c > 0 ? raw.spend / c : 0,
      rateFromTop: top > 0 ? (c / top) * 100 : 0,
      rateFromPrev: prev > 0 ? (c / prev) * 100 : 0,
    };
  });
}

function aggregate(raws: RawFunnel[]): RawFunnel {
  return raws.reduce(
    (a, r) => ({
      spend: a.spend + r.spend,
      impressions: a.impressions + r.impressions,
      clicks: a.clicks + r.clicks,
      landingPageViews: a.landingPageViews + r.landingPageViews,
      addToCart: a.addToCart + r.addToCart,
      initiateCheckout: a.initiateCheckout + r.initiateCheckout,
      purchases: a.purchases + r.purchases,
    }),
    {
      spend: 0,
      impressions: 0,
      clicks: 0,
      landingPageViews: 0,
      addToCart: 0,
      initiateCheckout: 0,
      purchases: 0,
    },
  );
}

export async function getFunnelPayload(range: DateRange): Promise<FunnelPayload> {
  const campaigns = await getCampaigns(range);
  const raws = campaigns.map((c) => ({ campaign: c, raw: rawFunnelFor(c, range) }));
  const totalRaw = aggregate(raws.map((r) => r.raw));
  const total = buildStages(totalRaw);

  const byCampaign: FunnelByCampaign[] = raws.map(({ campaign, raw }) => ({
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    stages: buildStages(raw),
  }));

  byCampaign.sort((a, b) => b.stages[0].count - a.stages[0].count);

  const i2c = totalRaw.impressions > 0 ? (totalRaw.clicks / totalRaw.impressions) * 100 : 0;
  const c2l = totalRaw.clicks > 0 ? (totalRaw.landingPageViews / totalRaw.clicks) * 100 : 0;
  const l2a = totalRaw.landingPageViews > 0 ? (totalRaw.addToCart / totalRaw.landingPageViews) * 100 : 0;
  const a2c = totalRaw.addToCart > 0 ? (totalRaw.initiateCheckout / totalRaw.addToCart) * 100 : 0;
  const c2p = totalRaw.initiateCheckout > 0 ? (totalRaw.purchases / totalRaw.initiateCheckout) * 100 : 0;

  return {
    total,
    byCampaign,
    benchmarks: {
      impressionToClick: { value: i2c, benchmark: 1.5 },
      clickToLpv: { value: c2l, benchmark: 80 },
      lpvToAtc: { value: l2a, benchmark: 12 },
      atcToCheckout: { value: a2c, benchmark: 50 },
      checkoutToPurchase: { value: c2p, benchmark: 65 },
    },
  };
}

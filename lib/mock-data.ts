import type {
  AdSet,
  Campaign,
  CountrySlice,
  Creative,
  DashboardData,
  DemographicSlice,
  DeviceSlice,
  Insight,
  PlacementSlice,
} from "@/types/meta";

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const rng = seededRandom(42);

function isoDate(daysAgo: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function daysBetween(since: string, until: string): number {
  const a = new Date(since).getTime();
  const b = new Date(until).getTime();
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

interface CampaignProfile {
  id: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "ENDED";
  objective: string;
  budgetType: "DAILY" | "LIFETIME";
  dailyBudget?: number;
  lifetimeBudget?: number;
  spendCap?: number;
  startDaysAgo: number;
  endDaysAgo?: number;
  baseDailySpend: number;
  spendVolatility: number;
  targetRoas: number;
  roasVolatility: number;
  ctr: number;
  cpc: number;
  growthTrend: number;
}

const CAMPAIGN_PROFILES: CampaignProfile[] = [
  {
    id: "23854000000000001",
    name: "Spring Promo — Lookalike 1%",
    status: "ACTIVE",
    objective: "OUTCOME_SALES",
    budgetType: "DAILY",
    dailyBudget: 250,
    startDaysAgo: 89,
    baseDailySpend: 220,
    spendVolatility: 0.18,
    targetRoas: 4.2,
    roasVolatility: 0.25,
    ctr: 2.4,
    cpc: 0.92,
    growthTrend: 0.08,
  },
  {
    id: "23854000000000002",
    name: "Retargeting — Cart Abandoners (DPA)",
    status: "ACTIVE",
    objective: "OUTCOME_SALES",
    budgetType: "DAILY",
    dailyBudget: 120,
    startDaysAgo: 89,
    baseDailySpend: 105,
    spendVolatility: 0.12,
    targetRoas: 7.8,
    roasVolatility: 0.3,
    ctr: 4.1,
    cpc: 0.71,
    growthTrend: 0.04,
  },
  {
    id: "23854000000000003",
    name: "Cold Audience — Interest Stack",
    status: "ACTIVE",
    objective: "OUTCOME_TRAFFIC",
    budgetType: "DAILY",
    dailyBudget: 180,
    startDaysAgo: 75,
    baseDailySpend: 165,
    spendVolatility: 0.22,
    targetRoas: 2.1,
    roasVolatility: 0.4,
    ctr: 1.6,
    cpc: 1.24,
    growthTrend: -0.03,
  },
  {
    id: "23854000000000004",
    name: "Brand Awareness — Reach Campaign",
    status: "ACTIVE",
    objective: "OUTCOME_AWARENESS",
    budgetType: "LIFETIME",
    lifetimeBudget: 6000,
    spendCap: 6500,
    startDaysAgo: 60,
    baseDailySpend: 95,
    spendVolatility: 0.1,
    targetRoas: 1.4,
    roasVolatility: 0.5,
    ctr: 0.9,
    cpc: 1.85,
    growthTrend: 0.02,
  },
  {
    id: "23854000000000005",
    name: "Holiday Bundle Push",
    status: "PAUSED",
    objective: "OUTCOME_SALES",
    budgetType: "DAILY",
    dailyBudget: 200,
    startDaysAgo: 45,
    endDaysAgo: 12,
    baseDailySpend: 175,
    spendVolatility: 0.2,
    targetRoas: 3.5,
    roasVolatility: 0.3,
    ctr: 2.1,
    cpc: 1.05,
    growthTrend: 0,
  },
  {
    id: "23854000000000006",
    name: "Summer Test — Creative Variations",
    status: "ENDED",
    objective: "OUTCOME_ENGAGEMENT",
    budgetType: "LIFETIME",
    lifetimeBudget: 2500,
    startDaysAgo: 80,
    endDaysAgo: 35,
    baseDailySpend: 65,
    spendVolatility: 0.3,
    targetRoas: 2.8,
    roasVolatility: 0.45,
    cpc: 0.88,
    ctr: 1.9,
    growthTrend: 0,
  },
];

function buildDailyInsights(profile: CampaignProfile): Insight[] {
  const insights: Insight[] = [];
  const totalSpan = profile.startDaysAgo;
  const endOffset = profile.endDaysAgo ?? 0;

  for (let i = totalSpan; i >= endOffset; i--) {
    const date = isoDate(i);
    const dow = new Date(date).getUTCDay();
    const weekendBoost = dow === 0 || dow === 6 ? 1.12 : 1;
    const progress = (totalSpan - i) / Math.max(1, totalSpan - endOffset);
    const trend = 1 + profile.growthTrend * progress;
    const noise = 1 + (rng() - 0.5) * 2 * profile.spendVolatility;
    const spend = Math.max(5, profile.baseDailySpend * weekendBoost * trend * noise);

    const ctrNoise = profile.ctr * (1 + (rng() - 0.5) * 0.3);
    const cpcNoise = profile.cpc * (1 + (rng() - 0.5) * 0.2);
    const clicks = Math.max(1, Math.round(spend / cpcNoise));
    const impressions = Math.round((clicks / ctrNoise) * 100);

    const roasNoise = 1 + (rng() - 0.5) * 2 * profile.roasVolatility;
    const dailyRoas = Math.max(0.2, profile.targetRoas * roasNoise);
    const revenue = spend * dailyRoas;
    const conversions = Math.max(0, Math.round(revenue / 65));

    insights.push({
      date,
      spend: Number(spend.toFixed(2)),
      impressions,
      clicks,
      conversions,
      revenue: Number(revenue.toFixed(2)),
    });
  }
  return insights;
}

function buildCampaigns(): Campaign[] {
  return CAMPAIGN_PROFILES.map((profile) => {
    const daily = buildDailyInsights(profile);
    return {
      id: profile.id,
      name: profile.name,
      status: profile.status,
      objective: profile.objective,
      budgetType: profile.budgetType,
      dailyBudget: profile.dailyBudget,
      lifetimeBudget: profile.lifetimeBudget,
      spendCap: profile.spendCap,
      startDate: isoDate(profile.startDaysAgo),
      endDate: profile.endDaysAgo ? isoDate(profile.endDaysAgo) : undefined,
      daily,
    };
  });
}

const AD_SET_TEMPLATES: Record<string, string[]> = {
  "23854000000000001": [
    "LAL 1% — US — All Devices",
    "LAL 1% — CA/UK — Mobile",
  ],
  "23854000000000002": [
    "DPA — 7d Cart Abandon",
    "DPA — 30d Browsers",
    "DPA — Past Purchasers (Upsell)",
  ],
  "23854000000000003": [
    "Interest — Fitness Enthusiasts",
    "Interest — Healthy Living",
    "Interest — Wellness & Yoga",
  ],
  "23854000000000004": [
    "Reach — US Broad",
    "Reach — Tier-1 Countries",
  ],
  "23854000000000005": [
    "Holiday — Returning Customers",
    "Holiday — Cold Traffic",
  ],
  "23854000000000006": [
    "Test — Video Hook A",
    "Test — Static Carousel B",
  ],
};

function buildAdSets(campaigns: Campaign[]): AdSet[] {
  const sets: AdSet[] = [];
  let counter = 1;
  for (const c of campaigns) {
    const names = AD_SET_TEMPLATES[c.id] ?? [];
    for (const name of names) {
      const ratio = 1 / names.length + (rng() - 0.5) * 0.15;
      const daily = c.daily.map((d) => ({
        date: d.date,
        spend: Number((d.spend * ratio).toFixed(2)),
        impressions: Math.round(d.impressions * ratio),
        clicks: Math.round(d.clicks * ratio),
        conversions: Math.round(d.conversions * ratio),
        revenue: Number((d.revenue * ratio).toFixed(2)),
      }));
      sets.push({
        id: `23856000000${String(counter).padStart(6, "0")}`,
        campaignId: c.id,
        name,
        status: c.status,
        targeting: name.split(" — ").slice(1).join(" — "),
        daily,
      });
      counter++;
    }
  }
  return sets;
}

const CREATIVE_TEMPLATES: { name: string; format: "image" | "video" | "carousel"; thumb: string }[] = [
  { name: "Hero Video — 'Transform Your Mornings' 15s", format: "video", thumb: "https://picsum.photos/seed/creative1/600/600" },
  { name: "Static — Lifestyle Bundle Shot", format: "image", thumb: "https://picsum.photos/seed/creative2/600/600" },
  { name: "Carousel — 5 Best-Sellers", format: "carousel", thumb: "https://picsum.photos/seed/creative3/600/600" },
  { name: "UGC Video — Customer Testimonial", format: "video", thumb: "https://picsum.photos/seed/creative4/600/600" },
  { name: "Static — '40% Off Spring Sale'", format: "image", thumb: "https://picsum.photos/seed/creative5/600/600" },
  { name: "Reels Hook — 'POV: You finally...'", format: "video", thumb: "https://picsum.photos/seed/creative6/600/600" },
  { name: "Carousel — Before / After", format: "carousel", thumb: "https://picsum.photos/seed/creative7/600/600" },
  { name: "Static — Product on Marble", format: "image", thumb: "https://picsum.photos/seed/creative8/600/600" },
  { name: "Video Ad — Founder Story 30s", format: "video", thumb: "https://picsum.photos/seed/creative9/600/600" },
  { name: "Static — Press Quote Mockup", format: "image", thumb: "https://picsum.photos/seed/creative10/600/600" },
  { name: "Carousel — Free Gift With Purchase", format: "carousel", thumb: "https://picsum.photos/seed/creative11/600/600" },
  { name: "Reels — Quick Demo 9s", format: "video", thumb: "https://picsum.photos/seed/creative12/600/600" },
  { name: "Static — Minimal Hero — Black BG", format: "image", thumb: "https://picsum.photos/seed/creative13/600/600" },
  { name: "Video — 'Why customers love us' 22s", format: "video", thumb: "https://picsum.photos/seed/creative14/600/600" },
  { name: "Carousel — Holiday Gift Guide", format: "carousel", thumb: "https://picsum.photos/seed/creative15/600/600" },
  { name: "Static — Cart Abandon Reminder", format: "image", thumb: "https://picsum.photos/seed/creative16/600/600" },
  { name: "Video — Unboxing 18s", format: "video", thumb: "https://picsum.photos/seed/creative17/600/600" },
  { name: "Static — Bundle Discount Stamp", format: "image", thumb: "https://picsum.photos/seed/creative18/600/600" },
];

function buildCreatives(adSets: AdSet[]): Creative[] {
  const creatives: Creative[] = [];
  let templateIdx = 0;
  let id = 1;
  for (const set of adSets) {
    const count = 2 + Math.floor(rng() * 2);
    for (let i = 0; i < count; i++) {
      const tmpl = CREATIVE_TEMPLATES[templateIdx % CREATIVE_TEMPLATES.length];
      templateIdx++;
      const ratio = 1 / count + (rng() - 0.5) * 0.2;
      const daily = set.daily.map((d) => ({
        date: d.date,
        spend: Number((d.spend * ratio).toFixed(2)),
        impressions: Math.round(d.impressions * ratio),
        clicks: Math.round(d.clicks * ratio),
        conversions: Math.round(d.conversions * ratio),
        revenue: Number((d.revenue * ratio).toFixed(2)),
      }));
      creatives.push({
        id: `23857000000${String(id).padStart(6, "0")}`,
        adSetId: set.id,
        campaignId: set.campaignId,
        name: tmpl.name,
        thumbnailUrl: tmpl.thumb,
        format: tmpl.format,
        daily,
      });
      id++;
    }
  }
  return creatives;
}

function buildDemographics(): DemographicSlice[] {
  const ageGroups = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
  const ageWeights = [0.12, 0.34, 0.28, 0.14, 0.08, 0.04];
  const genderSplit: Record<string, number> = { female: 0.62, male: 0.36, unknown: 0.02 };

  const slices: DemographicSlice[] = [];
  const totalSpend = 38500;
  const totalImpressions = 2_800_000;
  const totalClicks = 56_000;
  const totalRevenue = 122_500;

  ageGroups.forEach((age, i) => {
    for (const gender of Object.keys(genderSplit) as Array<"male" | "female" | "unknown">) {
      const w = ageWeights[i] * genderSplit[gender];
      slices.push({
        age,
        gender,
        spend: Number((totalSpend * w).toFixed(2)),
        impressions: Math.round(totalImpressions * w),
        clicks: Math.round(totalClicks * w),
        revenue: Number((totalRevenue * w).toFixed(2)),
      });
    }
  });
  return slices;
}

function buildDevices(): DeviceSlice[] {
  const total = { spend: 38500, impressions: 2_800_000, clicks: 56_000, revenue: 122_500 };
  const split: Record<"mobile" | "desktop" | "tablet", number> = {
    mobile: 0.71,
    desktop: 0.23,
    tablet: 0.06,
  };
  return (Object.keys(split) as Array<"mobile" | "desktop" | "tablet">).map((d) => ({
    device: d,
    spend: Number((total.spend * split[d]).toFixed(2)),
    impressions: Math.round(total.impressions * split[d]),
    clicks: Math.round(total.clicks * split[d]),
    revenue: Number((total.revenue * split[d]).toFixed(2)),
  }));
}

function buildCountries(): CountrySlice[] {
  const countries = [
    { country: "United States", code: "US", weight: 0.58 },
    { country: "United Kingdom", code: "GB", weight: 0.13 },
    { country: "Canada", code: "CA", weight: 0.09 },
    { country: "Australia", code: "AU", weight: 0.07 },
    { country: "Germany", code: "DE", weight: 0.04 },
    { country: "France", code: "FR", weight: 0.03 },
    { country: "Netherlands", code: "NL", weight: 0.02 },
    { country: "Sweden", code: "SE", weight: 0.015 },
    { country: "Ireland", code: "IE", weight: 0.012 },
    { country: "New Zealand", code: "NZ", weight: 0.011 },
  ];
  const total = { spend: 38500, impressions: 2_800_000, clicks: 56_000, revenue: 122_500 };
  return countries.map((c) => ({
    country: c.country,
    countryCode: c.code,
    spend: Number((total.spend * c.weight).toFixed(2)),
    impressions: Math.round(total.impressions * c.weight),
    clicks: Math.round(total.clicks * c.weight),
    revenue: Number((total.revenue * c.weight).toFixed(2)),
  }));
}

function buildPlacements(): PlacementSlice[] {
  const placements: { publisher: PlacementSlice["publisher"]; placement: string; weight: number }[] = [
    { publisher: "facebook", placement: "Facebook Feed", weight: 0.27 },
    { publisher: "instagram", placement: "Instagram Feed", weight: 0.31 },
    { publisher: "instagram", placement: "Instagram Stories", weight: 0.14 },
    { publisher: "instagram", placement: "Instagram Reels", weight: 0.16 },
    { publisher: "facebook", placement: "Facebook Stories", weight: 0.04 },
    { publisher: "facebook", placement: "Facebook Reels", weight: 0.03 },
    { publisher: "audience_network", placement: "Audience Network", weight: 0.03 },
    { publisher: "messenger", placement: "Messenger", weight: 0.02 },
  ];
  const total = { spend: 38500, impressions: 2_800_000, clicks: 56_000, revenue: 122_500 };
  return placements.map((p) => ({
    publisher: p.publisher,
    placement: p.placement,
    spend: Number((total.spend * p.weight).toFixed(2)),
    impressions: Math.round(total.impressions * p.weight),
    clicks: Math.round(total.clicks * p.weight),
    revenue: Number((total.revenue * p.weight).toFixed(2)),
  }));
}

let cached: DashboardData | null = null;

export function getMockDashboardData(): DashboardData {
  if (cached) return cached;
  const campaigns = buildCampaigns();
  const adSets = buildAdSets(campaigns);
  const creatives = buildCreatives(adSets);
  cached = {
    accountName: "Info Ops Growth — Main Account",
    accountId: "act_1234567890123456",
    currency: "USD",
    timezone: "America/Los_Angeles",
    campaigns,
    adSets,
    creatives,
    demographics: buildDemographics(),
    devices: buildDevices(),
    countries: buildCountries(),
    placements: buildPlacements(),
  };
  return cached;
}

export function filterInsights(daily: Insight[], since: string, until: string): Insight[] {
  return daily.filter((d) => d.date >= since && d.date <= until);
}

export function previousPeriod(since: string, until: string): { since: string; until: string } {
  const span = daysBetween(since, until);
  const sinceDate = new Date(since);
  const newUntil = new Date(sinceDate);
  newUntil.setUTCDate(newUntil.getUTCDate() - 1);
  const newSince = new Date(newUntil);
  newSince.setUTCDate(newSince.getUTCDate() - span + 1);
  return {
    since: newSince.toISOString().slice(0, 10),
    until: newUntil.toISOString().slice(0, 10),
  };
}

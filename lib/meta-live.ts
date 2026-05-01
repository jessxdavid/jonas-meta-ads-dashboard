import type {
  AdSet,
  Campaign,
  CampaignStatus,
  CountrySlice,
  Creative,
  DashboardData,
  DateRange,
  DemographicSlice,
  DeviceSlice,
  Insight,
  PlacementSlice,
} from "@/types/meta";

const META_API_BASE = "https://graph.facebook.com/v21.0";
const PAGE_LIMIT = 500;
const TTL_MS = 60 * 1000;

interface Ctx {
  accessToken: string;
  accountId: string;
}

function ctx(): Ctx {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const accountId = process.env.META_AD_ACCOUNT_ID;
  if (!accessToken || !accountId) {
    throw new Error("Missing META_ACCESS_TOKEN or META_AD_ACCOUNT_ID");
  }
  return { accessToken, accountId };
}

function buildUrl(path: string, params: Record<string, string | number>): string {
  const url = new URL(`${META_API_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  return url.toString();
}

interface Page<T> {
  data: T[];
  paging?: { next?: string };
}

async function metaGet<T>(path: string, params: Record<string, string | number>): Promise<Page<T>> {
  const c = ctx();
  const url = buildUrl(path, { ...params, access_token: c.accessToken });
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Meta API ${res.status} on ${path}: ${body.slice(0, 300)}`);
  }
  return (await res.json()) as Page<T>;
}

async function metaGetAll<T>(path: string, params: Record<string, string | number>): Promise<T[]> {
  const out: T[] = [];
  let page = await metaGet<T>(path, params);
  out.push(...page.data);
  let next = page.paging?.next;
  while (next) {
    const res = await fetch(next, { cache: "no-store" });
    if (!res.ok) break;
    page = (await res.json()) as Page<T>;
    out.push(...page.data);
    next = page.paging?.next;
  }
  return out;
}

function timeRange(range: DateRange): string {
  return JSON.stringify({ since: range.since, until: range.until });
}

function num(v: unknown): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

const PURCHASE_TYPES = new Set([
  "purchase",
  "omni_purchase",
  "offsite_conversion.fb_pixel_purchase",
  "onsite_conversion.purchase",
  "web_in_store_purchase",
]);

interface ActionEntry {
  action_type: string;
  value: string;
}

function sumPurchases(actions?: ActionEntry[]): number {
  if (!actions || actions.length === 0) return 0;
  const omni = actions.find((a) => a.action_type === "omni_purchase");
  if (omni) return num(omni.value);
  return actions.filter((a) => PURCHASE_TYPES.has(a.action_type)).reduce((s, a) => s + num(a.value), 0);
}

interface InsightRow {
  date_start?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  actions?: ActionEntry[];
  action_values?: ActionEntry[];
  campaign_id?: string;
  adset_id?: string;
  ad_id?: string;
  age?: string;
  gender?: string;
  device_platform?: string;
  country?: string;
  publisher_platform?: string;
  platform_position?: string;
}

function rowToInsight(r: InsightRow): Insight {
  return {
    date: r.date_start ?? "",
    spend: num(r.spend),
    impressions: num(r.impressions),
    clicks: num(r.clicks),
    conversions: sumPurchases(r.actions),
    revenue: sumPurchases(r.action_values),
  };
}

function mapStatus(s?: string): CampaignStatus {
  if (s === "ACTIVE") return "ACTIVE";
  if (s === "PAUSED") return "PAUSED";
  return "ENDED";
}

function dollarsFromCents(cents?: string | null): number | undefined {
  if (cents == null || cents === "") return undefined;
  const n = num(cents);
  return n > 0 ? n / 100 : undefined;
}

function isoDay(t?: string): string {
  if (!t) return "";
  return t.slice(0, 10);
}

interface RawCampaign {
  id: string;
  name: string;
  status?: string;
  objective?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  spend_cap?: string;
  start_time?: string;
  stop_time?: string;
}

interface RawAdSet {
  id: string;
  campaign_id: string;
  name: string;
  status?: string;
  targeting?: {
    age_min?: number;
    age_max?: number;
    geo_locations?: { countries?: string[] };
    flexible_spec?: Array<{ interests?: Array<{ name: string }> }>;
  };
}

interface RawAd {
  id: string;
  adset_id: string;
  campaign_id: string;
  name: string;
  creative?: {
    thumbnail_url?: string;
    image_url?: string;
    video_id?: string;
    object_story_spec?: {
      link_data?: { child_attachments?: unknown[] };
      video_data?: unknown;
    };
  };
}

interface RawVideo {
  id: string;
  source?: string;
  picture?: string;
  permalink_url?: string;
}

function summarizeTargeting(t: RawAdSet["targeting"]): string {
  if (!t) return "—";
  const parts: string[] = [];
  const country = t.geo_locations?.countries?.[0];
  if (country) parts.push(country);
  if (t.age_min != null && t.age_max != null) parts.push(`${t.age_min}-${t.age_max}`);
  const interest = t.flexible_spec?.[0]?.interests?.[0]?.name;
  if (interest) parts.push(interest);
  return parts.length > 0 ? parts.join(" · ") : "Custom";
}

function detectFormat(creative?: RawAd["creative"]): Creative["format"] {
  if (!creative) return "image";
  if (creative.video_id || creative.object_story_spec?.video_data) return "video";
  if (creative.object_story_spec?.link_data?.child_attachments) return "carousel";
  return "image";
}

function mapDevice(p?: string): DeviceSlice["device"] {
  if (!p) return "mobile";
  if (p.startsWith("mobile")) return "mobile";
  if (p === "desktop") return "desktop";
  if (p === "tablet") return "tablet";
  return "mobile";
}

function mapPublisher(p?: string): PlacementSlice["publisher"] {
  if (p === "instagram") return "instagram";
  if (p === "audience_network") return "audience_network";
  if (p === "messenger") return "messenger";
  return "facebook";
}

function mapGender(g?: string): DemographicSlice["gender"] {
  if (g === "male") return "male";
  if (g === "female") return "female";
  return "unknown";
}

let displayNames: Intl.DisplayNames | null = null;
function countryName(code: string): string {
  if (!displayNames) {
    try {
      displayNames = new Intl.DisplayNames(["en"], { type: "region" });
    } catch {
      displayNames = null;
    }
  }
  return displayNames?.of(code) ?? code;
}

const ACCOUNT_FIELDS = "name,currency,timezone_name";
const CAMPAIGN_FIELDS =
  "id,name,status,objective,daily_budget,lifetime_budget,spend_cap,start_time,stop_time";
const ADSET_FIELDS = "id,campaign_id,name,status,targeting{age_min,age_max,geo_locations,flexible_spec}";
const AD_FIELDS =
  "id,adset_id,campaign_id,name,creative{thumbnail_url,image_url,video_id,object_story_spec}";
const VIDEO_FIELDS = "source,picture,permalink_url";
const INSIGHT_FIELDS = "spend,impressions,clicks,actions,action_values";

interface AccountInfo {
  name: string;
  currency: string;
  timezone_name: string;
}

async function fetchAccount(): Promise<AccountInfo> {
  const c = ctx();
  const res = await fetch(buildUrl(`/${c.accountId}`, { fields: ACCOUNT_FIELDS, access_token: c.accessToken }), {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Meta API ${res.status} on account: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as AccountInfo;
}

interface CacheEntry<T> {
  data: T;
  expires: number;
}
const cache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

function rangeKey(prefix: string, range: DateRange): string {
  return `${prefix}|${range.since}|${range.until}|${process.env.META_AD_ACCOUNT_ID}`;
}

async function withCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.data as T;
  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;
  const promise = (async () => {
    const data = await fetcher();
    cache.set(key, { data, expires: Date.now() + TTL_MS });
    return data;
  })().finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, promise);
  return promise;
}

const sortByDate = (a: Insight, b: Insight) => a.date.localeCompare(b.date);

export async function getLiveCampaigns(range: DateRange): Promise<Campaign[]> {
  return withCache(rangeKey("campaigns", range), async () => {
    const c = ctx();
    const path = `/${c.accountId}`;
    const tr = timeRange(range);
    const [campaignsRaw, dailyInsights] = await Promise.all([
      metaGetAll<RawCampaign>(`${path}/campaigns`, { fields: CAMPAIGN_FIELDS, limit: PAGE_LIMIT }),
      metaGetAll<InsightRow>(`${path}/insights`, {
        level: "campaign",
        fields: `campaign_id,${INSIGHT_FIELDS}`,
        time_increment: 1,
        time_range: tr,
        limit: PAGE_LIMIT,
      }),
    ]);
    const dailyByCampaign = new Map<string, Insight[]>();
    for (const r of dailyInsights) {
      if (!r.campaign_id) continue;
      const arr = dailyByCampaign.get(r.campaign_id) ?? [];
      arr.push(rowToInsight(r));
      dailyByCampaign.set(r.campaign_id, arr);
    }
    return campaignsRaw.map((cm) => {
      const dailyBudget = dollarsFromCents(cm.daily_budget);
      const lifetimeBudget = dollarsFromCents(cm.lifetime_budget);
      const budgetType: Campaign["budgetType"] = lifetimeBudget && !dailyBudget ? "LIFETIME" : "DAILY";
      return {
        id: cm.id,
        name: cm.name,
        status: mapStatus(cm.status),
        objective: cm.objective ?? "—",
        budgetType,
        dailyBudget,
        lifetimeBudget,
        spendCap: dollarsFromCents(cm.spend_cap),
        startDate: isoDay(cm.start_time) || range.since,
        endDate: cm.stop_time ? isoDay(cm.stop_time) : undefined,
        daily: (dailyByCampaign.get(cm.id) ?? []).sort(sortByDate),
      };
    });
  });
}

export async function getLiveAdSets(range: DateRange): Promise<AdSet[]> {
  return withCache(rangeKey("adsets", range), async () => {
    const c = ctx();
    const path = `/${c.accountId}`;
    const tr = timeRange(range);
    const [adSetsRaw, dailyInsights] = await Promise.all([
      metaGetAll<RawAdSet>(`${path}/adsets`, { fields: ADSET_FIELDS, limit: PAGE_LIMIT }),
      metaGetAll<InsightRow>(`${path}/insights`, {
        level: "adset",
        fields: `adset_id,${INSIGHT_FIELDS}`,
        time_increment: 1,
        time_range: tr,
        limit: PAGE_LIMIT,
      }),
    ]);
    const dailyByAdSet = new Map<string, Insight[]>();
    for (const r of dailyInsights) {
      if (!r.adset_id) continue;
      const arr = dailyByAdSet.get(r.adset_id) ?? [];
      arr.push(rowToInsight(r));
      dailyByAdSet.set(r.adset_id, arr);
    }
    return adSetsRaw.map((s) => ({
      id: s.id,
      campaignId: s.campaign_id,
      name: s.name,
      status: mapStatus(s.status),
      targeting: summarizeTargeting(s.targeting),
      daily: (dailyByAdSet.get(s.id) ?? []).sort(sortByDate),
    }));
  });
}

export async function getLiveCreatives(range: DateRange): Promise<Creative[]> {
  return withCache(rangeKey("creatives", range), async () => {
    const c = ctx();
    const path = `/${c.accountId}`;
    const tr = timeRange(range);
    const [adsRaw, dailyInsights] = await Promise.all([
      metaGetAll<RawAd>(`${path}/ads`, { fields: AD_FIELDS, limit: PAGE_LIMIT }),
      metaGetAll<InsightRow>(`${path}/insights`, {
        level: "ad",
        fields: `ad_id,${INSIGHT_FIELDS}`,
        time_increment: 1,
        time_range: tr,
        limit: PAGE_LIMIT,
      }),
    ]);
    const dailyByAd = new Map<string, Insight[]>();
    for (const r of dailyInsights) {
      if (!r.ad_id) continue;
      const arr = dailyByAd.get(r.ad_id) ?? [];
      arr.push(rowToInsight(r));
      dailyByAd.set(r.ad_id, arr);
    }

    const videoIds = Array.from(
      new Set(adsRaw.map((a) => a.creative?.video_id).filter((v): v is string => Boolean(v))),
    );
    const videoById = new Map<string, RawVideo>();
    if (videoIds.length > 0) {
      const accessToken = c.accessToken;
      const CHUNK = 50;
      for (let i = 0; i < videoIds.length; i += CHUNK) {
        const chunk = videoIds.slice(i, i + CHUNK);
        const url = buildUrl("/", { ids: chunk.join(","), fields: VIDEO_FIELDS, access_token: accessToken });
        try {
          const res = await fetch(url, { cache: "no-store" });
          if (!res.ok) continue;
          const json = (await res.json()) as Record<string, RawVideo>;
          for (const [id, v] of Object.entries(json)) videoById.set(id, v);
        } catch {
          // best-effort: skip on error so other creatives still render
        }
      }
    }

    return adsRaw.map((a) => {
      const videoId = a.creative?.video_id;
      const video = videoId ? videoById.get(videoId) : undefined;
      return {
        id: a.id,
        adSetId: a.adset_id,
        campaignId: a.campaign_id,
        name: a.name,
        thumbnailUrl: a.creative?.thumbnail_url ?? a.creative?.image_url ?? "",
        imageUrl: a.creative?.image_url,
        videoUrl: video?.source,
        videoPosterUrl: video?.picture ?? a.creative?.image_url ?? a.creative?.thumbnail_url,
        permalinkUrl: video?.permalink_url,
        format: detectFormat(a.creative),
        daily: (dailyByAd.get(a.id) ?? []).sort(sortByDate),
      };
    });
  });
}

export interface LiveAudiences {
  demographics: DemographicSlice[];
  devices: DeviceSlice[];
  countries: CountrySlice[];
  placements: PlacementSlice[];
}

export async function getLiveAudiences(range: DateRange): Promise<LiveAudiences> {
  return withCache(rangeKey("audiences", range), async () => {
    const c = ctx();
    const path = `/${c.accountId}`;
    const tr = timeRange(range);
    const [demoInsights, deviceInsights, countryInsights, placementInsights] = await Promise.all([
      metaGetAll<InsightRow>(`${path}/insights`, {
        level: "account",
        fields: INSIGHT_FIELDS,
        breakdowns: "age,gender",
        time_range: tr,
        limit: PAGE_LIMIT,
      }),
      metaGetAll<InsightRow>(`${path}/insights`, {
        level: "account",
        fields: INSIGHT_FIELDS,
        breakdowns: "device_platform",
        time_range: tr,
        limit: PAGE_LIMIT,
      }),
      metaGetAll<InsightRow>(`${path}/insights`, {
        level: "account",
        fields: INSIGHT_FIELDS,
        breakdowns: "country",
        time_range: tr,
        limit: PAGE_LIMIT,
      }),
      metaGetAll<InsightRow>(`${path}/insights`, {
        level: "account",
        fields: INSIGHT_FIELDS,
        breakdowns: "publisher_platform,platform_position",
        time_range: tr,
        limit: PAGE_LIMIT,
      }),
    ]);

    const demographics: DemographicSlice[] = demoInsights.map((r) => ({
      age: r.age ?? "unknown",
      gender: mapGender(r.gender),
      spend: num(r.spend),
      impressions: num(r.impressions),
      clicks: num(r.clicks),
      revenue: sumPurchases(r.action_values),
    }));

    const deviceTotals = new Map<DeviceSlice["device"], DeviceSlice>();
    for (const r of deviceInsights) {
      const dev = mapDevice(r.device_platform);
      const cur = deviceTotals.get(dev) ?? { device: dev, spend: 0, impressions: 0, clicks: 0, revenue: 0 };
      cur.spend += num(r.spend);
      cur.impressions += num(r.impressions);
      cur.clicks += num(r.clicks);
      cur.revenue += sumPurchases(r.action_values);
      deviceTotals.set(dev, cur);
    }
    const devices: DeviceSlice[] = Array.from(deviceTotals.values());

    const countries: CountrySlice[] = countryInsights.map((r) => ({
      country: r.country ? countryName(r.country) : "—",
      countryCode: r.country ?? "—",
      spend: num(r.spend),
      impressions: num(r.impressions),
      clicks: num(r.clicks),
      revenue: sumPurchases(r.action_values),
    }));

    const placements: PlacementSlice[] = placementInsights.map((r) => ({
      publisher: mapPublisher(r.publisher_platform),
      placement: r.platform_position ?? "—",
      spend: num(r.spend),
      impressions: num(r.impressions),
      clicks: num(r.clicks),
      revenue: sumPurchases(r.action_values),
    }));

    return { demographics, devices, countries, placements };
  });
}

export async function getLiveAccountInfo(): Promise<{
  name: string;
  id: string;
  currency: string;
  timezone: string;
}> {
  return withCache("account|" + process.env.META_AD_ACCOUNT_ID, async () => {
    const a = await fetchAccount();
    return {
      name: a.name,
      id: ctx().accountId,
      currency: a.currency,
      timezone: a.timezone_name,
    };
  });
}

export async function getLiveDashboardData(range: DateRange): Promise<DashboardData> {
  const [account, campaigns, adSets, creatives, audiences] = await Promise.all([
    getLiveAccountInfo(),
    getLiveCampaigns(range),
    getLiveAdSets(range),
    getLiveCreatives(range),
    getLiveAudiences(range),
  ]);
  return {
    accountName: account.name,
    accountId: account.id,
    currency: account.currency,
    timezone: account.timezone,
    campaigns,
    adSets,
    creatives,
    demographics: audiences.demographics,
    devices: audiences.devices,
    countries: audiences.countries,
    placements: audiences.placements,
  };
}

export function clearLiveCache(): void {
  cache.clear();
}

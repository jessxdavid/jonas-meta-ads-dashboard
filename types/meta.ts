export type CampaignStatus = "ACTIVE" | "PAUSED" | "ENDED";

export type BudgetType = "DAILY" | "LIFETIME";

export interface Insight {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  objective: string;
  budgetType: BudgetType;
  dailyBudget?: number;
  lifetimeBudget?: number;
  spendCap?: number;
  startDate: string;
  endDate?: string;
  daily: Insight[];
}

export interface AdSet {
  id: string;
  campaignId: string;
  name: string;
  status: CampaignStatus;
  targeting: string;
  daily: Insight[];
}

export interface Creative {
  id: string;
  adSetId: string;
  campaignId: string;
  name: string;
  thumbnailUrl: string;
  format: "image" | "video" | "carousel";
  daily: Insight[];
}

export interface DemographicSlice {
  age: string;
  gender: "male" | "female" | "unknown";
  spend: number;
  impressions: number;
  clicks: number;
  revenue: number;
}

export interface DeviceSlice {
  device: "mobile" | "desktop" | "tablet";
  spend: number;
  impressions: number;
  clicks: number;
  revenue: number;
}

export interface CountrySlice {
  country: string;
  countryCode: string;
  spend: number;
  impressions: number;
  clicks: number;
  revenue: number;
}

export interface PlacementSlice {
  publisher: "facebook" | "instagram" | "audience_network" | "messenger";
  placement: string;
  spend: number;
  impressions: number;
  clicks: number;
  revenue: number;
}

export interface DashboardData {
  accountName: string;
  accountId: string;
  currency: string;
  timezone: string;
  campaigns: Campaign[];
  adSets: AdSet[];
  creatives: Creative[];
  demographics: DemographicSlice[];
  devices: DeviceSlice[];
  countries: CountrySlice[];
  placements: PlacementSlice[];
}

export type DateRangePreset =
  | "last_7_days"
  | "last_14_days"
  | "last_30_days"
  | "last_90_days"
  | "this_month";

export interface DateRange {
  since: string;
  until: string;
  preset?: DateRangePreset;
}

export interface MetricTotals {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  cpc: number;
  cpm: number;
  roas: number;
}

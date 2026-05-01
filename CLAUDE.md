# Meta Ads Dashboard

A production-ready Next.js dashboard for Meta Marketing API v21.0 data, built with a dark-mode design system and Recharts visualizations. Ships with realistic mock data for instant demos and a single-flag flip to switch to live data.

## Tech Stack

| Tech | Purpose |
|---|---|
| Next.js 15 (App Router) | Framework, server-rendered routes, API endpoints |
| React 19 | UI library |
| TypeScript | Type safety end-to-end |
| Tailwind CSS v4 | Styling, design tokens via `@theme` |
| Recharts | All charts (line, bar, donut, composed, reference lines) |
| lucide-react | Icon set |
| date-fns | Date helpers |
| clsx | Conditional classNames |

No external state library — global state for the date range lives in a small React Context (`components/DateRangeContext.tsx`). No `shadcn/ui` CLI install; primitives are hand-rolled to match the design system tokens directly.

## Folder Structure

```
meta-ads-dashboard/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout: sidebar + header + main
│   ├── globals.css               # Tailwind v4 import + design tokens
│   ├── page.tsx                  # /  (Overview)
│   ├── campaigns/page.tsx        # /campaigns
│   ├── ad-sets/page.tsx          # /ad-sets
│   ├── analytics/page.tsx        # /analytics
│   ├── creatives/page.tsx        # /creatives
│   ├── audiences/page.tsx        # /audiences
│   ├── budget/page.tsx           # /budget
│   └── api/                      # Server-only API routes (token never leaks)
│       ├── _helpers.ts           # rangeFromRequest()
│       ├── account/route.ts
│       ├── overview/route.ts
│       ├── campaigns/route.ts
│       ├── ad-sets/route.ts
│       ├── analytics/route.ts
│       ├── creatives/route.ts
│       ├── audiences/route.ts
│       └── budget/route.ts
├── components/
│   ├── Sidebar.tsx               # Fixed 220px nav
│   ├── Header.tsx                # Account name + global date range picker
│   ├── DateRangeContext.tsx      # React context for selected date range
│   ├── PageShell.tsx             # Page heading + content slot
│   ├── Card.tsx                  # Card + CardHeader primitives
│   ├── KpiCard.tsx               # KPI tile with change indicator
│   ├── StatusBadge.tsx           # ACTIVE / PAUSED / ENDED
│   ├── PerformanceBadge.tsx      # Top / Average / Underperforming + tierFromRoas()
│   ├── Skeleton.tsx              # All loading skeletons
│   ├── States.tsx                # ErrorState + EmptyState
│   └── charts/
│       ├── ChartTheme.ts         # Color tokens for charts
│       ├── SpendRoasChart.tsx    # Dual-axis composed chart
│       ├── CampaignRoasBar.tsx   # Horizontal threshold-colored bar
│       ├── ImpressionsClicksChart.tsx
│       ├── AgeGenderChart.tsx    # Grouped bar (M/F per age)
│       ├── DeviceDonut.tsx       # Donut + legend
│       ├── PlacementBar.tsx
│       └── BudgetPacingChart.tsx # Bars + reference line
├── lib/
│   ├── meta-api.ts               # SINGLE source of truth for all data fetching
│   ├── mock-data.ts              # Seeded mock dataset generator
│   ├── date-range.ts             # Preset → DateRange resolver
│   ├── format.ts                 # Currency, number, percent, ROAS, change formatters
│   └── use-fetch.ts              # useDashboardFetch() — generic client-side fetcher
├── types/
│   └── meta.ts                   # All shared TypeScript types
├── .env.local                    # USE_MOCK_DATA + Meta credentials (gitignored)
├── .env.local.example            # Template for the above
└── CLAUDE.md                     # This file
```

## API Architecture

**The Meta access token never reaches the browser.** All Meta API calls happen inside `lib/meta-api.ts`, which is only ever imported from `app/api/**/route.ts` route handlers (server-only). The browser hits `/api/<page>?since=...&until=...` and receives a JSON payload that has already been aggregated and shaped for the UI.

Flow:
1. Client component calls `useDashboardFetch<T>("/api/overview")`.
2. Next.js API route runs `lib/meta-api.ts → getOverview(range)`.
3. `lib/meta-api.ts` checks `USE_MOCK_DATA`:
   - **Mock mode (default):** read pre-computed seeded dataset from `lib/mock-data.ts`, slice by date range, return shaped payload.
   - **Live mode:** call `https://graph.facebook.com/v21.0` with `META_ACCESS_TOKEN`, transform to the same payload shape.
4. Client renders.

To switch to live data:
1. Fill in `.env.local` (`META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID`, `META_APP_ID`, `META_APP_SECRET`).
2. Set `USE_MOCK_DATA=false`.
3. Restart the dev server.

The `metaFetch<T>(path, params)` helper in `lib/meta-api.ts` is the only place that talks to graph.facebook.com — implement the live branch of each `getXxxPayload()` function there when wiring up real data.

## Key Meta Marketing API Endpoints

| Endpoint | Purpose | Key Fields |
|---|---|---|
| `/{ad-account-id}` | Account name, currency, timezone | `name`, `currency`, `timezone_name` |
| `/{ad-account-id}/campaigns` | Campaign list + budgets | `name`, `status`, `objective`, `daily_budget`, `lifetime_budget`, `spend_cap` |
| `/{ad-account-id}/insights` | Account-level metrics | `spend`, `impressions`, `clicks`, `ctr`, `cpc`, `purchase_roas`, `actions` |
| `/{ad-account-id}/insights?time_increment=1` | Daily breakdown | as above, one row per date |
| `/{ad-account-id}/insights?breakdowns=age,gender` | Demographic split | `age`, `gender` |
| `/{ad-account-id}/insights?breakdowns=country` | Country split | `country` |
| `/{ad-account-id}/insights?breakdowns=device_platform` | Device split | `device_platform` |
| `/{ad-account-id}/insights?breakdowns=publisher_platform,platform_position` | Placement split | `publisher_platform`, `platform_position` |
| `/{ad-account-id}/ads` | Ad list w/ creatives | `name`, `creative{thumbnail_url,image_url,video_id}`, `insights` |

All `time_range` payloads use the format `{"since":"YYYY-MM-DD","until":"YYYY-MM-DD"}`.

## Component Conventions

- **One component per file**, named exports only (`export function Card(...)`).
- **`"use client"`** at the top of any file that uses hooks, browser APIs, or interactivity.
- **Server components by default** — pages are client components because the date range picker drives them client-side, but API routes do all heavy data work.
- **Tailwind tokens** are referenced via CSS variables (`var(--color-accent)`), never hardcoded hex values inside components, so theming stays centralized in `globals.css`.
- **Numbers** always render in `font-mono` to keep tables and KPI cards aligned.
- **Skeletons** match the layout of the loaded content — never spinners.

## Important Decisions

- **Mock-first with a flag:** `USE_MOCK_DATA=true` is the default. Lets the dashboard demo today even before Meta credentials are issued. The same TypeScript payload shapes flow through both branches, so the UI never knows the difference.
- **Tailwind v4 over v3:** matches the sibling Info Ops project and uses the simpler CSS-first `@theme` directive instead of a JS config.
- **Hand-rolled primitives over `shadcn/ui` CLI:** removes a build step and keeps every visual token tied to one place (`globals.css`). The components are still shadcn-style — composable, unstyled-by-default with explicit tokens.
- **Recharts over Chart.js:** native React components, no canvas refs, server-rendered shells, easier dual-axis composition.
- **Port 3001:** the sibling Info Ops dashboard runs on 3000. This dashboard runs on 3001 by convention.
- **Separate folder, not a subroute:** lives at `E:\website\meta-ads-dashboard\` so Info Ops dashboard work stays untouched and either project can be deployed independently.
- **Seeded mock RNG:** `lib/mock-data.ts` uses a deterministic seed so charts look identical across reloads.

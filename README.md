# Meta Ads Dashboard

Production-ready Meta Marketing dashboard with KPIs, charts, creative library, audience insights, and budget pacing — built on Next.js 15 + Recharts. Ships with realistic demo data; flip one flag to go live.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3001.

By default the dashboard runs on bundled mock data — every chart and table is fully populated, so you can demo immediately.

## Going Live

1. Copy `.env.local.example` to `.env.local`
2. Fill in your Meta credentials (see below)
3. Set `USE_MOCK_DATA=false`
4. Restart `npm run dev`

### Required env vars

```
USE_MOCK_DATA=false
META_AD_ACCOUNT_ID=act_xxxxxxxxxxxxxxx
META_APP_ID=xxxxxxxxxxxxxxx
META_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
META_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### How to get them

- **Ad Account ID** — Ads Manager → top-left dropdown → copy the number, prefix with `act_`.
- **App ID + App Secret** — https://developers.facebook.com/apps → create a Business app → app dashboard.
- **Access Token** — Tools → Graph API Explorer → grant `ads_read` + `ads_management` → exchange for a long-lived token via:
  ```
  https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=APP_ID&client_secret=APP_SECRET&fb_exchange_token=SHORT_TOKEN
  ```

## Pages

| Route | What it shows |
|---|---|
| `/` | KPI summary, daily spend & ROAS chart, top campaigns table |
| `/campaigns` | Sortable + filterable campaign table with status badges |
| `/ad-sets` | Ad set table with campaign filter |
| `/analytics` | Daily trends, ROAS-by-campaign bars, period comparison |
| `/creatives` | Thumbnail grid with performance tier badges |
| `/audiences` | Age/gender bars, device donut, top countries, placement bars |
| `/budget` | Pacing chart + per-campaign budget cards with progress bars |

See [CLAUDE.md](./CLAUDE.md) for the full architecture write-up.

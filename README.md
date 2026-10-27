# Rasd (رصد) — a daily economic situation picture for Saudi Arabia

One page, every morning, four questions: **Are shelves and prices holding? What is at sea, and what breaks if a strait closes? Is confidence holding? Is growth holding?** Built by AI Economic Pulse on top of the Kingdom platforms the team already runs. Saudi Arabia only — nothing from any other country appears in the portal.

```
┌─────────────────────────────── RASD (this repo, Next.js 15) ───────────────────────────────┐
│  /            Situation — ticker · overall status · four panels · alerts                    │
│  /brief       Daily brief — six paragraphs, EN/AR, printable; model-written if key is set   │
│  /modules     The platforms the picture is composed from, with what each feeds              │
│  /api/situation  composed JSON   /api/sentiment  live proxy   /api/brief   /api/cron/daily  │
└──────────────┬──────────────────────────┬───────────────────────────────┬──────────────────┘
               │ datasets (daily)          │ live at request time          │ desk inputs
   data/ksa/*.json                  KSA platform /api/news-sentiment     data/desk.json or DESK_URL
   (scripts/refresh-ksa-data.mjs)   (cached 30 min)                       (Hormuz state, hand alerts)
```

**Where the numbers come from.** The KSA Economic Intelligence Platform (`ksa-cpi-intelligence-v2-fh4f`) publishes its datasets inside its front-end bundle and as static JSON. `scripts/refresh-ksa-data.mjs` pulls them every morning into `data/ksa/` — no new API endpoints are needed on the platform — and `lib/ksa.ts` computes the picture with the platform's own formulas:

| File | Contents | Feeds |
|---|---|---|
| `macro_weekly.json` | weekly since Jan 2019: Brent, SAMA rate, press sentiment, consumer spending, TASI, port calls, investment confidence, employment, PMI, GDP / oil GDP / non-oil GDP (SAR m per week) | panels 02 (port calls), 03, 04 |
| `cpi_weekly.json` | weekly non-core CPI by food category (base 100), food index, CPI overall | panel 01 |
| `cpi_products.json` | the tracked retail basket (171 products): weight, origin, category, raw material, Hormuz flag | panel 01 (basket exposure) |
| `hormuz_products.json` | UN Comtrade 2024 exposure per HS6 (critical + top-200 lists): value, value via Hormuz, %, sources, alternatives with route/days/cost, land routes | panel 02 |
| `sentiment_daily.json` | daily pooled press-sentiment score (long history) | panel 03 sparkline; the live API overlays the latest weeks |
| `reference.json` | category labels EN/AR + Hormuz grade, HS6 names EN/AR, country names AR, Saudi ports, corridors, country totals | labels |
| `meta.json` | provenance: bundle asset, fetch time, latest dates | footer |

GDP is annualised the way the platform does it (weekly SAR millions × 52 ÷ 10⁶ ÷ 3.75 → USD trillions) and is the platform's composite nowcast, not GASTAT. "Since 28 Feb 2026" compares the pre-war average (Nov 2025–Feb 2026) with the average since. Every panel footer names its source and freshness (**DAILY** for the datasets, **LIVE** for sentiment).

## Run it

```bash
npm install
cp .env.example .env.local        # set PORTAL_PASSWORD and SESSION_SECRET at least
npm run refresh                   # pull today's datasets from the KSA platform into data/ksa (optional — a copy ships with the repo)
npm run dev                       # http://localhost:3000
```

With no `PORTAL_PASSWORD` the gate is off (local convenience). Sentiment goes live as soon as `SOURCE_SENTIMENT_URL` can be reached.

## Deploy on Vercel (15 minutes)

1. Push this repo to GitHub (e.g. `Aieconomicpulse/rasd`) and **Import** it in the Vercel team. Framework: Next.js, defaults.
2. Environment variables (Production): `PORTAL_PASSWORD`, `SESSION_SECRET`, `SOURCE_SENTIMENT_URL`, `CRON_SECRET`; optionally `ANTHROPIC_API_KEY` + `ANTHROPIC_MODEL`, `DESK_URL`.
3. **Add a custom domain** (e.g. `rasd.economicpulse.ai`). The team's projects have Vercel Authentication on `*.vercel.app` URLs, which puts a Vercel login in front of the minister; a custom domain bypasses it and Rasd's own gate takes over.
4. The GitHub Action (`.github/workflows/snapshot.yml`) runs `npm run refresh` at 06:15 Riyadh and commits `data/ksa/`; the push redeploys. If Deployment Protection is on for the KSA platform, put its *Protection Bypass for Automation* secret in the `KSA_BYPASS_TOKEN` repository secret.
5. The cron in `vercel.json` fires `/api/cron/daily` at 06:30 Riyadh with `Authorization: Bearer $CRON_SECRET`; it revalidates the pages and warms the brief.
6. Each morning the desk sets the Hormuz state (and any hand-written alert) in `data/desk.json` — or hosts that file and points `DESK_URL` at it so no deploy is needed.

## What would still add to the picture

| Panel | Addition | Where it would come from |
|---|---|---|
| 01 | Stock-outs (product × city) | an `available:false` flag per SKU × retailer in the FoodWatch price scraper |
| 02 | Inbound vessels by port and ETA; days of supply at Gulf and Red Sea ports | GCC Shipping Intelligence (`/api/ksa-routes`) |
| 03 | Daily Brent and TASI (the series are weekly today) | KSA platform `/api/oil-price` once its model ID is fixed; Stocks analytics `/api/market-latest` |
| 03 | Riyal 12-month forward points | a market-data feed |
| 02 | Import dependence and supplier concentration per food heading | Jamarik Saudi module (`/api/ksa-dependence`) |

Status thresholds live in `lib/status.ts` (`RULES`) — deliberately visible so "why is this amber?" has a one-line answer. Tune them with the ministry.

### A bug to fix in the KSA platform

`/api/oil-price` (and likely `/api/chat` and `/api/brief`) call the Anthropic API with the hard-coded model `claude-sonnet-4-20250514`, which no longer exists — the endpoint returns `500 {"error":"Claude API error","status":404}`. Change the model string to a current one (Rasd uses `ANTHROPIC_MODEL`, default `claude-sonnet-5-5`) and the live Brent price, the advisors and the executive brief come back.

## Design rules

- **Four questions, one screen.** Nothing on the situation page that does not answer one of them.
- **Status is explainable.** Every chip comes from `RULES`; every panel shows its source and freshness.
- **Aggregates only.** Prices, flows, listings, moods — never individuals, never political sentiment.
- **Arabic-first.** Toggle in the header; RTL layout; Latin digits for numbers.
- **Indicators until the Kingdom's own feeds are in.** The footer says so on every page.

## Layout of the repo

```
app/            pages (situation, brief, modules, login) and API routes
components/     Ticker, Panel, Stat, StatusChip, Sparkline, AlertList, ModuleCard, LoginForm
lib/            ksa.ts (compute the picture) · situation.ts (compose) · sources.ts (sentiment, desk) · status.ts (RULES) · brief*.ts · i18n.ts · auth.ts
config/         modules.json — the platforms Rasd sits on
data/           ksa/ — the platform's datasets (refreshed daily) · desk.json — operator inputs
scripts/        refresh-ksa-data.mjs — daily pull from the KSA platform
middleware.ts   the access gate
vercel.json     the 06:30 Riyadh cron
```

AI Economic Pulse · economicpulse.ai

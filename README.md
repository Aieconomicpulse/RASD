# Rasd (رصد) — the economic intelligence room for Saudi Arabia

Built for a deputy minister who has five minutes before the morning meeting. The room has three doors. **Economic monitoring** is a wall of four screens, each fed by the Kingdom platforms AI Economic Pulse already runs: GDP, inflation and products intelligence, consumer spending, economic sentiment. **Alerts** ranks what the numbers call for this week (Act now / Prepare / Monitor) and shows every signal behind the ranking with the line that would raise it. **Portals** opens each platform on its own. A daily brief memo sits beside them. Saudi Arabia only.

```
┌──────────────────────────────── RASD (this repo, Next.js 15) ─────────────────────────────────┐
│  /                    The room: bottom line · the four screens · top alerts · the portals      │
│  /monitor/{gdp,inflation,spending,sentiment}   one screen each: reading, threshold, charts     │
│  /alerts              the alert system: ranked actions, key judgments, every signal and rule   │
│  /portals             the platforms behind the room, each opening alone                        │
│  /brief               the one-page memo · /api/situation · /api/brief · /api/cron/daily        │
└──────────────┬──────────────────────────┬───────────────────────────────┬─────────────────────┘
               │ datasets (daily)          │ live at request time          │ desk inputs
   data/ksa/*.json                  KSA platform /api/news-sentiment     data/desk.json or DESK_URL
   (scripts/refresh-ksa-data.mjs)   (cached 30 min)                       (Hormuz state, desk notes)
```

## What the room says, and how

| Layer | File | What it does |
|---|---|---|
| Data | `lib/ksa.ts` | Computes every reading from the platform's datasets with the platform's own formulas |
| Status | `lib/status.ts` | `RULES` and one `Condition` per measure; a pillar takes the most severe level any measure reaches; `nextThreshold()` finds the nearest line that would change it, in natural units ("Critical below 34 port calls a week; now 43, 9 away") |
| Strategy | `lib/strategy.ts` | The bottom line, three key judgments, the scorecard, the decisions (Act now / Prepare / Monitor) and the section headlines. Every sentence is a template over the data and names its evidence; nothing is invented |
| Monitors | `lib/monitors.ts` | The four screens: which signals each shows, its status (the worst of them), the reading on its face and the portals it draws on |
| Brief | `lib/brief.ts`, `lib/brief-ai.ts` | The memo. With `ANTHROPIC_API_KEY` set, the model polishes the bottom line and the pillar paragraphs from the same JSON; decisions and thresholds stay computed |

Decision rules, in order of what they look at: Hormuz-exposed food lines (re-route to the Red Sea ports), the west–east corridor (berths and trucks), supplier concentration (second sources, or stock where none exists at scale), the food index (consumer price measures), the oil windfall (funding the response), the fastest-rising category, the stock market, and growth. Each fires only when its condition holds and states the numbers that triggered it.

## Where the numbers come from

The KSA Economic Intelligence Platform (`ksa-cpi-intelligence-v2-fh4f`) publishes its datasets inside its front-end bundle and as static JSON. `scripts/refresh-ksa-data.mjs` pulls them every morning into `data/ksa/`; no new endpoints are needed on the platform.

| File | Contents | Feeds |
|---|---|---|
| `macro_weekly.json` | weekly since Jan 2019: Brent, SAMA rate, press sentiment, consumer spending, TASI, port calls, investment confidence, employment, PMI, GDP / oil / non-oil (SAR m per week) | supply (port calls), markets, growth |
| `cpi_weekly.json` | weekly non-core CPI by food category (base 100), food index, CPI overall | prices |
| `cpi_products.json` | the tracked retail basket (171 products): weight, origin, category, raw material, Hormuz flag | prices (basket exposure) |
| `hormuz_products.json` | UN Comtrade 2024 exposure per HS6 (critical + top-200): value, value via Hormuz, %, sources, Hormuz-free options with route, days and cost | supply |
| `sentiment_daily.json` | daily pooled press-sentiment score; the live API overlays the latest weeks | markets |
| `reference.json` | category labels EN/AR and Hormuz grade, HS6 names EN/AR, Arabic country names, ports, land routes, country totals | labels, corridors |
| `meta.json` | provenance: bundle asset, fetch time, latest dates | footer, sources page |

GDP is annualised the platform's way (weekly SAR millions × 52 ÷ 10⁶ ÷ 3.75 → USD trillions) and is the platform's composite nowcast, not GASTAT. "Since 28 February" compares the Nov 2025–Feb 2026 average with the average since.

## Design

- **A room, not a page.** A rail of five doors on the start side (a tab bar on a phone), a wall of screens with a status bezel along the top edge, dark by default with a designed light theme. Every screen is a door to its monitor.
- **Bottom line first.** One sentence in the largest type on the page; every section opens with a headline that says what its numbers mean.
- **Distance to the next threshold** sits beside every status, so the question "how close is this to breaking?" is answered without a chart.
- **The map is the explanation.** The Kingdom between two seas: the Hormuz lane in the desk's status colour, the Red Sea lanes and the land corridors as the open doors. Server-rendered SVG, schematic, prints.
- **Status never relies on colour.** Normal (circle), Watch (diamond), Alert (triangle), Critical (octagon): shape and word always travel with the fixed status colours. Diverging bars are neutral; the number beside them says whether the move is good news.
- **Type for reading at a distance:** nothing below 14px, body 17–19px. IBM Plex Sans and Plex Sans Condensed with IBM Plex Sans Arabic for the instrument; Source Serif 4 and Noto Naskh Arabic for the memo. Fonts are self-hosted (`@fontsource`), so the portal makes no third-party requests.
- **Arabic-first, both themes designed.** RTL layout, Latin digits, Gregorian and Hijri dates; signed figures are isolated so "+6.5%" reads correctly inside Arabic sentences. Light and dark are each tuned (`app/globals.css`); print is always light.

## Run it

```bash
npm install
cp .env.example .env.local        # set PORTAL_PASSWORD and SESSION_SECRET at least
npm run refresh                   # pull today's datasets from the KSA platform into data/ksa (a copy ships with the repo)
npm run dev                       # http://localhost:3000
```

With no `PORTAL_PASSWORD` the gate is off (local convenience). Sentiment goes live as soon as `SOURCE_SENTIMENT_URL` can be reached.

## Deploy on Vercel (15 minutes)

1. Push this repo to GitHub (e.g. `Aieconomicpulse/rasd`) and **Import** it in the Vercel team. Framework: Next.js, defaults.
2. Environment variables (Production): `PORTAL_PASSWORD`, `SESSION_SECRET`, `SOURCE_SENTIMENT_URL`, `CRON_SECRET`; optionally `ANTHROPIC_API_KEY` + `ANTHROPIC_MODEL`, `DESK_URL`.
3. **Add a custom domain** (e.g. `rasd.economicpulse.ai`). The team's projects have Vercel Authentication on `*.vercel.app` URLs, which would put a Vercel login in front of the minister; a custom domain bypasses it and Rasd's own gate takes over.
4. The GitHub Action (`.github/workflows/snapshot.yml`) runs `npm run refresh` at 06:15 Riyadh and commits `data/ksa/`, then calls the deploy workflow.
   `.github/workflows/deploy.yml` deploys every push to `main` to the Vercel project with the Vercel CLI; it needs the repository secret `VERCEL_TOKEN` (Vercel → Account settings → Tokens) and carries the team and project ids. This keeps the repository on GitHub as the single source whatever Git account Vercel is connected to. If Deployment Protection is on for the KSA platform, put its *Protection Bypass for Automation* secret in the `KSA_BYPASS_TOKEN` repository secret.
5. The cron in `vercel.json` fires `/api/cron/daily` at 06:30 Riyadh with `Authorization: Bearer $CRON_SECRET`; it revalidates the pages and warms the brief.
6. Each morning the desk sets the Hormuz state (and any note for the minister) in `data/desk.json`, or hosts that file and points `DESK_URL` at it so no deploy is needed.

## What would still add to the picture

| Pillar | Addition | Where it would come from |
|---|---|---|
| Prices | Stock-outs (product × city) | an `available:false` flag per SKU × retailer in the FoodWatch price scraper |
| Supply | Inbound vessels by port and ETA; days of supply at Gulf and Red Sea ports | GCC Shipping Intelligence (`/api/ksa-routes`) |
| Markets | Daily Brent and TASI (the series are weekly today) | KSA platform `/api/oil-price` once its model ID is fixed; Stocks analytics `/api/market-latest` |
| Markets | Riyal 12-month forward points | a market-data feed |
| Supply | Import dependence and supplier concentration per food heading | Jamarik Saudi module (`/api/ksa-dependence`) |

### A bug to fix in the KSA platform

`/api/oil-price` (and likely `/api/chat` and `/api/brief`) call the Anthropic API with the hard-coded model `claude-sonnet-4-20250514`, which no longer exists; the endpoint returns `500 {"error":"Claude API error","status":404}`. Change the model string to a current one (Rasd uses `ANTHROPIC_MODEL`, default `claude-sonnet-5-5`) and the live Brent price, the advisors and the executive brief come back.

## Layout of the repo

```
app/            the room (/), monitor/* (four screens), alerts, portals, brief, login, and API routes
components/     Rail, Screen, MonitorHead, AlertList, PortalLinks, Icons, GulfMap, TrendChart, MiniTrend, Figures, StatusPill, toggles
lib/            ksa.ts (readings) · status.ts (rules, thresholds) · strategy.ts (bottom line, decisions) · monitors.ts (the screens) · situation.ts (compose)
                sources.ts (sentiment, desk) · brief*.ts · i18n.ts · auth.ts
config/         modules.json: the platforms Rasd draws on, EN/AR
data/           ksa/ the platform's datasets (refreshed daily) · desk.json operator inputs
scripts/        refresh-ksa-data.mjs, the daily pull from the KSA platform
middleware.ts   the access gate
vercel.json     the 06:30 Riyadh cron
.github/        snapshot.yml (daily data refresh) · deploy.yml (deploy to Vercel on push)
```

AI Economic Pulse · economicpulse.ai

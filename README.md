# Rasd (رصد) — a daily economic situation picture for Saudi Arabia

One page, every morning, three questions: **Are shelves and prices holding? What is at sea, and what breaks if a strait closes? Is confidence holding?** Built by AI Economic Pulse on top of the Kingdom platforms the team already runs. Saudi Arabia only — nothing from any other country appears in the portal.

```
┌─────────────────────────────── RASD (this repo, Next.js 15) ───────────────────────────────┐
│  /            Situation — ticker · overall status · three panels · alerts                   │
│  /brief       Daily brief — five paragraphs, EN/AR, printable; model-written if key is set  │
│  /modules     The platforms the picture is composed from, with what each feeds              │
│  /api/situation  composed JSON   /api/sentiment  live proxy   /api/brief   /api/cron/daily  │
└──────────────┬──────────────────────────┬───────────────────────────────┬──────────────────┘
               │ base snapshot            │ live overlays (cached 30 min) │ links / deep dives
   data/snapshot.json            SOURCE_*_URL endpoints               config/modules.json
   (scripts/build-snapshot.mjs)   on the existing Vercel projects
```

**Live today:** press sentiment from the KSA platform's open endpoint (`/api/news-sentiment`). Everything else shows the sample snapshot and says so on screen (`SAMPLE — source not wired`) until its endpoint exists — the portal never claims a number is live when it is not.

## The projects it links (Vercel team `economicpulse-5887s-projects`)

| Project | What it holds | Feeds Rasd |
|---|---|---|
| `ksa-cpi-intelligence-v2-fh4f` — *Hormuz FoodWatch* + *KSA Macroeconomic Pulse* | 154 food products tracked daily; weekly non-core CPI by category; source→route→category flows; Hormuz exposure per HS6 product with alternatives; GDP tracker; 12 indicators; daily press sentiment; AI advisors; executive brief | **sentiment (live)**; to wire: `/api/cpi-latest`, `/api/hormuz-exposure`, `/api/macro-latest` |
| `gcc-optimal-shipping-routes` — *GCC Shipping Intelligence* | Import supply chains and Hormuz exposure for the six GCC states; rerouting cost and transit | to wire: `/api/ksa-routes` |
| `argaam-intelligence-portal-main` / `stocks-intelligence-portal` — *KSA Stocks Analytics* | Tadawul research engine, EN/AR | to wire: `/api/market-latest` |
| `multiple-country-jamarik` — *Jamarik*, Saudi module | Trade-mirror forensics for the Kingdom; product-level dependence and origin-adjusted supplier concentration | to wire: `/api/ksa-dependence` |

Deep links open in their own window (several set `X-Frame-Options: DENY`, so they cannot be embedded).

## Run it

```bash
npm install
cp .env.example .env.local        # set PORTAL_PASSWORD and SESSION_SECRET at least
npm run dev                       # http://localhost:3000
```

With no `PORTAL_PASSWORD` the gate is off (local convenience). The sample snapshot renders immediately; sentiment goes live as soon as `SOURCE_SENTIMENT_URL` can be reached.

## Deploy on Vercel (15 minutes)

1. Push this repo to GitHub (e.g. `Aieconomicpulse/rasd`) and **Import** it in the Vercel team. Framework: Next.js, defaults.
2. Environment variables (Production): `PORTAL_PASSWORD`, `SESSION_SECRET`, `SOURCE_SENTIMENT_URL`, `CRON_SECRET`; optionally `ANTHROPIC_API_KEY` + `ANTHROPIC_MODEL`.
3. **Add a custom domain** (e.g. `rasd.economicpulse.ai`). The team's projects have Vercel Authentication on `*.vercel.app` URLs, which puts a Vercel login in front of the minister; a custom domain bypasses it and Rasd's own gate takes over.
4. The cron in `vercel.json` fires `/api/cron/daily` at 03:30 UTC (06:30 Riyadh) with `Authorization: Bearer $CRON_SECRET`; it refreshes the picture and warms the brief.
5. Run `node scripts/build-snapshot.mjs` daily at 06:15 Riyadh wherever the pipelines live (GitHub Action, the pipeline server) and host the result (`SNAPSHOT_URL`) — or commit `data/snapshot.json` and let the deploy carry it.

## Wiring — what each platform needs to expose

Each endpoint returns the matching block of `data/snapshot.sample.json`; Rasd merges it over the base and flips that panel to **LIVE**. Keep them public-read or protect with a shared header and extend `lib/sources.ts` accordingly.

| Env var | Endpoint to add | Block | Where the data already is |
|---|---|---|---|
| `SOURCE_CPI_URL` | KSA platform `/api/cpi-latest` | `shelves` | FoodWatch weekly category trends + daily retail tracking; add out-of-stock detection to the price scraper (`available: false` per SKU × retailer) |
| `SOURCE_SUPPLY_URL` | Shipping `/api/ksa-routes` | `supply.hormuz/portCalls/inbound` | Shipping engine (vessels bound for Saudi ports by type and ETA; port-call counts) |
| `SOURCE_EXPOSURE_URL` (snapshot script) | KSA platform `/api/hormuz-exposure` | `supply.exposure/topAtRisk` | FoodWatch Comtrade map (HS6 × source × Hormuz %, alternatives) |
| `SOURCE_MACRO_URL` | KSA platform `/api/macro-latest` | `confidence` (Brent, TASI, SAMA, PMI, flights, rentals) | Macro Pulse indicators; add the two new scrapers (outbound fares, Eastern Province rental listings) |
| `SOURCE_MARKETS_URL` | Stocks `/api/market-latest` | `confidence.tasi/riyalFwd12m` | Stocks analytics; riyal forwards from a market-data feed |
| `SOURCE_SENTIMENT_URL` | KSA platform `/api/news-sentiment` | `confidence.sentiment` | **already live** |

Status thresholds live in `lib/status.ts` (`RULES`) — deliberately visible so "why is this amber?" has a one-line answer. Tune them with the ministry.

### A bug to fix in the KSA platform first

`/api/oil-price` (and likely `/api/chat` and `/api/brief`) call the Anthropic API with the hard-coded model `claude-sonnet-4-20250514`, which no longer exists — the endpoint currently returns `500 {"error":"Claude API error","status":404}`. Change the model string to a current one (Rasd uses `ANTHROPIC_MODEL`, default `claude-sonnet-5-5`) and the live Brent price, the advisors and the executive brief come back.

## Design rules

- **Three questions, one screen.** Nothing on the situation page that does not answer one of them.
- **Status is explainable.** Every chip comes from `RULES`; every panel shows its source and whether it is live.
- **Aggregates only.** Prices, flows, listings, moods — never individuals, never political sentiment.
- **Arabic-first.** Toggle in the header; RTL layout; Latin digits for numbers.
- **Indicators until the Kingdom's own feeds are in.** The footer says so on every page.

## Layout of the repo

```
app/            pages (situation, brief, modules, login) and API routes
components/     Ticker, Panel, Stat, StatusChip, Sparkline, AlertList, ModuleCard, LoginForm
lib/            situation.ts (compose) · sources.ts (fetch) · status.ts (RULES) · brief*.ts · i18n.ts · auth.ts
config/         modules.json — the platforms Rasd sits on
data/           snapshot.sample.json (contract + sample); snapshot.json is generated
scripts/        build-snapshot.mjs — daily base snapshot from the sources
middleware.ts   the access gate
vercel.json     the 06:30 Riyadh cron
```

AI Economic Pulse · economicpulse.ai

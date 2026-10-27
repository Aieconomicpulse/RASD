#!/usr/bin/env node
/**
 * Builds data/snapshot.json — the base of the daily picture — from the sources the team runs.
 *
 * Run daily at 06:15 Riyadh (before the Vercel cron at 06:30) from a GitHub Action, a cron on the
 * pipeline server, or by hand:   node scripts/build-snapshot.mjs
 *
 * Each adapter returns the matching block of the snapshot (see data/snapshot.sample.json) or null.
 * A null adapter keeps the previous value for that block and leaves its `sample` flag as it was —
 * nothing on the portal ever claims to be live when it is not.
 *
 * Wiring plan (see README › Wiring):
 *   shelves     ← KSA platform  /api/cpi-latest          (FoodWatch daily retail tracking)
 *   supply      ← KSA platform  /api/hormuz-exposure  +  Shipping  /api/ksa-routes
 *   confidence  ← KSA platform  /api/macro-latest     +  Stocks    /api/market-latest
 *   sentiment   ← overlaid live by the portal itself; nothing to do here
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'data', 'snapshot.json');
const SAMPLE = path.join(ROOT, 'data', 'snapshot.sample.json');

async function getJson(url) {
  if (!url) return null;
  try { const r = await fetch(url, { headers: { accept: 'application/json' } }); return r.ok ? await r.json() : null; }
  catch { return null; }
}

// ---- adapters ---------------------------------------------------------------
// Each one maps the source's JSON to the snapshot block. They are written to the contract the
// source endpoint should expose; adjust the field names once the endpoint exists.
const adapters = {
  shelves: async () => {
    const j = await getJson(process.env.SOURCE_CPI_URL);
    if (!j) return null;
    return {
      sample: false,
      productsTracked: j.productsTracked,
      foodCpi: { value: j.foodCpi, wow: j.foodCpiWow, mom: j.foodCpiMom, base: 'index, base 100' },
      cpiOverall: { value: j.cpiOverall, wow: j.cpiOverallWow, mom: j.cpiOverallMom },
      fastestRising: (j.fastestRising ?? []).slice(0, 5),
      stockouts: j.stockouts ?? { count: 0, items: [] },
      source: 'Hormuz FoodWatch — daily retail tracking',
    };
  },
  supply: async () => {
    const [exp, routes] = await Promise.all([getJson(process.env.SOURCE_EXPOSURE_URL), getJson(process.env.SOURCE_SUPPLY_URL)]);
    if (!exp && !routes) return null;
    return {
      sample: false,
      hormuz: routes?.hormuz,
      exposure: exp?.exposure,
      portCalls: routes?.portCalls,
      inbound: routes?.inbound,
      topAtRisk: (exp?.topAtRisk ?? []).slice(0, 6),
      source: 'FoodWatch Comtrade map + GCC Shipping Intelligence',
    };
  },
  confidence: async () => {
    const [macro, mkt] = await Promise.all([getJson(process.env.SOURCE_MACRO_URL), getJson(process.env.SOURCE_MARKETS_URL)]);
    if (!macro && !mkt) return null;
    return {
      sample: false,
      brent: macro?.brent, tasi: mkt?.tasi ?? macro?.tasi, samaRate: macro?.samaRate, pmi: macro?.pmi,
      riyalFwd12m: mkt?.riyalFwd12m ?? null, flights: macro?.flights ?? null, rentals: macro?.rentals ?? null,
      source: 'Macro Pulse + markets',
    };
  },
};

function stripUndefined(o) { return JSON.parse(JSON.stringify(o)); }

const prev = JSON.parse(await fs.readFile(await fs.access(OUT).then(() => OUT, () => SAMPLE), 'utf8'));
const next = { ...prev, asOf: new Date().toISOString() };
for (const [block, fn] of Object.entries(adapters)) {
  const v = await fn();
  if (v) next[block] = { ...prev[block], ...stripUndefined(v) };
  console.log(`${block.padEnd(11)} ${v ? 'updated' : 'kept (source not wired)'}`);
}
next.sample = Boolean(next.shelves.sample || next.supply.sample || next.confidence.sample);
delete next._comment;
await fs.writeFile(OUT, JSON.stringify(next, null, 2));
console.log(`wrote ${path.relative(ROOT, OUT)} · sample=${next.sample}`);

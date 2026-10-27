#!/usr/bin/env node
/**
 * Refreshes data/ksa/*.json from the KSA Economic Intelligence Platform (ksa-cpi-intelligence-v2-fh4f).
 *
 * The platform ships its datasets inside its front-end bundle and as static JSON, so Rasd reads them
 * directly — no new API endpoints are needed on the platform side. What is pulled:
 *
 *   macro_weekly.json      weekly macro series since 2019: Brent, SAMA rate, sentiment, spending, TASI,
 *                          port calls, investment, employment, PMI, GDP / oil GDP / non-oil GDP (SAR m per week)
 *   cpi_weekly.json        weekly non-core CPI by food category (base 100), FoodOverall and CPI
 *   cpi_products.json      the tracked retail basket: product, weight, origin, category, raw material, Hormuz flag
 *   hormuz_products.json   UN Comtrade 2024 import exposure per HS6 (critical + top-200 lists, compacted):
 *                          value, value via Hormuz, %, main source, top sources, alternatives, land routes
 *   sentiment_daily.json   daily pooled press-sentiment score (long history; the live API overlays the last weeks)
 *   reference.json         category labels EN/AR + Hormuz exposure grade, HS6 names EN/AR, country names AR,
 *                          Saudi ports, land corridors, sea alternatives, country totals
 *   meta.json              provenance: bundle asset, fetch time, latest dates
 *
 * Usage
 *   node scripts/refresh-ksa-data.mjs                      # live, from KSA_BASE_URL (default: the Vercel app)
 *   node scripts/refresh-ksa-data.mjs --from-dir <dir>      # offline: <dir>/bundle.js, sau_critical.json, sau_top200.json
 *
 * Env
 *   KSA_BASE_URL        https://ksa-cpi-intelligence-v2-fh4f.vercel.app
 *   KSA_BYPASS_TOKEN    Vercel "Protection Bypass for Automation" secret, if Deployment Protection is on
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'data', 'ksa');
const BASE = (process.env.KSA_BASE_URL || 'https://ksa-cpi-intelligence-v2-fh4f.vercel.app').replace(/\/$/, '');
const argDir = process.argv.indexOf('--from-dir') > -1 ? process.argv[process.argv.indexOf('--from-dir') + 1] : null;

const headers = { accept: '*/*' };
if (process.env.KSA_BYPASS_TOKEN) headers['x-vercel-protection-bypass'] = process.env.KSA_BYPASS_TOKEN;

async function getText(url) {
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}

// ---- 1. locate the bundle and the Comtrade files -------------------------------------------
let bundle, asset, critical, top200;
if (argDir) {
  bundle = await fs.readFile(path.join(argDir, 'bundle.js'), 'utf8');
  asset = path.join(argDir, 'bundle.js');
  critical = JSON.parse(await fs.readFile(path.join(argDir, 'sau_critical.json'), 'utf8'));
  top200 = JSON.parse(await fs.readFile(path.join(argDir, 'sau_top200.json'), 'utf8'));
} else {
  const html = await getText(BASE + '/');
  const m = html.match(/src="(\/assets\/index-[\w-]+\.js)"/);
  if (!m) throw new Error('bundle asset not found in index.html');
  asset = m[1];
  bundle = await getText(BASE + asset);
  critical = JSON.parse(await getText(BASE + '/data/sau_critical.json'));
  top200 = JSON.parse(await getText(BASE + '/data/sau_top200.json'));
}

// ---- 2. pull object/array literals out of the minified bundle --------------------------------
function literalAt(src, start) {
  let depth = 0, k = start, str = null;
  for (; k < src.length; k++) {
    const c = src[k];
    if (str) { if (c === '\\') { k++; continue; } if (c === str) str = null; continue; }
    if (c === '"' || c === "'" || c === '`') { str = c; continue; }
    if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') { depth--; if (depth === 0) return src.slice(start, k + 1); }
  }
  throw new Error('unterminated literal');
}
function extract(signature, { last = false } = {}) {
  const re = new RegExp(signature.source, 'g');
  let m, hit = null;
  while ((m = re.exec(bundle))) { hit = m; if (!last) break; }
  if (!hit) throw new Error(`signature not found: ${signature}`);
  const lit = literalAt(bundle, hit.index + hit[0].indexOf(hit[1]));
  return vm.runInNewContext('(' + lit + ')', {}, { timeout: 5000 });
}
const macro = extract(/=(\[)\{date:"\d{4}-\d\d-\d\d",oil:/);
const cpiWeekly = extract(/=(\[)\{week:"\d{4}-\d\d-\d\d",BreadAndCereals:/);
const products = extract(/=(\[)\{c:"\d+",p:"/);
const exposureGrade = extract(/=(\{)BreadAndCereals:"(?:HIGH|MEDIUM|LOW|NONE)"/);
const labels = extract(/=(\{)BreadAndCereals:\{en:"/);
const sentimentDaily = extract(/=(\[)\{date:"\d{4}-\d\d-\d\d",score:/);
const country = extract(/=(\{)country:"Saudi Arabia",code:682,/);
const ports = extract(/=(\[)\{id:"jeddah",name:"Jeddah Islamic Port"/);
const landRoutes = extract(/=(\{)ARE:\{jeddah:\{dist:/);
const seaAlternatives = extract(/=(\[)\{id:"rice",name:"Indian Rice"/);
const countryAr = extract(/=(\{)Argentina:"/);
// HS6 name maps: two objects keyed by 6-digit codes — one English, one Arabic
const hs6Maps = [];
for (const m of bundle.matchAll(/=(\{)"\d{6}":"/g)) {
  const obj = vm.runInNewContext('(' + literalAt(bundle, m.index + 1) + ')', {}, { timeout: 5000 });
  if (Object.keys(obj).length > 100) hs6Maps.push(obj);
}
const isAr = (s) => /[؀-ۿ]/.test(s);
const hs6Names = hs6Maps.find((o) => !isAr(Object.values(o)[0])) || {};
const hs6NamesAr = hs6Maps.find((o) => isAr(Object.values(o)[0])) || {};

// ---- 3. compact the Comtrade exposure lists ------------------------------------------------
const seen = new Map();
for (const p of [...critical, ...top200]) if (!seen.has(p.hs6)) seen.set(p.hs6, p);
const route = (r) => (r ? { route: r.route, days: r.days, cost: r.cost, hormuz: Boolean(r.hormuz), dest: r.dest, risk: r.risk } : null);
const hormuzProducts = [...seen.values()]
  .map((p) => ({
    hs6: String(p.hs6), chapter: String(p.chapter), chapterName: p.chapterName,
    name: hs6Names[p.hs6] || p.productName || p.chapterName || `HS ${p.hs6}`, name_ar: hs6NamesAr[p.hs6] || null,
    totalValue: Math.round(p.totalValue || 0), hormuzValue: Math.round(p.hormuzValue || 0), hormuzPct: Number(p.hormuzPct || 0),
    mainSource: p.mainSource, sourceCount: p.sourceCount ?? (p.sources || []).length,
    sources: (p.sources || []).slice(0, 4).map((s) => ({ country: s.country, value: Math.round(s.value || 0), route: route(s.route) })),
    alternatives: (p.alternatives || []).slice(0, 4).map((a) => ({ country: a.country, existingValue: Math.round(a.value || 0), route: route(a.route), aiSuggested: Boolean(a.aiSuggested), reason: a.reason || null })),
    landRoutes: (p.landRoutes || []).map((l) => ({ from: l.from, via: l.via, days: l.days, cost: l.cost, note: l.note })),
  }))
  .sort((a, b) => b.hormuzValue - a.hormuzValue);

// ---- 4. write ------------------------------------------------------------------------------
await fs.mkdir(OUT, { recursive: true });
const w = (name, obj) => fs.writeFile(path.join(OUT, name), JSON.stringify(obj));
await Promise.all([
  w('macro_weekly.json', macro),
  w('cpi_weekly.json', cpiWeekly),
  w('cpi_products.json', products),
  w('hormuz_products.json', hormuzProducts),
  w('sentiment_daily.json', sentimentDaily),
  w('reference.json', {
    categories: Object.fromEntries(Object.entries(labels).map(([k, v]) => [k, { ...v, hormuz: exposureGrade[k] || (k === 'CPI' || k === 'FoodOverall' ? 'INDEX' : 'NONE') }])),
    country, ports, landRoutes: landRoutes.SAU || {}, seaAlternatives, countryAr,
  }),
  w('meta.json', {
    platform: 'KSA Economic Intelligence Platform (ksa-cpi-intelligence-v2-fh4f)', base: BASE, asset, fetchedAt: new Date().toISOString(),
    latest: { macro: macro.at(-1)?.date, cpi: cpiWeekly.at(-1)?.week, sentimentDaily: sentimentDaily.at(-1)?.date, comtradeYear: country.year },
    counts: { macroWeeks: macro.length, cpiWeeks: cpiWeekly.length, products: products.length, hormuzProducts: hormuzProducts.length },
    warStart: '2026-02-28',
  }),
]);
console.log(`ksa data refreshed → ${path.relative(ROOT, OUT)}  macro ${macro.at(-1)?.date} · cpi ${cpiWeekly.at(-1)?.week} · ${products.length} products · ${hormuzProducts.length} HS6`);

/**
 * The base picture, computed from the KSA Economic Intelligence Platform's own datasets
 * (data/ksa/*.json, refreshed daily by scripts/refresh-ksa-data.mjs). Every number on the
 * situation page that is not the live sentiment overlay comes from here, and every formula is
 * the one the platform itself uses (GDP: weekly SAR millions × 52 ÷ 1e6 ÷ 3.75 → USD trillions).
 */
import macroRaw from '@/data/ksa/macro_weekly.json';
import cpiRaw from '@/data/ksa/cpi_weekly.json';
import productsRaw from '@/data/ksa/cpi_products.json';
import hormuzRaw from '@/data/ksa/hormuz_products.json';
import reference from '@/data/ksa/reference.json';
import meta from '@/data/ksa/meta.json';
import sentimentDaily from '@/data/ksa/sentiment_daily.json';
import { sentimentBand } from './sentiment';
import type { AtRiskProduct, Category, Corridor, Desk, HormuzGrade, Point, Snapshot, SupplyOption, WarRow } from './types';

interface MacroRow { date: string; oil: number; ir: number; sent: number; spend: number; tasi: number; ports: number | null; invest: number; emp: number; pmi: number; gdp: number | null; oilGdp: number | null; nonOilGdp: number | null }
interface Product { c: string; p: string; w: number; o: string; cat: string; rm: string; rk: string; rs: string; hz: string }
interface RouteRef { days?: string; cost?: string; dest?: string; hormuz?: boolean }
interface HormuzProduct {
  hs6: string; chapter: string; chapterName: string; name: string; name_ar: string | null; totalValue: number; hormuzValue: number; hormuzPct: number; mainSource: string;
  sources: { country: string; value: number; route: RouteRef | null }[];
  alternatives: { country: string; existingValue: number; route: RouteRef | null; aiSuggested: boolean; reason: string | null }[];
}
type CpiRow = Record<string, number | string>;
interface LandRoute { dist: string; days: string; cost: string; via: string; warn?: boolean }

const macro = macroRaw as unknown as MacroRow[];
const cpi = cpiRaw as unknown as CpiRow[];
const products = productsRaw as unknown as Product[];
const hormuz = hormuzRaw as unknown as HormuzProduct[];
const ref = reference as unknown as {
  categories: Record<string, { en: string; ar: string; hormuz: HormuzGrade }>;
  country: { year: number; totalProducts: number; totalTradeValue: number; hormuzExposedValue: number; hormuzPct: number; criticalProducts: number };
  countryAr: Record<string, string>;
  landRoutes: Record<string, LandRoute>;
};
const sentDaily = sentimentDaily as { date: string; score: number }[];

export const WAR_START = (meta as { warStart?: string }).warStart ?? '2026-02-28';
const PRE_WAR_FROM = '2025-11-01';
const CHART_FROM = '2025-01-01';

const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;
/** "2-2 days" → "2", "11-16" → "11–16" */
export const tidyDays = (d?: string | null) => { if (!d) return null; const m = d.match(/(\d+)\s*-\s*(\d+)/); return m ? (m[1] === m[2] ? m[1] : `${m[1]}–${m[2]}`) : d.replace(/\s*days?/i, '').trim(); };
/** "$17-25/ton" → "$17–25/t" */
export const tidyCost = (c?: string | null) => (c ? c.replace('-', '–').replace('/ton', '/t') : null);
const km = (d?: string) => (d ? Number(d.replace(/[^\d]/g, '')) || null : null);
const pct = (now: number, then: number) => (then ? r1(((now - then) / then) * 100) : 0);
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const annUsdT = (sarMillionsPerWeek: number) => r2((sarMillionsPerWeek * 52) / 1e6 / 3.75);
const withKey = <K extends keyof MacroRow>(k: K) => macro.filter((r) => r[k] !== null && r[k] !== undefined);
const num = (v: number | string | undefined) => (typeof v === 'number' ? v : NaN);
const ar = (country: string) => ref.countryAr[country] ?? ref.countryAr[country === 'USA' ? 'United States' : country] ?? null;

const CAT_KEYS = Object.keys(ref.categories).filter((k) => k !== 'CPI' && k !== 'FoodOverall');

// ---- Prices & shelves -----------------------------------------------------------------------------
function shelves(): Snapshot['shelves'] {
  const t = cpi[cpi.length - 1], n = cpi[cpi.length - 2], t4 = cpi[cpi.length - 5], t52 = cpi[cpi.length - 53];
  const pre = cpi.filter((r) => String(r.week) < WAR_START), post = cpi.filter((r) => String(r.week) >= WAR_START);
  const avg = (rows: CpiRow[], k: string) => mean(rows.map((r) => num(r[k])).filter(Number.isFinite));
  const categories: Category[] = CAT_KEYS.filter((k) => Number.isFinite(num(t[k]))).map((k) => ({
    key: k, label_en: ref.categories[k].en, label_ar: ref.categories[k].ar, value: num(t[k]), wow: pct(num(t[k]), num(n[k])),
    m4: t4 ? pct(num(t[k]), num(t4[k])) : null,
    hormuz: ref.categories[k].hormuz, sinceWar: pre.length && post.length ? r1(avg(post, k) - avg(pre, k)) : null,
  })).sort((a, b) => b.wow - a.wow);
  const byWar = [...categories].filter((c) => c.sinceWar !== null).sort((a, b) => (b.sinceWar ?? 0) - (a.sinceWar ?? 0));
  const totalW = products.reduce((a, p) => a + p.w, 0);
  const direct = products.filter((p) => p.hz === 'Yes').sort((a, b) => b.w - a.w);
  const raw = products.filter((p) => p.rk === 'Yes');
  return {
    status: 'normal', asOf: String(t.week), productsTracked: products.length,
    foodCpi: { value: num(t.FoodOverall), wow: pct(num(t.FoodOverall), num(n.FoodOverall)), m4: t4 ? pct(num(t.FoodOverall), num(t4.FoodOverall)) : null, yoy: t52 ? pct(num(t.FoodOverall), num(t52.FoodOverall)) : null, asOf: String(t.week) },
    cpiOverall: { value: num(t.CPI), wow: pct(num(t.CPI), num(n.CPI)), m4: t4 ? pct(num(t.CPI), num(t4.CPI)) : null, yoy: t52 ? pct(num(t.CPI), num(t52.CPI)) : null, asOf: String(t.week) },
    categories, fastestRising: categories.slice(0, 4), highest: [...categories].sort((a, b) => b.value - a.value)[0],
    sinceWar: { start: WAR_START, preWeeks: pre.length, postWeeks: post.length, foodPre: r1(avg(pre, 'FoodOverall')), foodPost: r1(avg(post, 'FoodOverall')), worst: byWar[0] ?? null, eased: byWar[byWar.length - 1] ?? null },
    basket: {
      directProducts: direct.length, directWeightPct: r1((direct.reduce((a, p) => a + p.w, 0) / totalW) * 100),
      rawMaterialRiskProducts: raw.length, rawMaterialRiskWeightPct: r1((raw.reduce((a, p) => a + p.w, 0) / totalW) * 100),
      direct: direct.slice(0, 6).map((p) => ({ product: p.p.replace(/\s+/g, ' ').trim(), origin: p.o, weight: p.w })),
    },
    series: cpi.map((r) => ({ date: String(r.week), food: num(r.FoodOverall), cpi: num(r.CPI) })),
    stockouts: null,
    source: `KSA platform, FoodWatch weekly non-core CPI (${products.length} products) to ${t.week}`,
  };
}

// ---- Supply & routes --------------------------------------------------------------------------------
function options(p: HormuzProduct): SupplyOption[] {
  const all = p.alternatives.map((a) => ({
    country: a.country === 'USA' ? 'United States' : a.country, country_ar: ar(a.country), usdM: r1((a.existingValue || 0) / 1e6), days: tidyDays(a.route?.days), cost: tidyCost(a.route?.cost),
    port: a.route?.dest ?? null, suggested: Boolean(a.aiSuggested) && !(a.existingValue > 0), reason: a.reason ?? null,
  }));
  const lead = (o: SupplyOption) => parseFloat(o.days ?? '') || 999;
  return [...all.filter((o) => !o.suggested && o.usdM > 0).sort((a, b) => b.usdM - a.usdM), ...all.filter((o) => o.suggested || o.usdM <= 0).sort((a, b) => lead(a) - lead(b))];
}

function corridors(): Corridor[] {
  const lr = ref.landRoutes;
  const c = (id: string, kind: 'sea' | 'land', name: Corridor['name'], via: Corridor['via']): Corridor | null =>
    lr[id] ? { id, kind, name, via, km: km(lr[id].dist), days: tidyDays(lr[id].days), cost: tidyCost(lr[id].cost), warn: Boolean(lr[id].warn) } : null;
  return [
    c('jeddah', 'sea', { en: 'Jeddah', ar: 'جدة' }, { en: 'Red Sea port; road east via Riyadh to Dammam', ar: 'ميناء على البحر الأحمر؛ طريق شرقاً عبر الرياض إلى الدمام' }),
    c('kingabdullah', 'sea', { en: 'King Abdullah Port', ar: 'ميناء الملك عبدالله' }, { en: 'Red Sea port; road east via Riyadh', ar: 'ميناء على البحر الأحمر؛ طريق شرقاً عبر الرياض' }),
    c('yanbu', 'sea', { en: 'Yanbu', ar: 'ينبع' }, { en: 'Red Sea port; road east via Riyadh', ar: 'ميناء على البحر الأحمر؛ طريق شرقاً عبر الرياض' }),
    c('fujairah', 'land', { en: 'Fujairah', ar: 'الفجيرة' }, { en: 'Gulf of Oman port outside the strait; road via Ghuwaifat', ar: 'ميناء على خليج عُمان خارج المضيق؛ طريق عبر الغويفات' }),
    c('duqm', 'land', { en: 'Duqm', ar: 'الدقم' }, { en: 'Arabian Sea port; road via Buraimi and Ghuwaifat', ar: 'ميناء على بحر العرب؛ طريق عبر البريمي والغويفات' }),
    c('aqaba', 'land', { en: 'Aqaba', ar: 'العقبة' }, { en: 'Jordan; road via the Durra border and Tabuk', ar: 'الأردن؛ طريق عبر منفذ الدرة وتبوك' }),
  ].filter((x): x is Corridor => x !== null);
}

function supply(desk: Desk | null): Snapshot['supply'] {
  const c = ref.country;
  const food = hormuz.filter((p) => Number(p.chapter) <= 24).sort((a, b) => b.hormuzValue - a.hormuzValue);
  const foodTotal = food.reduce((a, p) => a + p.totalValue, 0), foodHz = food.reduce((a, p) => a + p.hormuzValue, 0);
  const exposed = food.filter((p) => p.hormuzPct >= 50);
  const bucket = (p: number) => (p >= 70 ? 'critical' : p >= 40 ? 'high' : p >= 10 ? 'moderate' : 'low');
  const buckets = { critical: 0, high: 0, moderate: 0, low: 0 };
  for (const p of hormuz) buckets[bucket(p.hormuzPct)]++;
  const ports = withKey('ports') as (MacroRow & { ports: number })[];
  const last = ports[ports.length - 1], prev = ports[ports.length - 2];
  const avg2025 = Math.round(mean(ports.filter((r) => r.date.startsWith('2025')).map((r) => r.ports)));
  const topAtRisk: AtRiskProduct[] = food.slice(0, 6).map((p) => {
    const opts = options(p);
    const existing = opts.filter((o) => !o.suggested && o.usdM > 0).reduce((a, o) => a + o.usdM, 0);
    const existingShare = r1((existing / (p.totalValue / 1e6)) * 100);
    const top = [...(p.sources ?? [])].sort((a, b) => b.value - a.value)[0];
    return {
      hs6: p.hs6, product: p.name, product_ar: p.name_ar, chapter: p.chapterName,
      hormuzPct: p.hormuzPct, hormuzUsdM: Math.round(p.hormuzValue / 1e6), totalUsdM: Math.round(p.totalValue / 1e6),
      mainSource: (top?.country ?? p.mainSource) === 'USA' ? 'United States' : top?.country ?? p.mainSource, mainSource_ar: ar(top?.country ?? p.mainSource), mainShare: top ? r1((top.value / p.totalValue) * 100) : 0,
      options: opts, existingShare, atScale: existingShare >= 5,
    };
  });
  const h = desk?.hormuz;
  return {
    status: 'normal', asOf: last.date,
    hormuz: h
      ? { state: h.state, since: h.since ?? null, note_en: h.note_en, note_ar: h.note_ar, setBy: 'desk' }
      : { state: 'restricted', since: WAR_START, setBy: 'default', note_en: 'Default since 28 Feb 2026; the desk sets this each morning.', note_ar: 'الوضع الافتراضي منذ 28 فبراير 2026؛ يحدّده المكتب كل صباح.' },
    exposure: {
      comtradeYear: c.year, importsViaHormuzPct: c.hormuzPct, importsViaHormuzUsdB: r1(c.hormuzExposedValue / 1e9), importsTotalUsdB: r1(c.totalTradeValue / 1e9), criticalProducts: c.criticalProducts, productsCovered: c.totalProducts,
      foodViaHormuzPct: r1((foodHz / foodTotal) * 100), foodViaHormuzUsdB: r2(foodHz / 1e9), foodImportsUsdB: r1(foodTotal / 1e9), foodProductsCovered: food.length,
      foodExposed: { lines: exposed.length, usdB: r1(exposed.reduce((a, p) => a + p.hormuzValue, 0) / 1e9), top5UsdB: r1(exposed.slice(0, 5).reduce((a, p) => a + p.hormuzValue, 0) / 1e9) },
      buckets,
    },
    portCalls: { weekly: last.ports, wow: pct(last.ports, prev.ports), vs2025: pct(last.ports, avg2025), avg2025, asOf: last.date, series: macro.filter((r) => r.date >= CHART_FROM).map((r) => ({ date: r.date, value: r.ports })) },
    topAtRisk, corridors: corridors(),
    source: `UN Comtrade ${c.year} via the KSA platform (${c.totalProducts.toLocaleString('en-US')} products); port calls to ${last.date}`,
  };
}

// ---- Confidence & markets -------------------------------------------------------------------------------
function confidence(): Snapshot['confidence'] {
  const t = macro[macro.length - 1], n = macro[macro.length - 2], t4 = macro[macro.length - 5];
  const pre = macro.filter((r) => r.date >= PRE_WAR_FROM && r.date < WAR_START);
  const preOil = r1(mean(pre.map((r) => r.oil)));
  const trend = (k: 'oil' | 'tasi'): Point[] => macro.slice(-26).map((r) => ({ date: r.date, value: r[k] }));
  const sd = sentDaily.slice(-60);
  const last = sd[sd.length - 1];
  return {
    status: 'normal', asOf: t.date,
    brent: { value: t.oil, wow: pct(t.oil, n.oil), m4: pct(t.oil, t4.oil), asOf: t.date, preWar: preOil, vsPreWar: pct(t.oil, preOil) },
    tasi: { value: t.tasi, wow: pct(t.tasi, n.tasi), m4: pct(t.tasi, t4.tasi), asOf: t.date },
    samaRate: t.ir, pmi: t.pmi,
    investment: { value: t.invest, wow: pct(t.invest, n.invest), asOf: t.date },
    brentTrend: trend('oil'), tasiTrend: trend('tasi'),
    sentiment: { score: r2(last.score), band: sentimentBand(last.score), date: last.date, headlineCount: 0, trend: sd.map((p) => ({ date: p.date, score: r2(p.score) })), headlines: [], live: false },
    source: `KSA platform, weekly indicators to ${t.date}; press sentiment daily`,
  };
}

// ---- Growth ----------------------------------------------------------------------------------------------
function economy(): Snapshot['economy'] {
  const g = withKey('gdp') as (MacroRow & { gdp: number })[];
  const t = g[g.length - 1], n = g[g.length - 2], t4 = g[g.length - 5];
  const m = macro[macro.length - 1], mp = macro[macro.length - 2], m4 = macro[macro.length - 5];
  const yearAgo = macro.filter((r) => r.date <= `${Number(m.date.slice(0, 4)) - 1}${m.date.slice(4)}`).at(-1);
  const pre = macro.filter((r) => r.date >= PRE_WAR_FROM && r.date < WAR_START), post = macro.filter((r) => r.date >= WAR_START);
  const avg = (rows: MacroRow[], k: keyof MacroRow) => mean(rows.map((r) => r[k]).filter((v): v is number => typeof v === 'number'));
  const row = (key: keyof MacroRow, label_en: string, label_ar: string, digits: number, unit?: string, f: (v: number) => number = (v) => v): WarRow => ({ key, label_en, label_ar, pre: f(avg(pre, key)), post: f(avg(post, key)), digits, unit });
  const years: Record<string, MacroRow[]> = {};
  for (const r of macro) (years[r.date.slice(0, 4)] ??= []).push(r);
  const annual = Object.entries(years).map(([year, rows]) => ({
    year, weeks: rows.length,
    gdpUsdT: Number.isFinite(avg(rows, 'gdp')) ? annUsdT(avg(rows, 'gdp')) : null, oilUsdT: Number.isFinite(avg(rows, 'oilGdp')) ? annUsdT(avg(rows, 'oilGdp')) : null, nonOilUsdT: Number.isFinite(avg(rows, 'nonOilGdp')) ? annUsdT(avg(rows, 'nonOilGdp')) : null,
    brent: r1(avg(rows, 'oil')), portCalls: Number.isFinite(avg(rows, 'ports')) ? Math.round(avg(rows, 'ports')) : null, spending: r1(avg(rows, 'spend')),
  }));
  const last26 = (k: 'spend' | 'emp' | 'pmi'): Point[] => macro.slice(-26).map((r) => ({ date: r.date, value: r[k] }));
  return {
    status: 'normal', asOf: t.date,
    gdp: {
      totalUsdT: annUsdT(t.gdp), oilUsdT: annUsdT(t.oilGdp ?? 0), nonOilUsdT: annUsdT(t.nonOilGdp ?? 0), oilShare: r1(((t.oilGdp ?? 0) / t.gdp) * 100),
      momentum4w: pct(annUsdT(t.gdp), annUsdT(t4.gdp)), wow: pct(t.gdp, n.gdp),
      series: g.filter((r) => r.date >= CHART_FROM).map((r) => ({ date: r.date, total: annUsdT(r.gdp), nonOil: annUsdT(r.nonOilGdp ?? 0) })),
    },
    spending: { value: m.spend, wow: pct(m.spend, mp.spend), m4: pct(m.spend, m4.spend), yoy: yearAgo ? pct(m.spend, yearAgo.spend) : null, asOf: m.date, trend: last26('spend') },
    employment: { value: m.emp, wow: pct(m.emp, mp.emp), m4: pct(m.emp, m4.emp), asOf: m.date, trend: last26('emp') },
    investment: { value: m.invest, wow: pct(m.invest, mp.invest), asOf: m.date },
    pmi: m.pmi, pmiTrend: last26('pmi'),
    sinceWar: {
      start: WAR_START,
      rows: [
        row('oil', 'Brent, $ a barrel', 'برنت، دولار للبرميل', 1),
        row('ports', 'Port calls a week', 'رسو السفن أسبوعياً', 0),
        row('gdp', 'GDP, annualised, $ trillion', 'الناتج المحلي السنوي، تريليون دولار', 2, undefined, annUsdT),
        row('spend', 'Consumer spending index', 'مؤشر الإنفاق الاستهلاكي', 1),
        row('pmi', 'PMI', 'مؤشر مديري المشتريات', 1),
        row('emp', 'Employment index', 'مؤشر التوظيف', 1),
        row('invest', 'Investment confidence', 'ثقة الاستثمار', 1),
        row('sent', 'Press sentiment', 'معنويات الصحافة', 2),
      ],
    },
    annual,
    source: `KSA platform, GDP nowcast (composite, not GASTAT) to ${t.date}`,
  };
}

/** The base picture before live overlays, statuses and the strategic layer. */
export function baseSnapshot(desk: Desk | null): Snapshot {
  const sh = shelves(), su = supply(desk), co = confidence(), ec = economy();
  const asOfDate = [sh.asOf, su.asOf, co.asOf].sort().at(-1)!;
  const asOf = `${asOfDate}T03:30:00Z`; // 06:30 Riyadh of the latest data date
  return {
    asOf, timezone: 'Asia/Riyadh', sample: false, shelves: sh, supply: su, confidence: co, economy: ec,
    overall: { status: 'normal', headline_en: '', headline_ar: '' },
    alerts: (desk?.alerts ?? []).map((a) => ({ ...a, fromDesk: true })),
    provenance: { platform: meta.platform, fetchedAt: meta.fetchedAt, latest: meta.latest as Record<string, string | number | undefined>, warStart: WAR_START },
  };
}

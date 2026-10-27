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
import type { AtRiskProduct, Category, Corridor, Desk, HormuzGrade, Point, Snapshot, WarRow } from './types';

interface MacroRow { date: string; oil: number; ir: number; sent: number; spend: number; tasi: number; ports: number | null; invest: number; emp: number; pmi: number; gdp: number | null; oilGdp: number | null; nonOilGdp: number | null }
interface Product { c: string; p: string; w: number; o: string; cat: string; rm: string; rk: string; rs: string; hz: string }
interface HormuzProduct {
  hs6: string; chapter: string; chapterName: string; name: string; name_ar: string | null; totalValue: number; hormuzValue: number; hormuzPct: number; mainSource: string;
  alternatives: { country: string; existingValue: number; route: { days: string; cost: string } | null; aiSuggested: boolean }[];
}
type CpiRow = Record<string, number | string>;

const macro = macroRaw as unknown as MacroRow[];
const cpi = cpiRaw as unknown as CpiRow[];
const products = productsRaw as unknown as Product[];
const hormuz = hormuzRaw as unknown as HormuzProduct[];
const ref = reference as unknown as {
  categories: Record<string, { en: string; ar: string; hormuz: HormuzGrade }>;
  country: { year: number; totalProducts: number; totalTradeValue: number; hormuzExposedValue: number; hormuzPct: number; criticalProducts: number };
  countryAr: Record<string, string>;
};
const sentDaily = sentimentDaily as { date: string; score: number }[];

export const WAR_START = (meta as { warStart?: string }).warStart ?? '2026-02-28';
const PRE_WAR_FROM = '2025-11-01';

const r1 = (n: number) => Math.round(n * 10) / 10;
/** "2-2 days" → "2", "11-16" → "11–16"; "$17-25/ton" → "$17–25/t" */
const tidyDays = (d?: string | null) => { if (!d) return null; const m = d.match(/(\d+)\s*-\s*(\d+)/); return m ? (m[1] === m[2] ? m[1] : `${m[1]}–${m[2]}`) : d.replace(/\s*days?/i, ''); };
const tidyCost = (c?: string | null) => (c ? c.replace('-', '–').replace('/ton', '/t') : null);
const r2 = (n: number) => Math.round(n * 100) / 100;
const pct = (now: number, then: number) => (then ? r1(((now - then) / then) * 100) : 0);
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const annUsdT = (sarMillionsPerWeek: number) => r2((sarMillionsPerWeek * 52) / 1e6 / 3.75);
const withKey = <K extends keyof MacroRow>(k: K) => macro.filter((r) => r[k] !== null && r[k] !== undefined);
const num = (v: number | string | undefined) => (typeof v === 'number' ? v : NaN);

const CAT_KEYS = Object.keys(ref.categories).filter((k) => k !== 'CPI' && k !== 'FoodOverall');

// ---- 01 · Shelves & prices ----------------------------------------------------------------------
function shelves(): Snapshot['shelves'] {
  const t = cpi[cpi.length - 1], n = cpi[cpi.length - 2], t4 = cpi[cpi.length - 5], t52 = cpi[cpi.length - 53];
  const pre = cpi.filter((r) => String(r.week) < WAR_START), post = cpi.filter((r) => String(r.week) >= WAR_START);
  const avg = (rows: CpiRow[], k: string) => mean(rows.map((r) => num(r[k])).filter(Number.isFinite));
  const categories: Category[] = CAT_KEYS.filter((k) => Number.isFinite(num(t[k]))).map((k) => ({
    key: k, label_en: ref.categories[k].en, label_ar: ref.categories[k].ar, value: num(t[k]), wow: pct(num(t[k]), num(n[k])),
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
    foodTrend: cpi.slice(-52).map((r) => ({ date: String(r.week), value: num(r.FoodOverall) })),
    stockouts: null,
    source: `KSA platform · FoodWatch weekly non-core CPI, ${products.length} products · to ${t.week}`,
  };
}

// ---- 02 · Supply & routes -------------------------------------------------------------------------
function supply(desk: Desk | null): Snapshot['supply'] {
  const c = ref.country;
  const food = hormuz.filter((p) => Number(p.chapter) <= 24).sort((a, b) => b.hormuzValue - a.hormuzValue);
  const foodTotal = food.reduce((a, p) => a + p.totalValue, 0), foodHz = food.reduce((a, p) => a + p.hormuzValue, 0);
  const bucket = (p: number) => (p >= 70 ? 'critical' : p >= 40 ? 'high' : p >= 10 ? 'moderate' : 'low');
  const buckets = { critical: 0, high: 0, moderate: 0, low: 0 };
  for (const p of hormuz) buckets[bucket(p.hormuzPct)]++;
  const ports = withKey('ports') as (MacroRow & { ports: number })[];
  const last = ports[ports.length - 1], prev = ports[ports.length - 2];
  const avg2025 = Math.round(mean(ports.filter((r) => r.date.startsWith('2025')).map((r) => r.ports)));
  const topAtRisk: AtRiskProduct[] = food.slice(0, 6).map((p) => {
    // the fastest Hormuz-free alternative among the platform's suggestions (ties → existing trade first)
    const days = (a: HormuzProduct['alternatives'][number]) => parseFloat((a.route?.days ?? '').split('-')[0]) || 999;
    const alt = [...p.alternatives].sort((a, b) => days(a) - days(b) || b.existingValue - a.existingValue)[0];
    return {
      hs6: p.hs6, product: p.name, product_ar: p.name_ar, chapter: p.chapterName, hormuzPct: p.hormuzPct, hormuzUsdM: Math.round(p.hormuzValue / 1e6), totalUsdM: Math.round(p.totalValue / 1e6),
      mainSource: p.mainSource, mainSource_ar: ref.countryAr[p.mainSource] ?? null,
      altSupplier: alt?.country ?? '—', altSupplier_ar: alt ? ref.countryAr[alt.country] ?? null : null, altDays: tidyDays(alt?.route?.days), altCost: tidyCost(alt?.route?.cost),
    };
  });
  const corridors: Corridor[] = [
    { name_en: 'Red Sea ports', name_ar: 'موانئ البحر الأحمر', via_en: 'Jeddah · Yanbu · King Abdullah — via Suez / Bab el-Mandeb, no Hormuz', via_ar: 'جدة · ينبع · الملك عبدالله — عبر السويس / باب المندب، دون هرمز', days: null, cost: null },
    { name_en: 'Jordan overland', name_ar: 'براً عبر الأردن', via_en: 'Aqaba → Durra border → Tabuk → Riyadh', via_ar: 'العقبة ← منفذ الدرة ← تبوك ← الرياض', days: '2–3', cost: '$25–46/t' },
    { name_en: 'Oman overland', name_ar: 'براً عبر عُمان', via_en: 'Salalah / Duqm → Ghuwaifat → Riyadh → Dammam', via_ar: 'صلالة / الدقم ← الغويفات ← الرياض ← الدمام', days: '2–3', cost: '$20–36/t' },
  ];
  const h = desk?.hormuz;
  return {
    status: 'normal', asOf: last.date,
    hormuz: h
      ? { state: h.state, since: h.since ?? null, note_en: h.note_en, note_ar: h.note_ar, setBy: 'desk' }
      : { state: 'restricted', since: WAR_START, setBy: 'default', note_en: 'Default since 28 Feb 2026 — the desk sets this each morning (data/desk.json).', note_ar: 'الوضع الافتراضي منذ 28 فبراير 2026 — يحدّده المكتب كل صباح.' },
    exposure: {
      comtradeYear: c.year, importsViaHormuzPct: c.hormuzPct, importsViaHormuzUsdB: r1(c.hormuzExposedValue / 1e9), importsTotalUsdB: r1(c.totalTradeValue / 1e9), criticalProducts: c.criticalProducts, productsCovered: c.totalProducts,
      foodViaHormuzPct: r1((foodHz / foodTotal) * 100), foodViaHormuzUsdB: r2(foodHz / 1e9), foodImportsUsdB: r1(foodTotal / 1e9), foodProductsCovered: food.length, buckets,
    },
    portCalls: { weekly: last.ports, wow: pct(last.ports, prev.ports), vs2025: pct(last.ports, avg2025), avg2025, asOf: last.date, trend: ports.slice(-52).map((r) => ({ date: r.date, value: r.ports })) },
    topAtRisk, corridors,
    source: `UN Comtrade ${c.year} via KSA platform (${c.totalProducts.toLocaleString('en-US')} products) · port calls to ${last.date}`,
  };
}

// ---- 03 · Confidence ---------------------------------------------------------------------------------
function confidence(): Snapshot['confidence'] {
  const t = macro[macro.length - 1], n = macro[macro.length - 2], t4 = macro[macro.length - 5];
  const pre = macro.filter((r) => r.date >= PRE_WAR_FROM && r.date < WAR_START);
  const preOil = r1(mean(pre.map((r) => r.oil)));
  const trend = (k: 'oil' | 'tasi'): Point[] => macro.slice(-52).map((r) => ({ date: r.date, value: r[k] }));
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
    source: `KSA platform · weekly indicators to ${t.date} · press sentiment daily`,
  };
}

// ---- 04 · The economy ----------------------------------------------------------------------------------
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
  return {
    status: 'normal', asOf: t.date,
    gdp: {
      totalUsdT: annUsdT(t.gdp), oilUsdT: annUsdT(t.oilGdp ?? 0), nonOilUsdT: annUsdT(t.nonOilGdp ?? 0), oilShare: r1(((t.oilGdp ?? 0) / t.gdp) * 100),
      momentum4w: pct(annUsdT(t.gdp), annUsdT(t4.gdp)), wow: pct(t.gdp, n.gdp),
      trend: g.slice(-52).map((r) => ({ date: r.date, value: annUsdT(r.gdp) })), nonOilTrend: g.slice(-52).map((r) => ({ date: r.date, value: annUsdT(r.nonOilGdp ?? 0) })),
    },
    spending: { value: m.spend, wow: pct(m.spend, mp.spend), m4: pct(m.spend, m4.spend), yoy: yearAgo ? pct(m.spend, yearAgo.spend) : null, asOf: m.date, trend: macro.slice(-52).map((r) => ({ date: r.date, value: r.spend })) },
    employment: { value: m.emp, wow: pct(m.emp, mp.emp), asOf: m.date },
    investment: { value: m.invest, wow: pct(m.invest, mp.invest), asOf: m.date },
    pmi: m.pmi,
    sinceWar: {
      start: WAR_START,
      rows: [
        row('oil', 'Brent, $/bbl', 'برنت، $/برميل', 1),
        row('pmi', 'PMI', 'مؤشر مديري المشتريات', 1),
        row('ports', 'Port calls / week', 'رسو السفن / أسبوع', 0),
        row('spend', 'Consumer spending idx', 'مؤشر الإنفاق الاستهلاكي', 1),
        row('gdp', 'GDP, annualised $T', 'الناتج المحلي السنوي، $T', 2, undefined, annUsdT),
        row('emp', 'Employment idx', 'مؤشر التوظيف', 1),
        row('invest', 'Investment confidence', 'ثقة الاستثمار', 1),
        row('sent', 'Press sentiment', 'معنويات الصحافة', 2),
      ],
    },
    annual,
    source: `KSA platform · GDP nowcast (composite, not GASTAT) to ${t.date}`,
  };
}

// ---- headline & alerts ------------------------------------------------------------------------------------
const f1 = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const sg = (n: number, d = 1) => `${n > 0 ? '+' : ''}${n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
const HZ = { open: { en: 'Hormuz open', ar: 'هرمز مفتوح' }, restricted: { en: 'Hormuz restricted', ar: 'هرمز مقيّد' }, closed: { en: 'Hormuz closed', ar: 'هرمز مغلق' } };

export function headline(s: Omit<Snapshot, 'overall' | 'alerts'>, lang: 'en' | 'ar'): string {
  const pc = s.supply.portCalls, fc = s.shelves.foodCpi, g = s.economy.gdp, br = s.confidence.brent;
  if (lang === 'ar') {
    return `${HZ[s.supply.hormuz.state].ar} — رسو السفن ${pc.weekly} أسبوعياً، ${pc.vs2025 <= 0 ? 'أدنى' : 'أعلى'} بـ${Math.abs(Math.round(pc.vs2025))}% من متوسط 2025. أسعار الغذاء ${sg(fc.m4 ?? 0)}% في أربعة أسابيع؛ برنت ${f1(br.value)} دولاراً (${sg(br.vsPreWar, 0)}% عن ما قبل الحرب)؛ الناتج المحلي ${g.totalUsdT.toFixed(2)} تريليون دولار سنوياً بزخم ${sg(g.momentum4w)}%.`;
  }
  return `${HZ[s.supply.hormuz.state].en} — port calls ${pc.weekly} a week, ${Math.abs(Math.round(pc.vs2025))}% ${pc.vs2025 <= 0 ? 'below' : 'above'} the 2025 average. Food prices ${sg(fc.m4 ?? 0)}% in four weeks; Brent $${f1(br.value)} (${sg(br.vsPreWar, 0)}% vs pre-war); GDP running at $${g.totalUsdT.toFixed(2)}T annualised, ${sg(g.momentum4w)}% four-week momentum.`;
}

export function derivedAlerts(s: Omit<Snapshot, 'overall' | 'alerts'>, time: string): Snapshot['alerts'] {
  const out: Snapshot['alerts'] = [];
  const pc = s.supply.portCalls, fc = s.shelves.foodCpi, fr = s.shelves.fastestRising[0], top = s.supply.topAtRisk[0], br = s.confidence.brent, g = s.economy.gdp, sp = s.economy.spending;
  out.push({
    level: pc.wow <= -30 ? 'critical' : pc.wow <= -15 || pc.vs2025 <= -50 ? 'alert' : 'info', time, panel: 'supply',
    text_en: `Port calls ${pc.weekly}/week (${sg(pc.wow)}% w/w), ${Math.abs(Math.round(pc.vs2025))}% below the 2025 average of ${pc.avg2025}/week.`,
    text_ar: `رسو السفن ${pc.weekly} أسبوعياً (${sg(pc.wow)}% أسبوعياً)، أدنى بـ${Math.abs(Math.round(pc.vs2025))}% من متوسط 2025 البالغ ${pc.avg2025} أسبوعياً.`,
  });
  if ((fc.m4 ?? 0) >= 3 || (fc.wow ?? 0) >= 1) out.push({
    level: (fc.m4 ?? 0) >= 10 || (fc.wow ?? 0) >= 2.5 ? 'alert' : 'watch', time, panel: 'shelves',
    text_en: `Food index ${f1(fc.value)}: ${sg(fc.wow ?? 0)}% w/w, ${sg(fc.m4 ?? 0)}% over four weeks${fc.yoy !== null && fc.yoy !== undefined ? `, ${sg(fc.yoy)}% y/y` : ''}.`,
    text_ar: `مؤشر الغذاء ${f1(fc.value)}: ${sg(fc.wow ?? 0)}% أسبوعياً، ${sg(fc.m4 ?? 0)}% في أربعة أسابيع${fc.yoy !== null && fc.yoy !== undefined ? `، ${sg(fc.yoy)}% سنوياً` : ''}.`,
  });
  if (fr && fr.wow >= 3) out.push({
    level: fr.wow >= 8 ? 'watch' : 'info', time, panel: 'shelves',
    text_en: `${fr.label_en} ${sg(fr.wow)}% w/w — the fastest-rising category (Hormuz exposure ${fr.hormuz.toLowerCase()}).`,
    text_ar: `${fr.label_ar} ${sg(fr.wow)}% أسبوعياً — الفئة الأسرع ارتفاعاً (تعرّض لهرمز: ${({ HIGH: 'مرتفع', MEDIUM: 'متوسط', LOW: 'منخفض', NONE: 'لا يوجد', INDEX: 'مؤشر' })[fr.hormuz]}).`,
  });
  if (br.vsPreWar >= 50) out.push({
    level: br.vsPreWar >= 100 ? 'alert' : 'watch', time, panel: 'confidence',
    text_en: `Brent $${f1(br.value)} (${sg(br.wow ?? 0)}% w/w) — ${sg(br.vsPreWar, 0)}% against the pre-war average of $${f1(br.preWar)}.`,
    text_ar: `برنت ${f1(br.value)} دولاراً (${sg(br.wow ?? 0)}% أسبوعياً) — ${sg(br.vsPreWar, 0)}% مقارنة بمتوسط ما قبل الحرب البالغ ${f1(br.preWar)} دولاراً.`,
  });
  if (top) out.push({
    level: 'info', time, panel: 'supply',
    text_en: `${top.product}: ${f1(top.hormuzPct)}% of $${(top.totalUsdM / 1000).toFixed(1)}B imports come through Hormuz (${top.mainSource}); fastest alternative ${top.altSupplier}${top.altDays ? `, ${top.altDays} days` : ''}.`,
    text_ar: `${top.product_ar ?? top.product}: ${f1(top.hormuzPct)}% من واردات بقيمة ${(top.totalUsdM / 1000).toFixed(1)} مليار دولار تمرّ عبر هرمز (${top.mainSource_ar ?? top.mainSource})؛ أسرع بديل ${top.altSupplier_ar ?? top.altSupplier}${top.altDays ? `، ${top.altDays} يوماً` : ''}.`,
  });
  out.push({
    level: g.momentum4w <= -3 || s.economy.pmi < 50 ? 'alert' : g.momentum4w < 0 ? 'watch' : 'info', time, panel: 'economy',
    text_en: `GDP nowcast $${g.totalUsdT.toFixed(2)}T annualised (non-oil $${g.nonOilUsdT.toFixed(2)}T), ${sg(g.momentum4w)}% four-week momentum; PMI ${f1(s.economy.pmi)}; consumer spending ${sg(sp.wow ?? 0)}% w/w, ${sg(sp.yoy ?? 0)}% y/y.`,
    text_ar: `الناتج المحلي ${g.totalUsdT.toFixed(2)} تريليون دولار سنوياً (غير النفطي ${g.nonOilUsdT.toFixed(2)})، زخم أربعة أسابيع ${sg(g.momentum4w)}%؛ مؤشر مديري المشتريات ${f1(s.economy.pmi)}؛ الإنفاق الاستهلاكي ${sg(sp.wow ?? 0)}% أسبوعياً، ${sg(sp.yoy ?? 0)}% سنوياً.`,
  });
  return out;
}

/** The base picture before live overlays and statuses. */
export function baseSnapshot(desk: Desk | null): Snapshot {
  const sh = shelves(), su = supply(desk), co = confidence(), ec = economy();
  const asOfDate = [sh.asOf, su.asOf, co.asOf].sort().at(-1)!;
  const asOf = `${asOfDate}T03:30:00Z`; // 06:30 Riyadh of the latest data date
  const core = {
    asOf, timezone: 'Asia/Riyadh', sample: false, shelves: sh, supply: su, confidence: co, economy: ec,
    provenance: { platform: meta.platform, fetchedAt: meta.fetchedAt, latest: meta.latest as Record<string, string | number | undefined>, warStart: WAR_START },
  };
  return {
    ...core,
    overall: { status: 'normal', headline_en: headline(core, 'en'), headline_ar: headline(core, 'ar') },
    alerts: [...(desk?.alerts ?? []), ...derivedAlerts(core, asOf)],
  };
}

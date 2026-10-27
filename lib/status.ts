import type { L, Lang, Pillar, Snapshot, Status } from './types';

/**
 * Thresholds that turn readings into a status. Deliberately simple and visible: a minister should be
 * able to ask "why is this amber?" and get a one-line answer, and "what would make it red?" and get another.
 * Tune with the ministry. Changes are percentages.
 */
export const RULES = {
  shelves: {
    foodWow: { watch: 1.0, alert: 2.5, critical: 5.0 },        // food index, week on week (rise)
    food4w: { watch: 5.0, alert: 10.0, critical: 20.0 },       // food index, over four weeks (rise)
  },
  supply: {
    portWow: { alert: -15, critical: -30 },                     // port calls, week on week (fall)
    portVs2025: { alert: -50, critical: -85 },                  // port calls against the 2025 weekly average (fall)
    // Hormuz (desk-set): restricted → at least watch, closed → critical
  },
  confidence: {
    sentiment: { watch: 0.0, alert: -0.3, critical: -0.6 },     // pooled daily press score, −1…+1 (fall)
    tasiWow: { alert: -5, critical: -10 },                      // TASI, week on week (fall)
    brentVsPreWar: { watch: 50, alert: 100 },                   // Brent against the pre-war average (rise)
  },
  economy: {
    momentum: { watch: 0, alert: -3, critical: -6 },            // GDP nowcast, four-week momentum (below)
    pmi: { alert: 50, critical: 47 },                           // below = contraction
    spendWow: { watch: -2, alert: -5 },                         // consumer spending, week on week (fall)
  },
};

export type Level = Exclude<Status, 'normal'>;
const ORDER: Status[] = ['normal', 'watch', 'alert', 'critical'];
const rank = (s: Status) => ORDER.indexOf(s);
export const worst = (...s: Status[]): Status => s.reduce((a, b) => (rank(b) > rank(a) ? b : a), 'normal');

/** One measurable condition behind a pillar's status, in natural units so it can be read out loud. */
export interface Condition {
  id: string; pillar: Pillar;
  value: number;
  dir: 'rise' | 'fall';                       // the direction that makes things worse
  strict?: boolean;                           // threshold must be passed, not met (PMI below 50, momentum below 0)
  levels: Partial<Record<Level, number>>;
  scale: number;                              // typical spread — makes distances comparable across conditions
  phrase: (t: number, lang: Lang) => string;  // "below 34 port calls a week"
  now: (v: number, lang: Lang) => string;     // "43"
  gap: (d: number, lang: Lang) => string;     // "9 away"
}

const f = (n: number, d = 1) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
export const signed = (n: number, d = 1) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${f(Math.abs(n), d)}`;
const pts = (d: number, lang: Lang) => (lang === 'ar' ? `الفارق ${f(d)} نقطة` : `${f(d)} points away`);

export function conditions(s: Snapshot): Condition[] {
  const R = RULES; const pc = s.supply.portCalls; const pre = s.confidence.brent.preWar;
  const portAt = (p: number) => Math.round(pc.avg2025 * (1 + p / 100));
  return [
    {
      id: 'portLevel', pillar: 'supply', value: pc.weekly, dir: 'fall', levels: { alert: portAt(R.supply.portVs2025.alert), critical: portAt(R.supply.portVs2025.critical) }, scale: pc.avg2025 * 0.35,
      phrase: (t, l) => (l === 'ar' ? `إذا هبط رسو السفن دون ${t} أسبوعياً` : `if port calls fall below ${t} a week`),
      now: (v, l) => (l === 'ar' ? `${v} أسبوعياً` : `${v} a week`), gap: (d, l) => (l === 'ar' ? `الفارق ${Math.round(d)}` : `${Math.round(d)} calls away`),
    },
    {
      id: 'portWow', pillar: 'supply', value: pc.wow, dir: 'fall', levels: R.supply.portWow, scale: 15,
      phrase: (t, l) => (l === 'ar' ? `إذا تراجع رسو السفن ${f(Math.abs(t), 0)}% خلال أسبوع` : `if port calls drop ${f(Math.abs(t), 0)}% in a week`),
      now: (v) => `${signed(v)}%`, gap: pts,
    },
    {
      id: 'foodWow', pillar: 'shelves', value: s.shelves.foodCpi.wow ?? 0, dir: 'rise', levels: R.shelves.foodWow, scale: 1.5,
      phrase: (t, l) => (l === 'ar' ? `إذا ارتفعت أسعار الغذاء ${f(t)}% خلال أسبوع` : `if food prices rise ${f(t)}% in a week`),
      now: (v) => `${signed(v)}%`, gap: pts,
    },
    {
      id: 'food4w', pillar: 'shelves', value: s.shelves.foodCpi.m4 ?? 0, dir: 'rise', levels: R.shelves.food4w, scale: 5,
      phrase: (t, l) => (l === 'ar' ? `إذا ارتفعت أسعار الغذاء ${f(t, 0)}% خلال أربعة أسابيع` : `if food prices rise ${f(t, 0)}% over four weeks`),
      now: (v) => `${signed(v)}%`, gap: pts,
    },
    {
      id: 'sentiment', pillar: 'confidence', value: s.confidence.sentiment.score, dir: 'fall', levels: R.confidence.sentiment, scale: 0.3,
      phrase: (t, l) => (l === 'ar' ? `إذا هبطت معنويات الصحافة إلى ${signed(t, 2)}` : `if press sentiment falls to ${signed(t, 2)}`),
      now: (v) => signed(v, 2), gap: (d, l) => (l === 'ar' ? `الفارق ${f(d, 2)}` : `${f(d, 2)} away`),
    },
    {
      id: 'tasiWow', pillar: 'confidence', value: s.confidence.tasi.wow ?? 0, dir: 'fall', levels: R.confidence.tasiWow, scale: 5,
      phrase: (t, l) => (l === 'ar' ? `إذا تراجع تاسي ${f(Math.abs(t), 0)}% خلال أسبوع` : `if TASI drops ${f(Math.abs(t), 0)}% in a week`),
      now: (v) => `${signed(v)}%`, gap: pts,
    },
    {
      id: 'brent', pillar: 'confidence', value: s.confidence.brent.value, dir: 'rise',
      levels: { watch: Math.round(pre * (1 + R.confidence.brentVsPreWar.watch / 100) * 10) / 10, alert: Math.round(pre * (1 + R.confidence.brentVsPreWar.alert / 100) * 10) / 10 }, scale: pre * 0.5,
      phrase: (t, l) => (l === 'ar' ? `إذا بلغ برنت ${f(t)} دولاراً` : `if Brent reaches $${f(t)}`),
      now: (v, l) => (l === 'ar' ? `${f(v)} دولاراً` : `$${f(v)}`), gap: (d, l) => (l === 'ar' ? `الفارق ${f(d)} دولار` : `$${f(d)} away`),
    },
    {
      id: 'momentum', pillar: 'economy', value: s.economy.gdp.momentum4w, dir: 'fall', strict: true, levels: R.economy.momentum, scale: 3,
      phrase: (t, l) => (t === 0 ? (l === 'ar' ? 'إذا تحوّل زخم النمو إلى سالب' : 'if growth momentum turns negative') : l === 'ar' ? `إذا هبط زخم النمو إلى ${signed(t)}%` : `if growth momentum falls to ${signed(t)}%`),
      now: (v) => `${signed(v)}%`, gap: pts,
    },
    {
      id: 'pmi', pillar: 'economy', value: s.economy.pmi, dir: 'fall', strict: true, levels: R.economy.pmi, scale: 3,
      phrase: (t, l) => (l === 'ar' ? `إذا هبط مؤشر مديري المشتريات دون ${t}` : `if PMI drops below ${t}`),
      now: (v) => f(v), gap: pts,
    },
    {
      id: 'spendWow', pillar: 'economy', value: s.economy.spending.wow ?? 0, dir: 'fall', levels: R.economy.spendWow, scale: 3,
      phrase: (t, l) => (l === 'ar' ? `إذا تراجع الإنفاق الاستهلاكي ${f(Math.abs(t), 0)}% خلال أسبوع` : `if consumer spending drops ${f(Math.abs(t), 0)}% in a week`),
      now: (v) => `${signed(v)}%`, gap: pts,
    },
  ];
}

const met = (c: Condition, t: number) => (c.dir === 'rise' ? (c.strict ? c.value > t : c.value >= t) : c.strict ? c.value < t : c.value <= t);

/** Highest level whose threshold the condition meets. */
export function levelOf(c: Condition): Status {
  let st: Status = 'normal';
  for (const lv of ['watch', 'alert', 'critical'] as Level[]) { const t = c.levels[lv]; if (t !== undefined && met(c, t)) st = lv; }
  return st;
}

/** The Hormuz state is a desk input, not a measurement. */
export const hormuzLevel = (s: Snapshot): Status => (s.supply.hormuz.state === 'closed' ? 'critical' : s.supply.hormuz.state === 'restricted' ? 'watch' : 'normal');

export function pillarStatus(s: Snapshot, pillar: Pillar, conds = conditions(s)): Status {
  const levels = conds.filter((c) => c.pillar === pillar).map(levelOf);
  if (pillar === 'supply') levels.push(hormuzLevel(s));
  return worst(...levels);
}

/** The nearest threshold that would raise the pillar's status, in words. */
export function nextThreshold(s: Snapshot, pillar: Pillar, status: Status, conds = conditions(s)): { level: Status; text: L; now: L } | null {
  const cands: { level: Level; c: Condition; t: number; dist: number }[] = [];
  for (const c of conds.filter((x) => x.pillar === pillar)) {
    for (const lv of ['watch', 'alert', 'critical'] as Level[]) {
      const t = c.levels[lv];
      if (t === undefined || rank(lv) <= rank(status) || met(c, t)) continue;
      cands.push({ level: lv, c, t, dist: Math.abs(t - c.value) / c.scale });
      break; // only the first level above the current status for this condition
    }
  }
  const first = cands.length ? Math.min(...cands.map((x) => rank(x.level))) : -1;
  const best = cands.filter((x) => rank(x.level) === first).sort((a, b) => a.dist - b.dist)[0];
  const lbl = (lv: Status) => STATUS_LABEL[lv];
  if (pillar === 'supply' && s.supply.hormuz.state !== 'closed' && rank(status) < rank('critical') && (!best || best.level === 'critical')) {
    // a desk call can always take supply to critical
    const extra = { en: ' or if Hormuz closes', ar: ' أو إذا أُغلق مضيق هرمز' };
    if (!best) return { level: 'critical', text: { en: `${lbl('critical').en} if Hormuz closes`, ar: `${lbl('critical').ar} إذا أُغلق مضيق هرمز` }, now: { en: `Hormuz ${s.supply.hormuz.state}`, ar: `هرمز ${s.supply.hormuz.state === 'open' ? 'مفتوح' : 'مقيّد'}` } };
    return {
      level: best.level,
      text: { en: `${lbl(best.level).en} ${best.c.phrase(best.t, 'en')}${extra.en}`, ar: `${lbl(best.level).ar} ${best.c.phrase(best.t, 'ar')}${extra.ar}` },
      now: { en: `Now ${best.c.now(best.c.value, 'en')}, ${best.c.gap(Math.abs(best.t - best.c.value), 'en')}`, ar: `الآن ${best.c.now(best.c.value, 'ar')}، ${best.c.gap(Math.abs(best.t - best.c.value), 'ar')}` },
    };
  }
  if (!best) return null;
  return {
    level: best.level,
    text: { en: `${lbl(best.level).en} ${best.c.phrase(best.t, 'en')}`, ar: `${lbl(best.level).ar} ${best.c.phrase(best.t, 'ar')}` },
    now: { en: `Now ${best.c.now(best.c.value, 'en')}, ${best.c.gap(Math.abs(best.t - best.c.value), 'en')}`, ar: `الآن ${best.c.now(best.c.value, 'ar')}، ${best.c.gap(Math.abs(best.t - best.c.value), 'ar')}` },
  };
}

export function applyStatuses(snap: Snapshot): Snapshot {
  const conds = conditions(snap);
  const shelves = { ...snap.shelves, status: pillarStatus(snap, 'shelves', conds) };
  const supply = { ...snap.supply, status: pillarStatus(snap, 'supply', conds) };
  const confidence = { ...snap.confidence, status: pillarStatus(snap, 'confidence', conds) };
  const economy = { ...snap.economy, status: pillarStatus(snap, 'economy', conds) };
  const overall = { ...snap.overall, status: worst(shelves.status, supply.status, confidence.status, economy.status) };
  return { ...snap, shelves, supply, confidence, economy, overall };
}

export const STATUS_LABEL: Record<Status, L> = {
  normal: { en: 'Normal', ar: 'طبيعي' },
  watch: { en: 'Watch', ar: 'مراقبة' },
  alert: { en: 'Alert', ar: 'تنبيه' },
  critical: { en: 'Critical', ar: 'حرج' },
};

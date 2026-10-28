import { conditions, levelOf, nextThreshold, worst, signed } from './status';
import { BAND_AR } from './sentiment';
import type { L, MonitorId, Pillar, Point, Priority, Snapshot, Status } from './types';

/**
 * The wall of the room: four monitors, each a window on the economy fed by the Kingdom platforms.
 * A monitor is a presentation of one or more status conditions (lib/status.ts); the pillars behind
 * the strategic layer stay as they are, so the alerts and the brief keep the same arithmetic.
 */
export interface Monitor {
  id: MonitorId;
  name: L;                 // the full name, on the monitor's own page
  wall: L;                 // on the wall, where four screens share a row
  short: L;                // in the rail and the tabs
  question: L;             // the question the minister asks this monitor
  pillar: Pillar;          // whose status it shows
  conditionIds: string[];  // which conditions it answers for (subset of the pillar's)
  portals: string[];       // config/modules.json ids it draws on
  href: string;
}

export const MONITORS: Monitor[] = [
  {
    id: 'gdp', name: { en: 'GDP', ar: 'الناتج المحلي' }, wall: { en: 'GDP', ar: 'الناتج المحلي' }, short: { en: 'GDP', ar: 'الناتج' },
    question: { en: 'Is output growing, and what is driving it?', ar: 'هل ينمو الناتج، وما الذي يدفعه؟' },
    pillar: 'economy', conditionIds: ['momentum', 'pmi'], portals: ['macro'], href: '/monitor/gdp',
  },
  {
    id: 'inflation', name: { en: 'Inflation and products intelligence', ar: 'التضخم وذكاء المنتجات' }, wall: { en: 'Inflation and products', ar: 'التضخم والمنتجات' }, short: { en: 'Inflation', ar: 'التضخم' },
    question: { en: 'Are prices holding, and which products are at risk?', ar: 'هل الأسعار مستقرة، وأي المنتجات في خطر؟' },
    pillar: 'shelves', conditionIds: ['foodWow', 'food4w'], portals: ['foodwatch', 'shipping'], href: '/monitor/inflation',
  },
  {
    id: 'spending', name: { en: 'Consumer spending', ar: 'الإنفاق الاستهلاكي' }, wall: { en: 'Consumer spending', ar: 'الإنفاق الاستهلاكي' }, short: { en: 'Spending', ar: 'الإنفاق' },
    question: { en: 'Are households still spending?', ar: 'هل ما زالت الأسر تنفق؟' },
    pillar: 'economy', conditionIds: ['spendWow'], portals: ['macro'], href: '/monitor/spending',
  },
  {
    id: 'sentiment', name: { en: 'Economic sentiment', ar: 'المعنويات الاقتصادية' }, wall: { en: 'Economic sentiment', ar: 'المعنويات الاقتصادية' }, short: { en: 'Sentiment', ar: 'المعنويات' },
    question: { en: 'How do the press and the markets read the moment?', ar: 'كيف تقرأ الصحافة والأسواق اللحظة؟' },
    pillar: 'confidence', conditionIds: ['sentiment', 'tasiWow', 'brent'], portals: ['macro', 'stocks'], href: '/monitor/sentiment',
  },
];

export const monitor = (id: MonitorId) => MONITORS.find((m) => m.id === id)!;

/** The signals, by condition id, as they are labelled on the gauges. */
export const SIGNAL_NAME: Record<string, L> = {
  portLevel: { en: 'Port calls a week', ar: 'رسو السفن أسبوعياً' },
  portWow: { en: 'Port calls, week on week', ar: 'رسو السفن، أسبوعياً' },
  foodWow: { en: 'Food prices, week on week', ar: 'أسعار الغذاء، أسبوعياً' },
  food4w: { en: 'Food prices, four weeks', ar: 'أسعار الغذاء، أربعة أسابيع' },
  sentiment: { en: 'Press sentiment', ar: 'معنويات الصحافة' },
  tasiWow: { en: 'TASI, week on week', ar: 'تاسي، أسبوعياً' },
  brent: { en: 'Brent against pre-war', ar: 'برنت مقابل ما قبل الحرب' },
  momentum: { en: 'GDP momentum, four weeks', ar: 'زخم الناتج، أربعة أسابيع' },
  pmi: { en: 'PMI', ar: 'مؤشر مديري المشتريات' },
  spendWow: { en: 'Consumer spending, week on week', ar: 'الإنفاق الاستهلاكي، أسبوعياً' },
};

/** The conditions a monitor shows, in the order they are listed. */
export function monitorConditions(s: Snapshot, id: MonitorId, conds = conditions(s)) {
  const m = monitor(id);
  return m.conditionIds.map((cid) => conds.find((c) => c.id === cid)!).filter(Boolean);
}

/** A monitor's status is the worst level among the conditions it shows. Supply's desk input is not part of any monitor; it lives in the alerts. */
export function monitorStatus(s: Snapshot, id: MonitorId, conds = conditions(s)): Status {
  const m = monitor(id);
  return worst(...conds.filter((c) => m.conditionIds.includes(c.id)).map(levelOf));
}

/** What would change this monitor's status: the pillar's nearest threshold, read out in natural units. */
export function monitorNext(s: Snapshot, id: MonitorId) {
  const m = monitor(id);
  const status = monitorStatus(s, id);
  const conds = conditions(s).filter((c) => m.conditionIds.includes(c.id));
  return nextThreshold(s, m.pillar, status, conds);
}

const f = (n: number, d = 1) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

/** The reading on the face of each monitor: one number, its unit, two supporting lines and a sparkline. */
export interface Face { value: string; unit: L; lines: L[]; trend: Point[]; zero?: boolean }

export function face(s: Snapshot, id: MonitorId): Face {
  const { shelves: sh, confidence: co, economy: ec, supply: su } = s;
  switch (id) {
    case 'gdp':
      return {
        value: `$${f(ec.gdp.totalUsdT, 2)}T`, unit: { en: 'a year, nowcast', ar: 'سنوياً، تقدير آني' },
        lines: [
          { en: `${signed(ec.gdp.momentum4w)}% over four weeks`, ar: `${signed(ec.gdp.momentum4w)}% خلال أربعة أسابيع` },
          { en: `Non-oil $${f(ec.gdp.nonOilUsdT, 2)}T, PMI ${f(ec.pmi)}`, ar: `غير النفطي ${f(ec.gdp.nonOilUsdT, 2)} تريليون دولار، مديرو المشتريات ${f(ec.pmi)}` },
        ],
        trend: ec.gdp.series.slice(-26).map((p) => ({ date: p.date, value: p.total })),
      };
    case 'inflation':
      return {
        value: f(sh.foodCpi.value), unit: { en: 'food index, base 100', ar: 'مؤشر الغذاء، الأساس 100' },
        lines: [
          { en: `${signed(sh.foodCpi.m4 ?? 0)}% in four weeks, ${signed(sh.foodCpi.yoy ?? 0)}% on a year ago`, ar: `${signed(sh.foodCpi.m4 ?? 0)}% خلال أربعة أسابيع، ${signed(sh.foodCpi.yoy ?? 0)}% سنوياً` },
          { en: `CPI ${f(sh.cpiOverall.value)}; ${su.exposure.criticalProducts.toLocaleString('en-US')} products critical on Hormuz`, ar: `المؤشر العام ${f(sh.cpiOverall.value)}؛ ${su.exposure.criticalProducts.toLocaleString('en-US')} منتجاً حرجاً عبر هرمز` },
        ],
        trend: sh.series.slice(-26).map((p) => ({ date: p.date, value: p.food })),
      };
    case 'spending':
      return {
        value: f(ec.spending.value), unit: { en: 'spending index', ar: 'مؤشر الإنفاق' },
        lines: [
          { en: `${signed(ec.spending.wow ?? 0)}% on the week, ${signed(ec.spending.yoy ?? 0)}% on a year ago`, ar: `${signed(ec.spending.wow ?? 0)}% أسبوعياً، ${signed(ec.spending.yoy ?? 0)}% سنوياً` },
          { en: `Employment ${f(ec.employment.value)} (${signed(ec.employment.wow ?? 0)}% on the week)`, ar: `التوظيف ${f(ec.employment.value)} (${signed(ec.employment.wow ?? 0)}% أسبوعياً)` },
        ],
        trend: ec.spending.trend,
      };
    case 'sentiment': {
      const band = { en: co.sentiment.band, ar: BAND_AR[co.sentiment.band] ?? co.sentiment.band };
      return {
        value: signed(co.sentiment.score, 2), unit: { en: `press sentiment, ${band.en}${co.sentiment.live ? ', live' : ''}`, ar: `معنويات الصحافة، ${band.ar}${co.sentiment.live ? '، مباشر' : ''}` },
        lines: [
          { en: `TASI ${co.tasi.value.toLocaleString('en-US')} (${signed(co.tasi.m4 ?? 0)}% over four weeks)`, ar: `تاسي ${co.tasi.value.toLocaleString('en-US')} (${signed(co.tasi.m4 ?? 0)}% خلال أربعة أسابيع)` },
          { en: `Brent $${f(co.brent.value)}, ${signed(co.brent.vsPreWar, 0)}% on pre-war; investment confidence ${f(co.investment.value)}`, ar: `برنت ${f(co.brent.value)} دولاراً، ${signed(co.brent.vsPreWar, 0)}% عن ما قبل الحرب؛ ثقة الاستثمار ${f(co.investment.value)}` },
        ],
        trend: co.sentiment.trend.map((p) => ({ date: p.date, value: p.score })), zero: true,
      };
    }
  }
}

/** Alert counts for badges. */
export function alertCounts(s: Snapshot): Record<Priority, number> & { total: number } {
  const d = s.strategy?.decisions ?? [];
  const n = (p: Priority) => d.filter((x) => x.priority === p).length;
  return { act: n('act'), prepare: n('prepare'), monitor: n('monitor'), total: d.length };
}

/** Which monitor a pillar's alert points to. */
export const PILLAR_MONITOR: Record<Pillar, MonitorId> = { supply: 'inflation', shelves: 'inflation', confidence: 'sentiment', economy: 'gdp' };

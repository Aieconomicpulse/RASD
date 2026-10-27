import { isoNums } from './i18n';
import { BAND_AR } from './sentiment';
import { PILLAR_NAME } from './strategy';
import type { Lang, Pillar, Priority, Snapshot, Status } from './types';

export interface BriefDoc {
  bottomLine: string;
  judgments: string[];
  decisions: { priority: Priority; title: string; body: string }[];
  watch: { pillar: string; status: Status; level: Status; text: string; now: string }[];
  pillars: { key: Pillar; name: string; status: Status; text: string }[];
  generated: boolean;
}

const f = (n: number | null | undefined, d = 1) => (typeof n === 'number' && Number.isFinite(n) ? n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—');
const sg = (n: number | null | undefined, d = 1) => (typeof n === 'number' && Number.isFinite(n) ? `${n > 0 ? '+' : n < 0 ? '−' : ''}${f(Math.abs(n), d)}` : '—');
const dEn = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });
const dAr = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('ar-SA-u-nu-latn-ca-gregory', { day: 'numeric', month: 'long', timeZone: 'UTC' });
const HZ = { open: { en: 'open', ar: 'مفتوح' }, restricted: { en: 'restricted', ar: 'مقيّد' }, closed: { en: 'closed', ar: 'مغلق' } };

function pillarText(s: Snapshot, p: Pillar, lang: Lang): string {
  const { supply: su, shelves: sh, confidence: co, economy: ec } = s;
  const ex = su.exposure, pc = su.portCalls, of2025 = Math.round((pc.weekly / pc.avg2025) * 100);
  const top = su.topAtRisk.slice(0, 3);
  const ar = lang === 'ar';
  if (p === 'supply') {
    const since = su.hormuz.since ? (ar ? ` منذ ${dAr(su.hormuz.since)}` : ` since ${dEn(su.hormuz.since)}`) : '';
    return ar
      ? `مضيق هرمز ${HZ[su.hormuz.state].ar}${since}. نحو ${f(ex.importsViaHormuzPct)}% من واردات المملكة (${f(ex.importsViaHormuzUsdB, 0)} من ${f(ex.importsTotalUsdB, 0)} مليار دولار سنوياً، كومتريد ${ex.comtradeYear}) تمرّ عبره، ومنها ${ex.criticalProducts.toLocaleString('en-US')} منتجاً حرجاً؛ وتبلغ الحصة في الغذاء ${f(ex.foodViaHormuzPct)}%. رسو السفن ${pc.weekly} أسبوعياً (${sg(pc.wow)}% أسبوعياً)، أي ${of2025}% من متوسط 2025. أكثر السلع الغذائية تعرضاً: ${top.map((x) => `${(x.product_ar ?? x.product).replace(/\s*\(.*?\)/g, '')} (${f(x.hormuzPct, 0)}%، ${x.hormuzUsdM >= 1000 ? `${f(x.hormuzUsdM / 1000, 1)} مليار دولار` : `${f(x.hormuzUsdM, 0)} مليون دولار`})`).join('، ')}.`
      : `Hormuz is ${HZ[su.hormuz.state].en}${since}. ${f(ex.importsViaHormuzPct)}% of the Kingdom's imports ($${f(ex.importsViaHormuzUsdB, 0)}B of $${f(ex.importsTotalUsdB, 0)}B a year, UN Comtrade ${ex.comtradeYear}) pass the strait, including ${ex.criticalProducts.toLocaleString('en-US')} critical products; for food the share is ${f(ex.foodViaHormuzPct)}%. Port calls are ${pc.weekly} a week (${sg(pc.wow)}% on the week), ${of2025}% of the 2025 average. The most exposed food lines are ${top.map((x) => `${x.product.replace(/\s*\(.*?\)/g, '').toLowerCase()} (${f(x.hormuzPct, 0)}%, ${x.hormuzUsdM >= 1000 ? `$${f(x.hormuzUsdM / 1000, 1)}B` : `$${f(x.hormuzUsdM, 0)}M`})`).join(', ')}.`;
  }
  if (p === 'shelves') {
    const lead = sh.fastestRising[0], w = sh.sinceWar.worst;
    return ar
      ? `مؤشر الغذاء ${f(sh.foodCpi.value)} (${sg(sh.foodCpi.wow)}% أسبوعياً، ${sg(sh.foodCpi.m4)}% خلال أربعة أسابيع، ${sg(sh.foodCpi.yoy)}% سنوياً)، والمؤشر العام ${f(sh.cpiOverall.value)} (${sg(sh.cpiOverall.wow)}% أسبوعياً). ${lead ? `الأسرع ارتفاعاً هذا الأسبوع ${lead.label_ar} (${sg(lead.wow)}%)؛ ` : ''}وأعلى الفئات مستوى ${sh.highest.label_ar} عند ${f(sh.highest.value)}. منذ 28 فبراير بلغ متوسط مؤشر الغذاء ${f(sh.sinceWar.foodPost)} مقابل ${f(sh.sinceWar.foodPre)} قبله${w ? `؛ وكانت ${w.label_ar} الأكثر ارتفاعاً (${sg(w.sinceWar)} نقطة)` : ''}.`
      : `The food index is ${f(sh.foodCpi.value)} (${sg(sh.foodCpi.wow)}% on the week, ${sg(sh.foodCpi.m4)}% over four weeks, ${sg(sh.foodCpi.yoy)}% on a year ago); overall CPI is ${f(sh.cpiOverall.value)} (${sg(sh.cpiOverall.wow)}% on the week). ${lead ? `${lead.label_en} rose fastest this week (${sg(lead.wow)}%); ` : ''}${sh.highest.label_en} is the highest category at ${f(sh.highest.value)}. Since 28 February the food index has averaged ${f(sh.sinceWar.foodPost)} against ${f(sh.sinceWar.foodPre)} before${w ? `; ${w.key === 'FoodProductsNEC' ? 'other food products' : w.label_en.toLowerCase().replace(/ & /g, ' and ')} rose most (${sg(w.sinceWar)} points)` : ''}.`;
  }
  if (p === 'confidence') {
    const sent = co.sentiment;
    return ar
      ? `برنت ${f(co.brent.value)} دولاراً (${sg(co.brent.wow)}% أسبوعياً، ${sg(co.brent.vsPreWar, 0)}% عن متوسط ما قبل الحرب البالغ ${f(co.brent.preWar)} دولاراً). تاسي عند ${co.tasi.value.toLocaleString('en-US')} (${sg(co.tasi.wow)}% أسبوعياً، ${sg(co.tasi.m4)}% خلال أربعة أسابيع)، وسعر إعادة الشراء لدى ساما ${f(co.samaRate, 2)}%. معنويات الصحافة ${sg(sent.score, 2)} (${BAND_AR[sent.band] ?? sent.band}) بتاريخ ${dAr(sent.date)}${sent.headlineCount ? ` عبر ${sent.headlineCount} عنواناً` : ''}.`
      : `Brent is $${f(co.brent.value)} (${sg(co.brent.wow)}% on the week, ${sg(co.brent.vsPreWar, 0)}% on the pre-war average of $${f(co.brent.preWar)}). TASI stands at ${co.tasi.value.toLocaleString('en-US')} (${sg(co.tasi.wow)}% on the week, ${sg(co.tasi.m4)}% over four weeks) and the SAMA repo rate is ${f(co.samaRate, 2)}%. Press sentiment is ${sg(sent.score, 2)} (${sent.band}) on ${dEn(sent.date)}${sent.headlineCount ? ` across ${sent.headlineCount} headlines` : ''}.`;
  }
  return ar
    ? `يسير تقدير الناتج الآني بمعدل ${f(ec.gdp.totalUsdT, 2)} تريليون دولار سنوياً (النفطي ${f(ec.gdp.oilUsdT, 2)}، غير النفطي ${f(ec.gdp.nonOilUsdT, 2)})، ${sg(ec.gdp.momentum4w)}% خلال أربعة أسابيع. الإنفاق الاستهلاكي ${f(ec.spending.value)} (${sg(ec.spending.wow)}% أسبوعياً، ${sg(ec.spending.yoy)}% سنوياً)، والتوظيف ${f(ec.employment.value)}، ومؤشر مديري المشتريات ${f(ec.pmi)}، وثقة الاستثمار ${f(s.confidence.investment.value)}.`
    : `The GDP nowcast runs at $${f(ec.gdp.totalUsdT, 2)} trillion a year (oil $${f(ec.gdp.oilUsdT, 2)}T, non-oil $${f(ec.gdp.nonOilUsdT, 2)}T), ${sg(ec.gdp.momentum4w)}% over four weeks. Consumer spending is ${f(ec.spending.value)} (${sg(ec.spending.wow)}% on the week, ${sg(ec.spending.yoy)}% on a year ago); employment ${f(ec.employment.value)}; PMI ${f(ec.pmi)}; investment confidence ${f(s.confidence.investment.value)}.`;
}

/** The brief, composed from the picture itself — no model needed, never invents a number. */
export function templateBrief(s: Snapshot, lang: Lang): BriefDoc {
  const st = s.strategy!;
  const order: Pillar[] = ['supply', 'shelves', 'confidence', 'economy'];
  const status = (p: Pillar): Status => (p === 'supply' ? s.supply.status : p === 'shelves' ? s.shelves.status : p === 'confidence' ? s.confidence.status : s.economy.status);
  return {
    bottomLine: `${st.headline[lang]} ${st.standfirst[lang]}`,
    judgments: st.judgments.map((j) => j[lang]),
    decisions: st.decisions.map((d) => ({ priority: d.priority, title: d.title[lang], body: d.body[lang] })),
    watch: st.scorecard.filter((r) => r.next).map((r) => ({ pillar: r.name[lang], status: r.status, level: r.next!.level, text: r.next!.text[lang], now: r.next!.now[lang] })),
    pillars: order.map((p) => ({ key: p, name: PILLAR_NAME[p][lang], status: status(p), text: lang === 'ar' ? isoNums(pillarText(s, p, lang)) : pillarText(s, p, lang) })),
    generated: false,
  };
}

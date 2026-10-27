import { BAND_AR } from './sentiment';
import { STATUS_LABEL } from './status';
import type { Lang, Snapshot } from './types';

const fmt = (n: number | null | undefined, d = 1) => (typeof n === 'number' && Number.isFinite(n) ? n.toFixed(d) : '—');
const sign = (n: number | null | undefined, d = 1) => (typeof n === 'number' && n > 0 ? `+${fmt(n, d)}` : fmt(n, d));
const HZ = { open: { en: 'OPEN', ar: 'مفتوح' }, restricted: { en: 'RESTRICTED', ar: 'مقيّد' }, closed: { en: 'CLOSED', ar: 'مغلق' } };

/**
 * Deterministic brief from the picture itself — no model needed, never invents a number.
 * The model-written version (lib/brief-ai.ts) is used when ANTHROPIC_API_KEY is set, with this as fallback.
 */
export function templateBrief(s: Snapshot, lang: Lang): string[] {
  const L = STATUS_LABEL;
  const { shelves: sh, supply: su, confidence: co, economy: ec } = s;
  const top = su.topAtRisk.slice(0, 3);
  if (lang === 'ar') {
    return [
      `التقييم العام: ${L[s.overall.status].ar}. ${s.overall.headline_ar}`,
      `الأرفف والأسعار (${L[sh.status].ar}): مؤشر أسعار الغذاء ${fmt(sh.foodCpi.value)} (${sign(sh.foodCpi.wow)}% أسبوعياً، ${sign(sh.foodCpi.m4)}% في أربعة أسابيع، ${sign(sh.foodCpi.yoy)}% سنوياً)، المؤشر العام ${fmt(sh.cpiOverall.value)} (${sign(sh.cpiOverall.wow)}% أسبوعياً). الأسرع ارتفاعاً: ${sh.fastestRising.slice(0, 3).map((f) => `${f.label_ar} ${sign(f.wow)}%`).join('، ')}. الأعلى مستوى: ${sh.highest.label_ar} عند ${fmt(sh.highest.value)}. منذ 28 فبراير، متوسط مؤشر الغذاء ${fmt(sh.sinceWar.foodPre)} ← ${fmt(sh.sinceWar.foodPost)}${sh.sinceWar.worst ? `؛ الأكثر تضرراً ${sh.sinceWar.worst.label_ar} (${sign(sh.sinceWar.worst.sinceWar)} نقطة)` : ''}. من السلة المتابَعة (${sh.productsTracked} منتجاً)، ${sh.basket.directProducts} منتجات تُشحن مباشرة عبر هرمز (${fmt(sh.basket.directWeightPct)}% من الوزن).`,
      `الإمداد والمسارات (${L[su.status].ar}): هرمز ${HZ[su.hormuz.state].ar}. ${fmt(su.exposure.importsViaHormuzPct)}% من واردات المملكة (${fmt(su.exposure.importsViaHormuzUsdB, 0)} من ${fmt(su.exposure.importsTotalUsdB, 0)} مليار دولار، كومتريد ${su.exposure.comtradeYear}) تمرّ عبر المضيق، و${su.exposure.criticalProducts.toLocaleString('en-US')} منتجاً حرجاً؛ واردات الغذاء ${fmt(su.exposure.foodViaHormuzPct)}%. رسو السفن ${su.portCalls.weekly} أسبوعياً (${sign(su.portCalls.wow)}% أسبوعياً، ${sign(su.portCalls.vs2025)}% مقابل متوسط 2025). الأكثر تعرضاً: ${top.map((p) => `${p.product_ar ?? p.product} ${fmt(p.hormuzPct, 0)}% عبر هرمز، أسرع بديل ${p.altSupplier_ar ?? p.altSupplier}${p.altDays ? ` (${p.altDays} يوماً)` : ''}`).join('؛ ')}.`,
      `الثقة (${L[co.status].ar}): برنت ${fmt(co.brent.value)} دولاراً (${sign(co.brent.wow)}% أسبوعياً، ${sign(co.brent.vsPreWar, 0)}% عن متوسط ما قبل الحرب ${fmt(co.brent.preWar)})، تاسي ${fmt(co.tasi.value, 0)} (${sign(co.tasi.wow)}% أسبوعياً)، سعر ساما ${fmt(co.samaRate, 2)}%، مؤشر مديري المشتريات ${fmt(co.pmi)}، ثقة الاستثمار ${fmt(co.investment.value)}. معنويات الصحافة ${sign(co.sentiment.score, 2)} (${BAND_AR[co.sentiment.band] ?? co.sentiment.band}${co.sentiment.headlineCount ? `، ${co.sentiment.headlineCount} عنواناً` : ''}، ${co.sentiment.date}).`,
      `الاقتصاد (${L[ec.status].ar}): الناتج المحلي ${fmt(ec.gdp.totalUsdT, 2)} تريليون دولار سنوياً (النفطي ${fmt(ec.gdp.oilUsdT, 2)}، غير النفطي ${fmt(ec.gdp.nonOilUsdT, 2)})، زخم أربعة أسابيع ${sign(ec.gdp.momentum4w)}%. الإنفاق الاستهلاكي ${fmt(ec.spending.value)} (${sign(ec.spending.wow)}% أسبوعياً، ${sign(ec.spending.yoy)}% سنوياً)، التوظيف ${fmt(ec.employment.value)}. منذ الحرب: ${ec.sinceWar.rows.slice(0, 4).map((r) => `${r.label_ar} ${fmt(r.pre, r.digits)} ← ${fmt(r.post, r.digits)}`).join('؛ ')}.`,
      s.alerts.length ? `ما يستحق الانتباه اليوم: ${s.alerts.filter((a) => a.level !== 'info').map((a) => a.text_ar).join(' ') || s.alerts[0].text_ar}` : 'لا تنبيهات جديدة.',
    ];
  }
  return [
    `Overall: ${L[s.overall.status].en}. ${s.overall.headline_en}`,
    `Shelves & prices (${L[sh.status].en}): food index ${fmt(sh.foodCpi.value)} (${sign(sh.foodCpi.wow)}% w/w, ${sign(sh.foodCpi.m4)}% over four weeks, ${sign(sh.foodCpi.yoy)}% y/y), overall CPI ${fmt(sh.cpiOverall.value)} (${sign(sh.cpiOverall.wow)}% w/w). Fastest rising: ${sh.fastestRising.slice(0, 3).map((f) => `${f.label_en} ${sign(f.wow)}%`).join(', ')}. Highest level: ${sh.highest.label_en} at ${fmt(sh.highest.value)}. Since 28 February the food index has averaged ${fmt(sh.sinceWar.foodPost)} against ${fmt(sh.sinceWar.foodPre)} before${sh.sinceWar.worst ? `; hardest hit ${sh.sinceWar.worst.label_en} (${sign(sh.sinceWar.worst.sinceWar)} pts)` : ''}. Of the ${sh.productsTracked} tracked products, ${sh.basket.directProducts} ship direct through Hormuz (${fmt(sh.basket.directWeightPct)}% of basket weight).`,
    `Supply & routes (${L[su.status].en}): Hormuz ${HZ[su.hormuz.state].en}. ${fmt(su.exposure.importsViaHormuzPct)}% of the Kingdom's imports ($${fmt(su.exposure.importsViaHormuzUsdB, 0)}B of $${fmt(su.exposure.importsTotalUsdB, 0)}B, Comtrade ${su.exposure.comtradeYear}) come through the strait, with ${su.exposure.criticalProducts.toLocaleString('en-US')} critical products; food imports ${fmt(su.exposure.foodViaHormuzPct)}%. Port calls ${su.portCalls.weekly}/week (${sign(su.portCalls.wow)}% w/w, ${sign(su.portCalls.vs2025)}% against the 2025 average). Most exposed: ${top.map((p) => `${p.product} ${fmt(p.hormuzPct, 0)}% via Hormuz, fastest alternative ${p.altSupplier}${p.altDays ? ` (${p.altDays} days)` : ''}`).join('; ')}.`,
    `Confidence (${L[co.status].en}): Brent $${fmt(co.brent.value)} (${sign(co.brent.wow)}% w/w, ${sign(co.brent.vsPreWar, 0)}% against the pre-war average of $${fmt(co.brent.preWar)}), TASI ${fmt(co.tasi.value, 0)} (${sign(co.tasi.wow)}% w/w), SAMA rate ${fmt(co.samaRate, 2)}%, PMI ${fmt(co.pmi)}, investment confidence ${fmt(co.investment.value)}. Press sentiment ${sign(co.sentiment.score, 2)} (${co.sentiment.band}${co.sentiment.headlineCount ? `, ${co.sentiment.headlineCount} headlines` : ''}, ${co.sentiment.date}).`,
    `The economy (${L[ec.status].en}): GDP nowcast $${fmt(ec.gdp.totalUsdT, 2)}T annualised (oil $${fmt(ec.gdp.oilUsdT, 2)}T, non-oil $${fmt(ec.gdp.nonOilUsdT, 2)}T), ${sign(ec.gdp.momentum4w)}% four-week momentum. Consumer spending ${fmt(ec.spending.value)} (${sign(ec.spending.wow)}% w/w, ${sign(ec.spending.yoy)}% y/y), employment ${fmt(ec.employment.value)}. Since the war: ${ec.sinceWar.rows.slice(0, 4).map((r) => `${r.label_en} ${fmt(r.pre, r.digits)} → ${fmt(r.post, r.digits)}`).join('; ')}.`,
    s.alerts.length ? `What to watch today: ${s.alerts.filter((a) => a.level !== 'info').map((a) => a.text_en).join(' ') || s.alerts[0].text_en}` : 'No new alerts.',
  ];
}

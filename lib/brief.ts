import { STATUS_LABEL } from './status';
import type { Lang, Snapshot } from './types';

const fmt = (n: number, d = 1) => (Number.isFinite(n) ? n.toFixed(d) : '—');
const sign = (n: number, d = 1) => (n > 0 ? `+${fmt(n, d)}` : fmt(n, d));

/**
 * Deterministic brief from the picture itself — no model needed, never hallucinates a number.
 * The model-written version (lib/brief-ai.ts) is used when ANTHROPIC_API_KEY is set, with this as fallback.
 */
export function templateBrief(s: Snapshot, lang: Lang): string[] {
  const L = STATUS_LABEL;
  const ovr = L[s.overall.status][lang];
  if (lang === 'ar') {
    return [
      `التقييم العام: ${ovr}. ${s.overall.headline_ar}`,
      `الأرفف والأسعار (${L[s.shelves.status].ar}): مؤشر أسعار الغذاء ${fmt(s.shelves.foodCpi.value)} (${sign(s.shelves.foodCpi.wow ?? 0)}% أسبوعياً)، المؤشر العام ${fmt(s.shelves.cpiOverall.value)}. الأسرع ارتفاعاً: ${s.shelves.fastestRising.map((f) => `${f.category_ar ?? f.category} ${sign(f.wow)}%`).join('، ')}. حالات نفاد المخزون: ${s.shelves.stockouts.count}.`,
      `الإمداد والمسارات (${L[s.supply.status].ar}): هرمز ${(lang === 'ar' ? { open: 'مفتوح', restricted: 'مقيّد', closed: 'مغلق' } : {})[s.supply.hormuz.state] ?? s.supply.hormuz.state}؛ ${fmt(s.supply.exposure.importsViaHormuzPct, 0)}% من الواردات عبر هرمز و${fmt(s.supply.exposure.cpiWeightAtRisk)}% من وزن سلة المؤشر. رسو السفن ${s.supply.portCalls.weekly} أسبوعياً (${sign(s.supply.portCalls.wow)}%). أيام الإمداد: موانئ الخليج ${s.supply.inbound.daysOfSupplyGulfPorts}، البحر الأحمر ${s.supply.inbound.daysOfSupplyRedSeaPorts}. الأكثر تعرضاً: ${s.supply.topAtRisk.slice(0, 3).map((p) => `${p.product_ar ?? p.product} (${p.hormuzPct}%)`).join('، ')}.`,
      `الثقة (${L[s.confidence.status].ar}): برنت ${fmt(s.confidence.brent.value)} دولاراً (${sign(s.confidence.brent.d1 ?? 0)}%)، تاسي ${fmt(s.confidence.tasi.value, 0)} (${sign(s.confidence.tasi.d1 ?? 0)}%)، معنويات الصحافة ${sign(s.confidence.sentiment.score, 2)} (${s.confidence.sentiment.headlineCount} عنواناً، ${s.confidence.sentiment.date}).`,
      s.alerts.length ? `التنبيهات: ${s.alerts.map((a) => a.text_ar).join(' ')}` : 'لا تنبيهات جديدة.',
    ];
  }
  return [
    `Overall: ${ovr}. ${s.overall.headline_en}`,
    `Shelves & prices (${L[s.shelves.status].en}): food CPI ${fmt(s.shelves.foodCpi.value)} (${sign(s.shelves.foodCpi.wow ?? 0)}% w/w), overall CPI ${fmt(s.shelves.cpiOverall.value)}. Fastest rising: ${s.shelves.fastestRising.map((f) => `${f.category} ${sign(f.wow)}%`).join(', ')}. Stock-outs: ${s.shelves.stockouts.count}.`,
    `Supply & routes (${L[s.supply.status].en}): Hormuz ${s.supply.hormuz.state.toUpperCase()}; ${fmt(s.supply.exposure.importsViaHormuzPct, 0)}% of imports and ${fmt(s.supply.exposure.cpiWeightAtRisk)}% of the CPI basket come through it. Port calls ${s.supply.portCalls.weekly}/week (${sign(s.supply.portCalls.wow)}%). Days of supply: Gulf ports ${s.supply.inbound.daysOfSupplyGulfPorts}, Red Sea ports ${s.supply.inbound.daysOfSupplyRedSeaPorts}. Most exposed: ${s.supply.topAtRisk.slice(0, 3).map((p) => `${p.product} (${p.hormuzPct}%)`).join(', ')}.`,
    `Confidence (${L[s.confidence.status].en}): Brent $${fmt(s.confidence.brent.value)} (${sign(s.confidence.brent.d1 ?? 0)}%), TASI ${fmt(s.confidence.tasi.value, 0)} (${sign(s.confidence.tasi.d1 ?? 0)}%), press sentiment ${sign(s.confidence.sentiment.score, 2)} (${s.confidence.sentiment.headlineCount} headlines, ${s.confidence.sentiment.date}).`,
    s.alerts.length ? `Alerts: ${s.alerts.map((a) => a.text_en).join(' ')}` : 'No new alerts.',
  ];
}

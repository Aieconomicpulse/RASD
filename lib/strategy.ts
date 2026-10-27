/**
 * The strategic layer: what the picture means and what to do about it, derived only from the
 * numbers in the snapshot. Every sentence here is a template over the data — nothing is invented,
 * and every recommendation names the evidence it rests on. Thresholds come from lib/status.ts.
 */
import { isoDeep } from './i18n';
import { BAND_AR } from './sentiment';
import { conditions, nextThreshold, signed, STATUS_LABEL } from './status';
import type { AtRiskProduct, Decision, L, Pillar, Priority, ScoreRow, Snapshot, Status, Strategy } from './types';

const ORDER: Status[] = ['normal', 'watch', 'alert', 'critical'];
const rank = (s: Status) => ORDER.indexOf(s);
const f = (n: number, d = 1) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const abs = (n: number, d = 1) => f(Math.abs(n), d);
const WORD_EN = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const WORD_AR = ['صفر', 'واحدة', 'اثنتان', 'ثلاث', 'أربع', 'خمس', 'ست', 'سبع', 'ثماني', 'تسع', 'عشر']; // feminine, agreeing with سلعة
const wordEn = (n: number) => WORD_EN[n] ?? String(n);
const wordAr = (n: number) => WORD_AR[n] ?? String(n);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const listEn = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const listAr = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join('، ')} و${xs[xs.length - 1]}`);
const usdEn = (m: number) => (m >= 1000 ? `$${f(m / 1000, 1)}B` : `$${f(m, 0)}M`);
const usdAr = (m: number) => (m >= 1000 ? `${f(m / 1000, 1)} مليار دولار` : `${f(m, 0)} مليون دولار`);
const costEn = (c: string | null) => (c ? c.replace('/t', ' a tonne') : '');
const costAr = (c: string | null) => (c ? `${c.replace('$', '').replace('/t', '')} دولاراً للطن` : '');
/** "Rice (Semi/Wholly Milled)" → "rice" — product names read as prose */
const proseEn = (s: string) => s.replace(/\s*\(.*?\)\s*/g, ' ').trim().toLowerCase().replace(/ & /g, ' and ');
const catEn = (s: string) => (s === 'Food Products NEC' ? 'other food products' : s.toLowerCase().replace(/ & /g, ' and '));
const countryEn = (c: string) => (c === 'USA' || c === 'United States' ? 'The United States' : c === 'UAE' ? 'The UAE' : c);
const proseAr = (s: string | null, fallback: string) => (s ?? fallback).replace(/\s*\(.*?\)\s*/g, ' ').trim();
/** Arabic counted noun for a day range: 2–3 أيام, 11–16 يوماً */
const daysAr = (d: string) => (d === '1–2' ? 'يوم إلى يومين' : parseInt(d, 10) >= 11 ? `${d} يوماً` : parseInt(d, 10) <= 2 && !d.includes('–') ? `${d} يوم` : `${d} أيام`);
const dateEn = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });
const dateAr = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('ar-SA-u-nu-latn-ca-gregory', { day: 'numeric', month: 'long', timeZone: 'UTC' });

const HZ: Record<'open' | 'restricted' | 'closed', L> = { open: { en: 'open', ar: 'مفتوح' }, restricted: { en: 'restricted', ar: 'مقيّد' }, closed: { en: 'closed', ar: 'مغلق' } };
const GRADE: Record<string, L> = { HIGH: { en: 'high', ar: 'مرتفع' }, MEDIUM: { en: 'medium', ar: 'متوسط' }, LOW: { en: 'low', ar: 'منخفض' } };

export const PILLAR_NAME: Record<Pillar, L> = {
  supply: { en: 'Supply and routes', ar: 'الإمداد والمسارات' },
  shelves: { en: 'Prices and shelves', ar: 'الأسعار والأرفف' },
  confidence: { en: 'Markets and confidence', ar: 'الأسواق والثقة' },
  economy: { en: 'Growth', ar: 'النمو' },
};
export const PRIORITY_LABEL: Record<Priority, L> = { act: { en: 'Act now', ar: 'تحرّك الآن' }, prepare: { en: 'Prepare', ar: 'استعداد' }, monitor: { en: 'Monitor', ar: 'متابعة' } };

function statusOf(s: Snapshot, p: Pillar): Status { return p === 'supply' ? s.supply.status : p === 'shelves' ? s.shelves.status : p === 'confidence' ? s.confidence.status : s.economy.status; }

// ---- the bottom line ----------------------------------------------------------------------------------------
const BINDING: Record<Pillar, L> = {
  supply: { en: 'Supply is the binding constraint.', ar: 'الإمداد هو القيد الحاكم.' },
  shelves: { en: 'Food prices are the binding constraint.', ar: 'أسعار الغذاء هي القيد الحاكم.' },
  confidence: { en: 'Confidence is the binding constraint.', ar: 'الثقة هي القيد الحاكم.' },
  economy: { en: 'Growth is the binding constraint.', ar: 'النمو هو القيد الحاكم.' },
};
const BUILDING: Record<Pillar, L> = {
  supply: { en: 'Pressure is building on supply.', ar: 'الضغط يتصاعد على الإمداد.' },
  shelves: { en: 'Pressure is building on food prices.', ar: 'الضغط يتصاعد على أسعار الغذاء.' },
  confidence: { en: 'Pressure is building on confidence.', ar: 'الضغط يتصاعد على الثقة.' },
  economy: { en: 'Pressure is building on growth.', ar: 'الضغط يتصاعد على النمو.' },
};
function phrase(s: Snapshot, p: Pillar): L {
  const st = statusOf(s, p);
  const oilLift = s.confidence.brent.vsPreWar >= 30 && s.economy.gdp.momentum4w >= 0;
  const t: Record<Pillar, Record<Status, L>> = {
    supply: { normal: { en: 'supply is flowing', ar: 'الإمداد يتدفق' }, watch: { en: 'supply is tight', ar: 'الإمداد متوتر' }, alert: { en: 'supply is squeezed', ar: 'الإمداد تحت الضغط' }, critical: { en: 'supply is breaking down', ar: 'الإمداد ينهار' } },
    shelves: { normal: { en: 'food prices are stable', ar: 'أسعار الغذاء مستقرة' }, watch: { en: 'food prices are rising but contained', ar: 'أسعار الغذاء ترتفع لكنها تحت السيطرة' }, alert: { en: 'food prices are rising fast', ar: 'أسعار الغذاء ترتفع بسرعة' }, critical: { en: 'food prices are spiking', ar: 'أسعار الغذاء تقفز' } },
    confidence: { normal: { en: 'markets are calm', ar: 'الأسواق هادئة' }, watch: { en: 'markets are uneasy', ar: 'الأسواق قلقة' }, alert: { en: 'confidence is slipping', ar: 'الثقة تتراجع' }, critical: { en: 'confidence is breaking', ar: 'الثقة تنهار' } },
    economy: {
      normal: oilLift ? { en: 'growth is holding on higher oil', ar: 'النمو صامد بدعم من ارتفاع النفط' } : { en: 'growth is holding', ar: 'النمو صامد' },
      watch: { en: 'growth is slowing', ar: 'النمو يتباطأ' }, alert: { en: 'growth is contracting', ar: 'النمو ينكمش' }, critical: { en: 'growth is falling sharply', ar: 'النمو يهبط بحدة' },
    },
  };
  return t[p][st];
}

// ---- scorecard ------------------------------------------------------------------------------------------------
function scorecard(s: Snapshot): ScoreRow[] {
  const conds = conditions(s);
  const pc = s.supply.portCalls, fc = s.shelves.foodCpi, br = s.confidence.brent, g = s.economy.gdp;
  const of2025 = Math.round((pc.weekly / pc.avg2025) * 100);
  const since = s.supply.hormuz.since;
  const lead = s.shelves.fastestRising[0];
  const row = (pillar: Pillar, value: string, unit: L, meaning: L): ScoreRow => ({ pillar, status: statusOf(s, pillar), name: PILLAR_NAME[pillar], value, unit, meaning, next: nextThreshold(s, pillar, statusOf(s, pillar), conds) });
  return [
    row('supply', String(pc.weekly), { en: 'port calls a week', ar: 'رسوّ سفن أسبوعياً' }, {
      en: `${of2025}% of the 2025 average of ${pc.avg2025}. Hormuz ${HZ[s.supply.hormuz.state].en}${since ? ` since ${dateEn(since)}` : ''}.`,
      ar: `${of2025}% من متوسط 2025 البالغ ${pc.avg2025}. هرمز ${HZ[s.supply.hormuz.state].ar}${since ? ` منذ ${dateAr(since)}` : ''}.`,
    }),
    row('shelves', `${signed(fc.m4 ?? 0)}%`, { en: 'food prices over four weeks', ar: 'أسعار الغذاء خلال أربعة أسابيع' }, {
      en: `Food index ${f(fc.value)}, ${signed(fc.yoy ?? 0)}% on a year ago.${lead ? ` ${lead.label_en} ${signed(lead.wow)}% this week.` : ''}`,
      ar: `مؤشر الغذاء ${f(fc.value)}، ${signed(fc.yoy ?? 0)}% على أساس سنوي.${lead ? ` ${lead.label_ar} ${signed(lead.wow)}% هذا الأسبوع.` : ''}`,
    }),
    row('confidence', `$${f(br.value)}`, { en: 'Brent a barrel', ar: 'برنت للبرميل' }, {
      en: `${signed(br.vsPreWar, 0)}% on the pre-war average of $${f(br.preWar)}. TASI ${signed(s.confidence.tasi.m4 ?? 0)}% over four weeks.`,
      ar: `${signed(br.vsPreWar, 0)}% عن متوسط ما قبل الحرب (${f(br.preWar)} دولاراً). تاسي ${signed(s.confidence.tasi.m4 ?? 0)}% خلال أربعة أسابيع.`,
    }),
    row('economy', `$${f(g.totalUsdT, 2)}T`, { en: 'GDP a year, nowcast', ar: 'الناتج المحلي السنوي، تقدير آني' }, {
      en: `${signed(g.momentum4w)}% over four weeks. Non-oil $${f(g.nonOilUsdT, 2)}T; consumer spending ${signed(s.economy.spending.yoy ?? 0)}% on a year ago.`,
      ar: `${signed(g.momentum4w)}% خلال أربعة أسابيع. غير النفطي ${f(g.nonOilUsdT, 2)} تريليون دولار؛ الإنفاق الاستهلاكي ${signed(s.economy.spending.yoy ?? 0)}% على أساس سنوي.`,
    }),
  ];
}

// ---- key judgments -------------------------------------------------------------------------------------------
function judgment(s: Snapshot, p: Pillar): L {
  const pc = s.supply.portCalls, ex = s.supply.exposure, fc = s.shelves.foodCpi, br = s.confidence.brent, g = s.economy.gdp, sp = s.economy.spending;
  const of2025 = Math.round((pc.weekly / pc.avg2025) * 100);
  if (p === 'supply') return {
    en: `Port calls are at ${of2025}% of the 2025 level, ${pc.weekly} a week against ${pc.avg2025}. ${f(ex.importsViaHormuzPct)}% of the Kingdom's imports, $${f(ex.importsViaHormuzUsdB, 0)}B a year, normally pass Hormuz.`,
    ar: `رسو السفن عند ${of2025}% من مستوى 2025: ${pc.weekly} أسبوعياً مقابل ${pc.avg2025}. ونحو ${f(ex.importsViaHormuzPct)}% من واردات المملكة، أي ${f(ex.importsViaHormuzUsdB, 0)} مليار دولار سنوياً، تمرّ عادةً عبر هرمز.`,
  };
  if (p === 'shelves') {
    const m4 = fc.m4 ?? 0, yoy = fc.yoy ?? 0, lead = s.shelves.fastestRising[0];
    return {
      en: `Food prices are ${m4 >= 0 ? 'up' : 'down'} ${abs(m4)}% in four weeks and ${yoy >= 0 ? 'up' : 'down'} ${abs(yoy)}% on a year ago${lead ? `; ${catEn(lead.label_en)} ${lead.wow >= 0 ? 'rose' : 'fell'} ${abs(lead.wow)}% this week` : ''}.`,
      ar: `أسعار الغذاء ${m4 >= 0 ? 'ارتفعت' : 'انخفضت'} ${abs(m4)}% خلال أربعة أسابيع و${yoy >= 0 ? 'ارتفعت' : 'انخفضت'} ${abs(yoy)}% على أساس سنوي${lead ? `؛ و${lead.label_ar} ${lead.wow >= 0 ? 'ارتفعت' : 'انخفضت'} ${abs(lead.wow)}% هذا الأسبوع` : ''}.`,
    };
  }
  if (p === 'confidence') {
    const sent = s.confidence.sentiment;
    return {
      en: `Brent is $${f(br.value)}, ${abs(br.vsPreWar, 0)}% ${br.vsPreWar >= 0 ? 'above' : 'below'} its pre-war average; TASI is ${signed(s.confidence.tasi.m4 ?? 0)}% over four weeks and press sentiment reads ${signed(sent.score, 2)} (${sent.band}).`,
      ar: `برنت عند ${f(br.value)} دولاراً، ${br.vsPreWar >= 0 ? 'أعلى' : 'أدنى'} بـ${abs(br.vsPreWar, 0)}% من متوسط ما قبل الحرب؛ وتاسي ${signed(s.confidence.tasi.m4 ?? 0)}% خلال أربعة أسابيع، ومعنويات الصحافة ${signed(sent.score, 2)} (${BAND_AR[sent.band] ?? sent.band}).`,
    };
  }
  const oilLift = br.vsPreWar >= 30 && g.momentum4w >= 0;
  return {
    en: `Output runs at $${f(g.totalUsdT, 2)} trillion a year, ${signed(g.momentum4w)}% over four weeks${oilLift ? ', lifted by oil' : ''}; non-oil GDP is $${f(g.nonOilUsdT, 2)} trillion and consumer spending is ${signed(sp.yoy ?? 0)}% on a year ago.`,
    ar: `الناتج يسير بمعدل ${f(g.totalUsdT, 2)} تريليون دولار سنوياً، ${signed(g.momentum4w)}% خلال أربعة أسابيع${oilLift ? ' بدعم من النفط' : ''}؛ والناتج غير النفطي ${f(g.nonOilUsdT, 2)} تريليون دولار، والإنفاق الاستهلاكي ${signed(sp.yoy ?? 0)}% على أساس سنوي.`,
  };
}

// ---- decisions ------------------------------------------------------------------------------------------------
function productLine(p: AtRiskProduct): L {
  const name = { en: cap(proseEn(p.product)), ar: proseAr(p.product_ar, p.product) };
  const main = { en: p.mainSource, ar: p.mainSource_ar ?? p.mainSource };
  const existing = p.options.filter((o) => !o.suggested && o.usdM > 0);
  const suggested = p.options.filter((o) => o.suggested).slice(0, 2);
  if (p.atScale && existing.length) {
    const o = existing[0];
    return {
      en: `${name.en}: ${main.en} supplies ${f(p.mainShare, 0)}%. ${countryEn(o.country)} already ships ${usdEn(o.usdM)} a year and can land at ${o.port ?? 'Jeddah'}${o.days ? ` in ${o.days} days` : ''}${suggested.length ? `; ${listEn(suggested.map((x) => x.country))} ${suggested.length > 1 ? 'are' : 'is'} suggested additions` : ''}.`,
      ar: `${name.ar}: ${main.ar} تورّد ${f(p.mainShare, 0)}%. و${o.country_ar ?? o.country} تشحن فعلاً ${usdAr(o.usdM)} سنوياً ويمكنها الإنزال في ${o.port === 'Jeddah' || !o.port ? 'جدة' : o.port}${o.days ? ` خلال ${daysAr(o.days)}` : ''}${suggested.length ? `؛ ويُقترح إضافة ${listAr(suggested.map((x) => x.country_ar ?? x.country))}` : ''}.`,
    };
  }
  return {
    en: `${name.en}: ${main.en} supplies ${f(p.mainShare, 0)}% and no alternative supplier ships at scale, so stock and re-routing are the hedge.`,
    ar: `${name.ar}: ${main.ar} تورّد ${f(p.mainShare, 0)}% ولا يوجد مورد بديل بحجم يُعتدّ به، لذا فالمخزون وإعادة التوجيه هما صمام الأمان.`,
  };
}

function decisions(s: Snapshot): Decision[] {
  const out: Decision[] = [];
  const su = s.supply, ex = su.exposure, pc = su.portCalls, sh = s.shelves, co = s.confidence, ec = s.economy;
  const sup = rank(su.status);
  const of2025 = Math.round((pc.weekly / pc.avg2025) * 100);
  const cor = (id: string) => su.corridors.find((c) => c.id === id);
  const jed = cor('jeddah'), fuj = cor('fujairah'), duqm = cor('duqm');

  // 1 · land exposed food at the Red Sea ports
  const exposed = su.topAtRisk.filter((p) => p.hormuzPct >= 50).slice(0, 5);
  if ((su.hormuz.state !== 'open' || sup >= rank('watch')) && ex.foodExposed.lines > 0 && exposed.length) {
    out.push({
      id: 'reroute-food', pillar: 'supply', priority: sup >= rank('alert') ? 'act' : 'prepare',
      title: { en: 'Land Hormuz-exposed food at the Red Sea ports', ar: 'إنزال الغذاء المعرّض لهرمز في موانئ البحر الأحمر' },
      body: {
        en: `${ex.foodExposed.lines} food lines are at least half dependent on Hormuz, worth $${f(ex.foodExposed.usdB)}B a year; the largest ${wordEn(exposed.length)} (${listEn(exposed.map((p) => proseEn(p.product)))}) account for $${f(ex.foodExposed.top5UsdB)}B. The same suppliers can land at Jeddah, King Abdullah Port or Yanbu${jed ? `; the road to the Eastern Province takes ${jed.days} days at ${costEn(jed.cost)}` : ''}.`,
        ar: `${ex.foodExposed.lines} سلعة غذائية تعتمد على هرمز بنصف وارداتها على الأقل، بقيمة ${f(ex.foodExposed.usdB)} مليار دولار سنوياً؛ وتمثّل أكبر ${wordAr(exposed.length)} منها (${listAr(exposed.map((p) => proseAr(p.product_ar, p.product)))}) ${f(ex.foodExposed.top5UsdB)} مليار دولار. يمكن للموردين أنفسهم الإنزال في جدة أو ميناء الملك عبدالله أو ينبع${jed ? `؛ ويستغرق الطريق إلى المنطقة الشرقية ${daysAr(jed.days ?? '2–3')} بتكلفة ${costAr(jed.cost)}` : ''}.`,
      },
    });
  }
  // 2 · capacity on the west–east corridor
  if (pc.vs2025 <= -30 || su.hormuz.state !== 'open') {
    out.push({
      id: 'corridor-capacity', pillar: 'supply', priority: pc.vs2025 <= -50 || sup >= rank('alert') ? 'act' : 'prepare',
      title: { en: 'Secure berths and trucks on the west–east corridor', ar: 'تأمين المراسي والشاحنات على الممر من الغرب إلى الشرق' },
      body: {
        en: `Port calls are at ${of2025}% of the 2025 level. Moving Gulf-bound cargo west needs berth space at the Red Sea ports and trucks on the ${jed?.km ? `${jed.km.toLocaleString('en-US')} km ` : ''}Jeddah–Dammam road.${fuj ? ` Fujairah (${fuj.days} days by road) and Duqm (${duqm?.days ?? '2–3'}) are the eastern fallbacks; Aqaba serves the north.` : ''}`,
        ar: `رسو السفن عند ${of2025}% من مستوى 2025. نقل البضائع المتجهة إلى الخليج غرباً يتطلب مراسي في موانئ البحر الأحمر وشاحنات على طريق جدة–الدمام${jed?.km ? ` (${jed.km.toLocaleString('en-US')} كم)` : ''}.${fuj ? ` والفجيرة (${daysAr(fuj.days ?? '1–2')} براً) والدقم (${daysAr(duqm?.days ?? '2–3')}) بديلان شرقيان، والعقبة تخدم الشمال.` : ''}`,
      },
    });
  }
  // 3 · second suppliers where one country dominates
  const concentrated = su.topAtRisk.filter((p) => p.hormuzPct >= 50 && p.mainShare >= 50).slice(0, 2);
  if (concentrated.length) {
    const lines = concentrated.map(productLine);
    out.push({
      id: 'second-suppliers', pillar: 'supply', priority: 'prepare',
      title: { en: `Line up second suppliers for ${listEn(concentrated.map((p) => proseEn(p.product)))}`, ar: `تأمين موردين بدلاء: ${listAr(concentrated.map((p) => proseAr(p.product_ar, p.product)))}` },
      body: { en: lines.map((l) => l.en).join(' '), ar: lines.map((l) => l.ar).join(' ') },
    });
  }
  // 4 · consumer price measures
  if (rank(sh.status) >= rank('watch')) {
    const act = rank(sh.status) >= rank('alert');
    const line = act ? 20 : 10;
    out.push({
      id: 'price-measures', pillar: 'shelves', priority: act ? 'act' : 'prepare',
      title: act ? { en: 'Activate consumer price measures for food', ar: 'تفعيل إجراءات حماية أسعار الغذاء للمستهلك' } : { en: 'Prepare consumer price measures for food', ar: 'الاستعداد لإجراءات حماية أسعار الغذاء للمستهلك' },
      body: {
        en: `Food prices are ${(sh.foodCpi.m4 ?? 0) >= 0 ? 'up' : 'down'} ${abs(sh.foodCpi.m4 ?? 0)}% in four weeks and ${(sh.foodCpi.yoy ?? 0) >= 0 ? 'up' : 'down'} ${abs(sh.foodCpi.yoy ?? 0)}% on a year ago (index ${f(sh.foodCpi.value)}). The ${act ? 'Critical' : 'Alert'} line is +${line}% over four weeks.`,
        ar: `أسعار الغذاء ${(sh.foodCpi.m4 ?? 0) >= 0 ? 'ارتفعت' : 'انخفضت'} ${abs(sh.foodCpi.m4 ?? 0)}% خلال أربعة أسابيع و${abs(sh.foodCpi.yoy ?? 0)}% على أساس سنوي (المؤشر ${f(sh.foodCpi.value)}). خط ${act ? 'الحالة الحرجة' : 'التنبيه'} عند +${line}% خلال أربعة أسابيع.`,
      },
    });
  }
  // 5 · the oil windfall
  if (co.brent.vsPreWar >= 30) {
    out.push({
      id: 'oil-windfall', pillar: 'confidence', priority: 'prepare',
      title: { en: 'Put the oil windfall behind the supply response', ar: 'توظيف العائد النفطي الإضافي لدعم الاستجابة للإمداد' },
      body: {
        en: `Brent at $${f(co.brent.value)} is ${abs(co.brent.vsPreWar, 0)}% above its pre-war average of $${f(co.brent.preWar)}, and oil GDP runs at $${f(ec.gdp.oilUsdT, 2)} trillion a year. The extra revenue can fund stock-building, re-routing and higher freight.`,
        ar: `برنت عند ${f(co.brent.value)} دولاراً، أعلى بـ${abs(co.brent.vsPreWar, 0)}% من متوسط ما قبل الحرب (${f(co.brent.preWar)} دولاراً)، والناتج النفطي يسير بمعدل ${f(ec.gdp.oilUsdT, 2)} تريليون دولار سنوياً. يمكن للعائد الإضافي تمويل بناء المخزون وإعادة التوجيه وارتفاع تكاليف الشحن.`,
      },
    });
  }
  // 6 · the fastest-rising food category
  const lead = sh.fastestRising[0];
  if (lead && lead.wow >= 3) {
    const g = GRADE[lead.hormuz];
    out.push({
      id: 'category-watch', pillar: 'shelves', priority: 'monitor',
      title: { en: `Watch the price of ${catEn(lead.label_en)}`, ar: `متابعة أسعار ${lead.label_ar}` },
      body: {
        en: `Up ${abs(lead.wow)}% this week, the fastest-rising food category${g ? `, with ${g.en} Hormuz exposure` : ''}. Check retail margins and stock levels.`,
        ar: `ارتفعت ${abs(lead.wow)}% هذا الأسبوع، وهي الفئة الأسرع ارتفاعاً${g ? `، وتعرّضها لهرمز ${g.ar}` : ''}. يُنصح بمراجعة هوامش التجزئة ومستويات المخزون.`,
      },
    });
  }
  // 7 · the stock market
  if ((co.tasi.m4 ?? 0) <= -5 || co.sentiment.score <= 0) {
    out.push({
      id: 'market-watch', pillar: 'confidence', priority: 'monitor',
      title: { en: 'Watch the stock market', ar: 'متابعة سوق الأسهم' },
      body: {
        en: `TASI is ${signed(co.tasi.m4 ?? 0)}% over four weeks at ${co.tasi.value.toLocaleString('en-US')}; press sentiment is ${co.sentiment.band} at ${signed(co.sentiment.score, 2)}.`,
        ar: `تاسي ${signed(co.tasi.m4 ?? 0)}% خلال أربعة أسابيع عند ${co.tasi.value.toLocaleString('en-US')}؛ ومعنويات الصحافة ${BAND_AR[co.sentiment.band] ?? co.sentiment.band} عند ${signed(co.sentiment.score, 2)}.`,
      },
    });
  }
  // 8 · growth support
  if (rank(ec.status) >= rank('watch')) {
    out.push({
      id: 'growth-support', pillar: 'economy', priority: rank(ec.status) >= rank('alert') ? 'act' : 'prepare',
      title: { en: 'Support non-oil activity', ar: 'دعم النشاط غير النفطي' },
      body: {
        en: `Four-week growth momentum is ${signed(ec.gdp.momentum4w)}%, PMI ${f(ec.pmi)} and consumer spending ${signed(ec.spending.wow ?? 0)}% this week.`,
        ar: `زخم النمو خلال أربعة أسابيع ${signed(ec.gdp.momentum4w)}%، ومؤشر مديري المشتريات ${f(ec.pmi)}، والإنفاق الاستهلاكي ${signed(ec.spending.wow ?? 0)}% هذا الأسبوع.`,
      },
    });
  }
  const P: Record<Priority, number> = { act: 0, prepare: 1, monitor: 2 };
  return out.map((d, i) => ({ d, i })).sort((a, b) => P[a.d.priority] - P[b.d.priority] || rank(statusOf(s, b.d.pillar)) - rank(statusOf(s, a.d.pillar)) || a.i - b.i).map((x) => x.d);
}

// ---- section titles -----------------------------------------------------------------------------------------------
function sections(s: Snapshot): Strategy['sections'] {
  const su = s.supply, ex = su.exposure, pc = su.portCalls, sh = s.shelves, ec = s.economy, br = s.confidence.brent;
  const of2025 = Math.round((pc.weekly / pc.avg2025) * 100);
  const hz = HZ[su.hormuz.state];
  const supplyTitle: L = su.hormuz.state !== 'open' && pc.vs2025 <= -30
    ? { en: 'Imports are squeezed at the Gulf door; the Red Sea door is open', ar: 'الواردات مختنقة عند بوابة الخليج، وبوابة البحر الأحمر مفتوحة' }
    : su.hormuz.state !== 'open'
      ? { en: `Hormuz is ${hz.en}, but port traffic is holding`, ar: `هرمز ${hz.ar}، لكن حركة الموانئ صامدة` }
      : { en: 'Both sea doors are open', ar: 'بوابتا البحر مفتوحتان' };
  const m4 = sh.foodCpi.m4 ?? 0;
  const leader = [...sh.categories].filter((c) => c.m4 !== null).sort((a, b) => (b.m4 ?? 0) - (a.m4 ?? 0))[0];
  const shelvesTitle: L = m4 >= 0
    ? { en: `Food prices are up ${abs(m4)}% in four weeks${leader ? `, led by ${catEn(leader.label_en)}` : ''}`, ar: `أسعار الغذاء ارتفعت ${abs(m4)}% خلال أربعة أسابيع${leader ? `، تتصدّرها ${leader.label_ar}` : ''}` }
    : { en: `Food prices are easing: ${signed(m4)}% over four weeks`, ar: `أسعار الغذاء تتراجع: ${signed(m4)}% خلال أربعة أسابيع` };
  const oilLift = br.vsPreWar >= 30 && ec.gdp.momentum4w >= 0;
  const nonOilHolding = (ec.spending.yoy ?? 0) >= 0 && ec.pmi >= 50;
  const growthTitle: L = ec.gdp.momentum4w < 0
    ? { en: `Output is slowing: ${signed(ec.gdp.momentum4w)}% over four weeks`, ar: `الناتج يتباطأ: ${signed(ec.gdp.momentum4w)}% خلال أربعة أسابيع` }
    : oilLift
      ? nonOilHolding
        ? { en: `Higher oil lifts output to $${f(ec.gdp.totalUsdT, 2)} trillion a year; non-oil activity is holding`, ar: `ارتفاع النفط يرفع الناتج إلى ${f(ec.gdp.totalUsdT, 2)} تريليون دولار سنوياً، والنشاط غير النفطي صامد` }
        : { en: `Higher oil lifts output to $${f(ec.gdp.totalUsdT, 2)} trillion a year, but non-oil activity is softening`, ar: `ارتفاع النفط يرفع الناتج إلى ${f(ec.gdp.totalUsdT, 2)} تريليون دولار سنوياً، لكن النشاط غير النفطي يلين` }
      : { en: `Output is growing at $${f(ec.gdp.totalUsdT, 2)} trillion a year`, ar: `الناتج ينمو بمعدل ${f(ec.gdp.totalUsdT, 2)} تريليون دولار سنوياً` };
  return {
    supply: {
      title: supplyTitle,
      dek: {
        en: `${f(ex.importsViaHormuzPct)}% of the Kingdom's imports, $${f(ex.importsViaHormuzUsdB, 0)}B a year, pass Hormuz, and port calls are at ${of2025}% of the 2025 level. The Red Sea ports and the land corridors are the open routes.`,
        ar: `${f(ex.importsViaHormuzPct)}% من واردات المملكة، أي ${f(ex.importsViaHormuzUsdB, 0)} مليار دولار سنوياً، تمرّ عبر هرمز، ورسو السفن عند ${of2025}% من مستوى 2025. موانئ البحر الأحمر والممرات البرية هي المسارات المفتوحة.`,
      },
    },
    shelves: {
      title: shelvesTitle,
      dek: {
        en: `The food index stands at ${f(sh.foodCpi.value)} (base 100), ${signed(sh.foodCpi.yoy ?? 0)}% on a year ago. Of the ${sh.productsTracked} products tracked daily, ${sh.basket.directProducts} ship direct through Hormuz and ${sh.basket.rawMaterialRiskProducts} depend on imported raw materials.`,
        ar: `مؤشر الغذاء عند ${f(sh.foodCpi.value)} (الأساس 100)، ${signed(sh.foodCpi.yoy ?? 0)}% على أساس سنوي. ومن أصل ${sh.productsTracked} منتجاً تُتابَع يومياً، ${sh.basket.directProducts} تُشحن مباشرة عبر هرمز و${sh.basket.rawMaterialRiskProducts} تعتمد على مواد خام مستوردة.`,
      },
    },
    growth: {
      title: growthTitle,
      dek: {
        en: `GDP nowcast, annualised: oil $${f(ec.gdp.oilUsdT, 2)}T, non-oil $${f(ec.gdp.nonOilUsdT, 2)}T (${f(100 - ec.gdp.oilShare, 0)}% of output). PMI ${f(ec.pmi)}; consumer spending ${signed(ec.spending.yoy ?? 0)}% on a year ago; Brent $${f(br.value)}.`,
        ar: `تقدير الناتج الآني السنوي: النفطي ${f(ec.gdp.oilUsdT, 2)} تريليون دولار، وغير النفطي ${f(ec.gdp.nonOilUsdT, 2)} تريليون (${f(100 - ec.gdp.oilShare, 0)}% من الناتج). مؤشر مديري المشتريات ${f(ec.pmi)}؛ الإنفاق الاستهلاكي ${signed(ec.spending.yoy ?? 0)}% على أساس سنوي؛ برنت ${f(br.value)} دولاراً.`,
      },
    },
  };
}

export function buildStrategy(s: Snapshot): Strategy {
  const pillars: Pillar[] = ['supply', 'shelves', 'confidence', 'economy'];
  const bySeverity = [...pillars].sort((a, b) => rank(statusOf(s, b)) - rank(statusOf(s, a)) || pillars.indexOf(a) - pillars.indexOf(b));
  const top = bySeverity[0];
  const topStatus = statusOf(s, top);
  const binding = rank(topStatus) >= rank('watch') ? top : null;
  const headline: L = !binding ? { en: 'The economy is holding on all four fronts.', ar: 'الاقتصاد صامد على الجبهات الأربع.' } : rank(topStatus) >= rank('alert') ? BINDING[binding] : BUILDING[binding];
  const rest = pillars.filter((p) => p !== binding).map((p) => phrase(s, p));
  const standfirst: L = {
    en: `${cap(rest.length > 1 ? `${rest.slice(0, -1).map((r) => r.en).join(', ')}, and ${rest[rest.length - 1].en}` : rest[0]?.en ?? '')}.`,
    ar: `${rest.length > 1 ? `${rest.slice(0, -1).map((r, i) => (i === 0 ? r.ar : `و${r.ar}`)).join('، ')}، و${rest[rest.length - 1].ar}` : rest[0]?.ar ?? ''}.`,
  };
  // three judgments: the two most stressed pillars, then growth as the counterweight
  const picks = bySeverity.slice(0, 2);
  picks.push(picks.includes('economy') ? bySeverity[2] : 'economy');
  return isoDeep({
    binding, headline, standfirst,
    judgments: picks.map((p) => judgment(s, p)),
    scorecard: scorecard(s),
    decisions: decisions(s),
    sections: sections(s),
  });
}

export { STATUS_LABEL };

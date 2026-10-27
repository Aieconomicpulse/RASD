import Link from 'next/link';
import { currentLang } from '@/lib/auth';
import { getSituation } from '@/lib/situation';
import { fmtDate, HIJRI_LOCALE } from '@/lib/i18n';
import { BAND_AR } from '@/lib/sentiment';
import { PILLAR_NAME, PRIORITY_LABEL } from '@/lib/strategy';
import type { L, Lang, Priority } from '@/lib/types';
import StatusPill, { PriorityMark, StatusShape } from '@/components/StatusPill';
import GulfMap from '@/components/GulfMap';
import TrendChart from '@/components/TrendChart';
import { Delta, DivBar, Figure, Grade, Kpi, Meter } from '@/components/Figures';

export const revalidate = 900;

const f = (n: number, d = 1) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const signed = (n: number, d = 1) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${f(Math.abs(n), d)}`;
const usd = (m: number, lang: Lang) => (m >= 1000 ? (lang === 'ar' ? `${f(m / 1000, 1)} مليار دولار` : `$${f(m / 1000, 1)}B`) : lang === 'ar' ? `${f(m, 0)} مليون دولار` : `$${f(m, 0)}M`);
const costAr = (c: string) => `${c.replace('$', '').replace('/t', '')} دولاراً للطن`;

/** Page copy — every string the situation page shows, in both languages. */
const C = {
  scorecard: { en: 'Where the four pillars stand', ar: 'أين تقف الركائز الأربع' },
  colPillar: { en: 'Pillar', ar: 'الركيزة' }, colToday: { en: 'Today', ar: 'اليوم' }, colMeaning: { en: 'What it means', ar: 'ماذا يعني' }, colNext: { en: 'What would change the status', ar: 'ما الذي يغيّر الحالة' },
  noNext: { en: 'At the top of the scale.', ar: 'في أعلى السلّم.' },
  decisions: { en: 'Decisions for this week', ar: 'قرارات هذا الأسبوع' },
  decisionsDek: { en: 'Ranked by urgency. Each one rests on the figures further down this page.', ar: 'مرتّبة حسب الأولوية، وكلّ منها مبني على الأرقام الواردة أدناه في هذه الصفحة.' },
  nothing: { en: 'Nothing at this level today.', ar: 'لا شيء في هذا المستوى اليوم.' },
  fromDesk: { en: 'From the desk', ar: 'من المكتب' },
  mapTitle: { en: 'The Kingdom between two seas: shipping lanes, ports and the roads east', ar: 'المملكة بين بحرين: ممرات الملاحة والموانئ والطرق نحو الشرق' },
  lgHormuz: { en: 'Shipping lane through Hormuz', ar: 'ممر الملاحة عبر هرمز' },
  lgOpen: { en: 'Lanes that avoid Hormuz', ar: 'ممرات تتجنب هرمز' },
  lgRoad: { en: 'Roads into the Kingdom and on to the Eastern Province', ar: 'طرق الدخول إلى المملكة ونحو المنطقة الشرقية' },
  mapNote: { en: 'Schematic, not to scale. Routes as modelled by the KSA platform. The Hormuz status is set by the desk each morning.', ar: 'رسم تخطيطي غير مطابق للمقياس. المسارات وفق نموذج المنصة السعودية، وحالة هرمز يحدّدها المكتب كل صباح.' },
  importsVia: { en: 'of the Kingdom’s imports pass Hormuz', ar: 'من واردات المملكة تمرّ عبر هرمز' },
  critical: { en: 'critical products, over 70% through the strait', ar: 'منتجاً حرجاً، أكثر من 70% منها عبر المضيق' },
  foodVia: { en: 'of food imports pass Hormuz', ar: 'من واردات الغذاء تمرّ عبر هرمز' },
  portTitle: { en: 'Port calls a week since January 2025', ar: 'رسو السفن أسبوعياً منذ يناير 2025' },
  portLabel: { en: 'Port calls', ar: 'رسو السفن' },
  avg2025: { en: '2025 average', ar: 'متوسط 2025' },
  event: { en: '28 Feb: Hormuz disrupted', ar: '28 فبراير: اضطراب هرمز' },
  corridors: { en: 'Ways in that avoid Hormuz', ar: 'مسارات دخول تتجنب هرمز' },
  corridorsDek: { en: 'Road distance, time and cost on to the Eastern Province.', ar: 'المسافة البرية والمدة والتكلفة حتى المنطقة الشرقية.' },
  days: { en: 'days', ar: 'أيام' },
  exposedTitle: { en: 'Food imports most exposed to Hormuz', ar: 'واردات الغذاء الأكثر تعرضاً لهرمز' },
  exposedDek: {
    en: 'In the platform’s route model these imports land at Dammam through the strait. The same cargo can land at the Red Sea ports, which makes their berths, the road east and the Bab el-Mandeb approach the points to protect.',
    ar: 'في نموذج المسارات لدى المنصة، تصل هذه الواردات إلى الدمام عبر المضيق. ويمكن للشحنات نفسها أن تصل إلى موانئ البحر الأحمر، ما يجعل مراسيها والطريق نحو الشرق ومدخل باب المندب نقاطاً يجب حمايتها.',
  },
  colProduct: { en: 'Product', ar: 'المنتج' }, colThrough: { en: 'Through Hormuz a year', ar: 'عبر هرمز سنوياً' }, colMain: { en: 'Main supplier', ar: 'المورد الرئيسي' }, colOption: { en: 'Hormuz-free option', ar: 'بديل دون هرمز' },
  already: { en: 'already ships', ar: 'تشحن فعلاً' }, suggested: { en: 'Suggested', ar: 'مقترح' }, noScale: { en: 'No alternative supplier at scale; stock and re-routing are the hedge.', ar: 'لا مورد بديلاً بحجم كافٍ؛ المخزون وإعادة التوجيه هما صمام الأمان.' },
  ofImports: { en: 'of imports', ar: 'من الواردات' },
  foodChart: { en: 'Food index and overall CPI, weekly, base 100', ar: 'مؤشر الغذاء والمؤشر العام، أسبوعياً، الأساس 100' },
  food: { en: 'Food index', ar: 'مؤشر الغذاء' }, cpi: { en: 'Overall CPI', ar: 'المؤشر العام' },
  catTitle: { en: 'Food categories this week', ar: 'فئات الغذاء هذا الأسبوع' },
  colCat: { en: 'Category', ar: 'الفئة' }, colIdx: { en: 'Index', ar: 'المؤشر' }, colWow: { en: 'Week on week', ar: 'أسبوعياً' }, colHz: { en: 'Hormuz exposure', ar: 'التعرّض لهرمز' },
  basket: { en: 'The tracked basket', ar: 'السلة المتابَعة' },
  stockouts: { en: 'Stock-outs are not tracked yet. They need an availability flag in the retail price scraper.', ar: 'نفاد المخزون غير متابَع بعد، ويتطلب مؤشر توافر في جامع أسعار التجزئة.' },
  gdpChart: { en: 'GDP nowcast, annualised, $ trillion', ar: 'تقدير الناتج الآني السنوي، تريليون دولار' },
  total: { en: 'Total', ar: 'الإجمالي' }, nonOil: { en: 'Non-oil', ar: 'غير النفطي' },
  spending: { en: 'Consumer spending', ar: 'الإنفاق الاستهلاكي' }, employment: { en: 'Employment', ar: 'التوظيف' }, pmi: { en: 'PMI', ar: 'مؤشر مديري المشتريات' },
  invest: { en: 'Investment confidence', ar: 'ثقة الاستثمار' }, brent: { en: 'Brent, $ a barrel', ar: 'برنت، دولار للبرميل' }, tasi: { en: 'TASI', ar: 'تاسي' },
  sama: { en: 'SAMA repo rate', ar: 'سعر إعادة الشراء (ساما)' }, sentiment: { en: 'Press sentiment', ar: 'معنويات الصحافة' },
  wow: { en: 'on the week', ar: 'أسبوعياً' }, yoy: { en: 'on a year ago', ar: 'سنوياً' }, m4: { en: 'over four weeks', ar: 'خلال أربعة أسابيع' }, preWar: { en: 'on pre-war', ar: 'عن ما قبل الحرب' },
  expansion: { en: 'Above 50: expanding', ar: 'فوق 50: توسّع' }, contraction: { en: 'Below 50: contracting', ar: 'دون 50: انكماش' },
  live: { en: 'live', ar: 'مباشر' }, headlines: { en: 'Headlines behind today’s reading', ar: 'العناوين وراء قراءة اليوم' },
  warTitle: { en: 'Before and since 28 February', ar: 'قبل 28 فبراير وبعده' },
  warDek: { en: 'Average of Nov 2025 to Feb 2026 against the average since.', ar: 'متوسط نوفمبر 2025 حتى فبراير 2026 مقابل المتوسط منذ ذلك الحين.' },
  colMeasure: { en: 'Measure', ar: 'المقياس' }, colBefore: { en: 'Before', ar: 'قبل' }, colSince: { en: 'Since', ar: 'منذ' }, colChange: { en: 'Change', ar: 'التغيّر' },
  method: { en: 'How this picture is made', ar: 'كيف تُبنى هذه الصورة' },
  methodLink: { en: 'Sources and status rules', ar: 'المصادر وقواعد الحالة' },
  viewData: { en: 'View the data', ar: 'عرض البيانات' }, week: { en: 'Week', ar: 'الأسبوع' },
} satisfies Record<string, L>;

function SectionHead({ pills, title, dek, lang }: { pills: { status: Parameters<typeof StatusPill>[0]['status']; name: L }[]; title: L; dek: L; lang: Lang }) {
  return (
    <header className="max-w-5xl">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {pills.map((p, i) => <span key={i} className="inline-flex items-center gap-2.5"><StatusPill status={p.status} lang={lang} /><span className="text-lg font-medium text-ink-2">{p.name[lang]}</span></span>)}
      </div>
      <h2 className="section-title mt-4">{title[lang]}</h2>
      <p className="mt-3 max-w-3xl text-lg text-ink-2">{dek[lang]}</p>
    </header>
  );
}

function DataTable({ lang, head, rows }: { lang: Lang; head: string[]; rows: (string | number)[][] }) {
  return (
    <details className="no-print mt-3 text-sm">
      <summary className="cursor-pointer text-ink-2 hover:text-ink">{C.viewData[lang]}</summary>
      <div className="mt-2 max-h-72 overflow-auto rounded-lg border border-rule">
        <table className="tnum w-full text-start">
          <thead className="sticky top-0 bg-sunken"><tr>{head.map((h) => <th key={h} className="px-3 py-1.5 text-start font-medium text-ink-2">{h}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i} className="border-t border-rule">{r.map((c, j) => <td key={j} className="px-3 py-1.5 text-ink">{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </details>
  );
}

export default async function SituationPage() {
  const lang = await currentLang();
  const s = await getSituation();
  const st = s.strategy!;
  const ar = lang === 'ar';
  const tr = (l: L) => l[lang];
  const { shelves: sh, supply: su, confidence: co, economy: ec } = s;

  const asOf = new Date(s.asOf);
  const day = asOf.toLocaleDateString(ar ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-GB', { timeZone: 'Asia/Riyadh', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const time = asOf.toLocaleTimeString('en-GB', { timeZone: 'Asia/Riyadh', hour: '2-digit', minute: '2-digit' });
  const hijri = ar ? asOf.toLocaleDateString(HIJRI_LOCALE, { timeZone: 'Asia/Riyadh', day: 'numeric', month: 'long', year: 'numeric' }) : null;
  const short = (iso: string) => fmtDate(iso, lang, { day: 'numeric', month: 'long' });
  const freshness = ar
    ? `المؤشرات الأسبوعية حتى ${short(co.asOf)}؛ أسعار الغذاء حتى ${short(sh.asOf)}؛ معنويات الصحافة حتى ${short(co.sentiment.date)}${co.sentiment.live ? ' (مباشر)' : ''}.`
    : `Weekly indicators to ${short(co.asOf)}; food prices to ${short(sh.asOf)}; press sentiment to ${short(co.sentiment.date)}${co.sentiment.live ? ' (live)' : ''}.`;
  const desk = s.alerts.filter((a) => a.fromDesk);
  const priorities: Priority[] = ['act', 'prepare', 'monitor'];
  const rule: Record<Priority, string> = { act: 'border-st-alert', prepare: 'border-st-watch', monitor: 'border-ink-3' };
  const catMax = Math.max(4, ...sh.categories.map((c) => Math.abs(c.wow)));
  const warRows = [
    { key: 'food', label: { en: 'Food index', ar: 'مؤشر الغذاء' }, pre: sh.sinceWar.foodPre, post: sh.sinceWar.foodPost, digits: 1, good: 'down' as const },
    ...ec.sinceWar.rows.map((r) => ({ key: r.key, label: { en: r.label_en, ar: r.label_ar }, pre: r.pre, post: r.post, digits: r.digits, good: (r.key === 'oil' ? 'none' : 'up') as 'up' | 'down' | 'none' })),
  ];
  const warMax = Math.max(10, ...warRows.map((r) => Math.abs(((r.post - r.pre) / Math.abs(r.pre || 1)) * 100)));
  const ex = su.exposure;

  return (
    <main>
      {/* ---------------------------------------------------------------- the bottom line */}
      <section className="wrap pb-10 pt-10 md:pt-14">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <StatusPill status={s.overall.status} lang={lang} size="lg" />
          <span className="text-lg text-ink-2">{day}, {time} {ar ? 'بتوقيت الرياض' : 'Riyadh time'}{hijri ? <span className="text-ink-3"> ({hijri})</span> : null}</span>
        </div>
        <h1 className={`mt-6 max-w-5xl font-display font-semibold tracking-tight text-ink ${ar ? 'text-5xl font-bold leading-[1.25] tracking-normal md:text-[3.5rem]' : 'text-5xl md:text-6xl lg:text-[4.5rem] lg:leading-[1]'}`}>{tr(st.headline)}</h1>
        <p className="mt-5 max-w-4xl text-2xl leading-snug text-ink-2 md:text-[1.875rem] md:leading-[1.3]">{tr(st.standfirst)}</p>
        <p className="mt-6 text-base text-ink-3">{freshness}</p>
        {desk.length > 0 && (
          <div className="mt-6 max-w-4xl border-s-4 border-accent ps-4">
            <div className="eyeline">{tr(C.fromDesk)}</div>
            <ul className="mt-1 space-y-1 text-lg">{desk.map((a, i) => <li key={i}>{ar ? a.text_ar : a.text_en}</li>)}</ul>
          </div>
        )}
      </section>

      {/* ---------------------------------------------------------------- scorecard */}
      <section className="wrap" aria-labelledby="scorecard">
        <h2 id="scorecard" className="sr-only">{tr(C.scorecard)}</h2>
        <div className="border-t-2 border-ink">
          <div className="hidden grid-cols-12 gap-6 border-b border-rule py-3 text-sm font-medium text-ink-3 lg:grid">
            <div className="col-span-3">{tr(C.colPillar)}</div><div className="col-span-2">{tr(C.colToday)}</div><div className="col-span-4">{tr(C.colMeaning)}</div><div className="col-span-3">{tr(C.colNext)}</div>
          </div>
          {st.scorecard.map((r) => (
            <div key={r.pillar} className="grid grid-cols-1 gap-x-6 gap-y-3 border-b border-rule py-6 lg:grid-cols-12 lg:items-start">
              <div className="flex items-center justify-between gap-3 lg:col-span-3 lg:block">
                <div className="text-xl font-semibold text-ink">{tr(r.name)}</div>
                <div className="lg:mt-2"><StatusPill status={r.status} lang={lang} /></div>
              </div>
              <div className="lg:col-span-2">
                <div className="figure text-4xl leading-none"><bdi dir="ltr">{r.value}</bdi></div>
                <div className="mt-1.5 text-base text-ink-2">{tr(r.unit)}</div>
              </div>
              <p className="text-lg leading-snug text-ink lg:col-span-4">{tr(r.meaning)}</p>
              <div className="lg:col-span-3">
                <div className="text-sm font-medium text-ink-3 lg:hidden">{tr(C.colNext)}</div>
                {r.next ? (
                  <>
                    <div className="mt-0.5 flex items-start gap-2 text-lg leading-snug text-ink">
                      <StatusShape status={r.next.level} size={13} className={`mt-[0.4rem] ${r.next.level === 'critical' ? 'text-st-critical' : r.next.level === 'alert' ? 'text-st-alert' : 'text-st-watch'}`} />
                      <span>{tr(r.next.text)}</span>
                    </div>
                    <div className="mt-1 ps-[1.3rem] text-base text-ink-3">{tr(r.next.now)}</div>
                  </>
                ) : <div className="text-lg text-ink-3">{tr(C.noNext)}</div>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- decisions */}
      <section className="wrap mt-20" aria-labelledby="decisions">
        <h2 id="decisions" className="section-title">{tr(C.decisions)}</h2>
        <p className="mt-3 max-w-3xl text-lg text-ink-2">{tr(C.decisionsDek)}</p>
        <div className="mt-10 grid gap-10 lg:grid-cols-3 lg:gap-8">
          {priorities.map((p) => {
            const items = st.decisions.filter((d) => d.priority === p);
            return (
              <div key={p} className={`border-t-4 pt-4 ${rule[p]}`}>
                <PriorityMark priority={p} label={tr(PRIORITY_LABEL[p])} />
                {items.length ? (
                  <ol className="mt-5 space-y-8">
                    {items.map((d) => (
                      <li key={d.id}>
                        <h3 className="text-[1.375rem] font-semibold leading-snug text-ink">{tr(d.title)}</h3>
                        <p className="mt-2 text-base leading-relaxed text-ink-2">{tr(d.body)}</p>
                        <div className="mt-2 text-sm text-ink-3">{tr(PILLAR_NAME[d.pillar])}</div>
                      </li>
                    ))}
                  </ol>
                ) : <p className="mt-5 text-base text-ink-3">{tr(C.nothing)}</p>}
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------------------------------------------------------------- supply and routes */}
      <section className="wrap mt-24" id="supply">
        <SectionHead lang={lang} pills={[{ status: su.status, name: PILLAR_NAME.supply }]} title={st.sections.supply.title} dek={st.sections.supply.dek} />
        <div className="mt-10 grid gap-10 lg:grid-cols-12">
          <figure className="min-w-0 lg:col-span-8">
            <div className="overflow-x-auto rounded-2xl border border-rule bg-sea">
              <div className="min-w-[600px]"><GulfMap lang={lang} state={su.hormuz.state} title={tr(C.mapTitle)} /></div>
            </div>
            <figcaption className="mt-4 space-y-2 text-base text-ink-2">
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <span className="inline-flex items-center gap-2"><svg width="34" height="8" aria-hidden><line x1="2" y1="4" x2="32" y2="4" stroke={su.hormuz.state === 'closed' ? '#d03b3b' : su.hormuz.state === 'restricted' ? '#ec835a' : '#0ca30c'} strokeWidth="3.5" strokeDasharray={su.hormuz.state === 'open' ? undefined : '8 5'} strokeLinecap="round" /></svg>{tr(C.lgHormuz)}: {ar ? { open: 'مفتوح', restricted: 'مقيّد', closed: 'مغلق' }[su.hormuz.state] : su.hormuz.state}</span>
                <span className="inline-flex items-center gap-2"><svg width="34" height="8" aria-hidden><line x1="2" y1="4" x2="32" y2="4" stroke="#0ca30c" strokeWidth="3" strokeLinecap="round" /></svg>{tr(C.lgOpen)}</span>
                <span className="inline-flex items-center gap-2"><svg width="34" height="8" aria-hidden><line x1="2" y1="4" x2="32" y2="4" stroke="rgb(var(--accent))" strokeWidth="3" strokeLinecap="round" /></svg>{tr(C.lgRoad)}</span>
              </div>
              <p className="text-sm text-ink-3">{tr(C.mapNote)}{su.hormuz.note_en ? ` ${ar ? su.hormuz.note_ar : su.hormuz.note_en}` : ''}</p>
            </figcaption>
          </figure>
          <div className="space-y-10 lg:col-span-4">
            <Figure value={`${f(ex.importsViaHormuzPct)}%`} label={tr(C.importsVia)} note={ar ? `${f(ex.importsViaHormuzUsdB, 0)} من ${f(ex.importsTotalUsdB, 0)} مليار دولار سنوياً، كومتريد ${ex.comtradeYear}` : `$${f(ex.importsViaHormuzUsdB, 0)}B of $${f(ex.importsTotalUsdB, 0)}B a year, UN Comtrade ${ex.comtradeYear}`} />
            <Figure value={ex.criticalProducts.toLocaleString('en-US')} label={tr(C.critical)} note={ar ? `من أصل ${ex.productsCovered.toLocaleString('en-US')} منتجاً مستورداً` : `of ${ex.productsCovered.toLocaleString('en-US')} products imported`} />
            <Figure value={`${f(ex.foodViaHormuzPct)}%`} label={tr(C.foodVia)} note={ar ? `${f(ex.foodViaHormuzUsdB, 1)} من ${f(ex.foodImportsUsdB, 1)} مليار دولار` : `$${f(ex.foodViaHormuzUsdB, 1)}B of $${f(ex.foodImportsUsdB, 1)}B`} />
          </div>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-8">
            <h3 className="text-2xl font-semibold text-ink">{tr(C.portTitle)}</h3>
            <div className="mt-4">
              <TrendChart lang={lang} title={tr(C.portTitle)} data={su.portCalls.series.map((p) => ({ date: p.date, calls: p.value as number }))} series={[{ key: 'calls', label: tr(C.portLabel), color: 'series-1' }]}
                digits={0} yDomain={[0, 'auto']} refY={{ y: su.portCalls.avg2025, label: `${tr(C.avg2025)}: ${su.portCalls.avg2025}` }} event={{ date: s.provenance.warStart, label: tr(C.event) }} />
            </div>
            <DataTable lang={lang} head={[tr(C.week), tr(C.portLabel)]} rows={su.portCalls.series.slice(-12).reverse().map((p) => [fmtDate(p.date, lang, { day: 'numeric', month: 'short', year: 'numeric' }), p.value ?? '—'])} />
          </div>
          <div className="lg:col-span-4">
            <h3 className="text-2xl font-semibold text-ink">{tr(C.corridors)}</h3>
            <p className="mt-1 text-base text-ink-2">{tr(C.corridorsDek)}</p>
            <ul className="mt-4 divide-y divide-rule border-y border-rule">
              {su.corridors.map((c) => (
                <li key={c.id} className="py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-lg font-semibold text-ink">{tr(c.name)}</span>
                    <span className="tnum shrink-0 text-base text-ink">{c.days} {tr(C.days)}</span>
                  </div>
                  <div className="mt-0.5 flex items-baseline justify-between gap-3 text-sm text-ink-3">
                    <span>{tr(c.via)}</span>
                    <span className="tnum shrink-0">{c.km ? `${c.km.toLocaleString('en-US')} ${ar ? 'كم' : 'km'}` : ''}{c.cost ? (ar ? `، ${costAr(c.cost)}` : `, ${c.cost}`) : ''}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16">
          <h3 className="text-2xl font-semibold text-ink">{tr(C.exposedTitle)}</h3>
          <p className="mt-2 max-w-4xl text-lg text-ink-2">{tr(C.exposedDek)}</p>
          <div className="mt-6 border-t-2 border-ink">
            <div className="hidden grid-cols-12 gap-6 border-b border-rule py-3 text-sm font-medium text-ink-3 lg:grid">
              <div className="col-span-3">{tr(C.colProduct)}</div><div className="col-span-3">{tr(C.colThrough)}</div><div className="col-span-2">{tr(C.colMain)}</div><div className="col-span-4">{tr(C.colOption)}</div>
            </div>
            {su.topAtRisk.map((p) => {
              const existing = p.options.filter((o) => !o.suggested && o.usdM > 0);
              const suggested = p.options.filter((o) => o.suggested).slice(0, 2);
              return (
                <div key={p.hs6} className="grid grid-cols-1 gap-x-6 gap-y-2 border-b border-rule py-5 lg:grid-cols-12">
                  <div className="lg:col-span-3">
                    <div className="text-lg font-semibold leading-snug text-ink">{ar ? p.product_ar ?? p.product : p.product}</div>
                    <div className="tnum text-sm text-ink-3">HS {p.hs6}</div>
                  </div>
                  <div className="lg:col-span-3">
                    <div className="flex items-baseline gap-2"><span className="figure text-2xl">{usd(p.hormuzUsdM, lang)}</span><span className="text-base text-ink-2"><bdi dir="ltr">{f(p.hormuzPct, 0)}%</bdi> {tr(C.ofImports)}</span></div>
                    <div className="mt-2 max-w-[16rem]"><Meter pct={p.hormuzPct} label={`${f(p.hormuzPct, 0)}%`} /></div>
                  </div>
                  <div className="text-base text-ink lg:col-span-2">{ar ? p.mainSource_ar ?? p.mainSource : p.mainSource}<span className="text-ink-2">{ar ? '، ' : ', '}<bdi dir="ltr">{f(p.mainShare, 0)}%</bdi></span></div>
                  <div className="text-base leading-snug text-ink lg:col-span-4">
                    {p.atScale && existing.length ? (
                      <>
                        {existing.slice(0, 2).map((o, i) => (
                          <div key={i}>{ar ? o.country_ar ?? o.country : o.country} <span className="text-ink-2">{tr(C.already)} {usd(o.usdM, lang)}{o.days ? (ar ? `، ${o.port === 'Jeddah' ? 'جدة' : o.port} خلال ${o.days} يوماً` : `, ${o.port ?? 'Jeddah'} in ${o.days} days`) : ''}</span></div>
                        ))}
                        {suggested.length > 0 && <div className="mt-1 text-sm text-ink-3">{tr(C.suggested)}: {suggested.map((o) => `${ar ? o.country_ar ?? o.country : o.country}${o.days ? ` (${o.days} ${tr(C.days)})` : ''}`).join(ar ? '، ' : ', ')}</div>}
                      </>
                    ) : <span className="text-ink-2">{tr(C.noScale)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- prices and shelves */}
      <section className="wrap mt-24" id="prices">
        <SectionHead lang={lang} pills={[{ status: sh.status, name: PILLAR_NAME.shelves }]} title={st.sections.shelves.title} dek={st.sections.shelves.dek} />
        <div className="mt-10 grid gap-12 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-7">
            <h3 className="text-2xl font-semibold text-ink">{tr(C.foodChart)}</h3>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-base text-ink-2">
              <span className="inline-flex items-center gap-2"><span className="inline-block h-[3px] w-6 rounded bg-s1" />{tr(C.food)}</span>
              <span className="inline-flex items-center gap-2"><span className="inline-block h-[3px] w-6 rounded bg-ctx" />{tr(C.cpi)}</span>
            </div>
            <div className="mt-2">
              <TrendChart lang={lang} title={tr(C.foodChart)} data={sh.series.map((p) => ({ date: p.date, food: p.food, cpi: p.cpi }))}
                series={[{ key: 'cpi', label: tr(C.cpi), color: 'context', endLabel: false }, { key: 'food', label: tr(C.food), color: 'series-1', width: 2.5 }]}
                refY={{ y: 100, label: '' }} event={{ date: s.provenance.warStart, label: tr(C.event) }} />
            </div>
            <DataTable lang={lang} head={[tr(C.week), tr(C.food), tr(C.cpi)]} rows={sh.series.slice(-12).reverse().map((p) => [fmtDate(p.date, lang, { day: 'numeric', month: 'short', year: 'numeric' }), f(p.food), f(p.cpi)])} />
          </div>
          <div className="min-w-0 lg:col-span-5">
            <h3 className="text-2xl font-semibold text-ink">{tr(C.catTitle)}</h3>
            <div className="mt-4 border-t-2 border-ink">
              <div className="grid grid-cols-12 gap-3 border-b border-rule py-2 text-sm font-medium text-ink-3">
                <div className="col-span-5">{tr(C.colCat)}</div><div className="col-span-2 text-end">{tr(C.colIdx)}</div><div className="col-span-5">{tr(C.colWow)}</div>
              </div>
              {sh.categories.map((c) => (
                <div key={c.key} className="grid grid-cols-12 items-center gap-3 border-b border-rule py-2.5">
                  <div className="col-span-5">
                    <div className="text-base leading-tight text-ink">{ar ? c.label_ar : c.label_en}</div>
                    <div className="mt-1"><Grade g={c.hormuz} lang={lang} /></div>
                  </div>
                  <div className="tnum col-span-2 text-end text-base text-ink-2">{f(c.value)}</div>
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="flex-1"><DivBar value={c.wow} max={catMax} label={`${signed(c.wow)}%`} /></div>
                    <span className={`tnum w-14 shrink-0 text-end text-base font-semibold ${c.wow > 0 ? 'delta-bad' : c.wow < 0 ? 'delta-good' : 'text-ink'}`}><bdi dir="ltr">{signed(c.wow)}%</bdi></span>
                  </div>
                </div>
              ))}
              <p className="mt-2 text-sm text-ink-3">{ar ? 'الأعمدة الثلاثة: درجة اعتماد الفئة على هرمز وفق المنصة.' : 'The three bars grade how much each category depends on Hormuz, as rated by the platform.'}</p>
            </div>
          </div>
        </div>
        <div className="mt-12 grid gap-8 border-t border-rule pt-8 md:grid-cols-3">
          <Figure value={`${sh.basket.directProducts}`} label={ar ? `منتجاً من أصل ${sh.productsTracked} تُشحن مباشرة عبر هرمز` : `of ${sh.productsTracked} tracked products ship direct through Hormuz`} note={ar ? `${f(sh.basket.directWeightPct)}% من وزن السلة` : `${f(sh.basket.directWeightPct)}% of basket weight`} />
          <Figure value={`${sh.basket.rawMaterialRiskProducts}`} label={ar ? 'منتجاً يعتمد على مواد خام مستوردة معرّضة' : 'depend on imported raw materials at risk'} note={ar ? `${f(sh.basket.rawMaterialRiskWeightPct)}% من وزن السلة` : `${f(sh.basket.rawMaterialRiskWeightPct)}% of basket weight`} />
          <div className="text-base text-ink-2">
            <div className="eyeline">{tr(C.basket)}</div>
            <p className="mt-2">{sh.basket.direct.slice(0, 4).map((p) => `${p.product.split(/[,(]/)[0].trim()} (${p.origin})`).join(ar ? '؛ ' : '; ')}.</p>
            <p className="mt-3 text-sm text-ink-3">{tr(C.stockouts)}</p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- growth, markets and confidence */}
      <section className="wrap mt-24" id="growth">
        <SectionHead lang={lang} pills={[{ status: ec.status, name: PILLAR_NAME.economy }, { status: co.status, name: PILLAR_NAME.confidence }]} title={st.sections.growth.title} dek={st.sections.growth.dek} />
        <div className="mt-10 grid gap-12 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-7">
            <h3 className="text-2xl font-semibold text-ink">{tr(C.gdpChart)}</h3>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-base text-ink-2">
              <span className="inline-flex items-center gap-2"><span className="inline-block h-[3px] w-6 rounded bg-s1" />{tr(C.total)}</span>
              <span className="inline-flex items-center gap-2"><span className="inline-block h-[3px] w-6 rounded bg-s2" />{tr(C.nonOil)}</span>
            </div>
            <div className="mt-2">
              <TrendChart lang={lang} title={tr(C.gdpChart)} data={ec.gdp.series} digits={2} prefix="$"
                series={[{ key: 'total', label: tr(C.total), color: 'series-1' }, { key: 'nonOil', label: tr(C.nonOil), color: 'series-2' }]}
                event={{ date: s.provenance.warStart, label: tr(C.event) }} />
            </div>
            <DataTable lang={lang} head={[tr(C.week), tr(C.total), tr(C.nonOil)]} rows={ec.gdp.series.slice(-12).reverse().map((p) => [fmtDate(p.date, lang, { day: 'numeric', month: 'short', year: 'numeric' }), `$${f(p.total, 2)}T`, `$${f(p.nonOil, 2)}T`])} />
          </div>
          <div className="grid grid-cols-2 content-start gap-x-6 gap-y-7 lg:col-span-5">
            <Kpi label={tr(C.spending)} value={f(ec.spending.value)} delta={ec.spending.yoy} good="up" period={tr(C.yoy)} trend={ec.spending.trend} />
            <Kpi label={tr(C.employment)} value={f(ec.employment.value)} delta={ec.employment.wow} good="up" period={tr(C.wow)} trend={ec.employment.trend} />
            <Kpi label={tr(C.pmi)} value={f(ec.pmi)} note={ec.pmi >= 50 ? tr(C.expansion) : tr(C.contraction)} trend={ec.pmiTrend} />
            <Kpi label={tr(C.invest)} value={f(co.investment.value)} delta={co.investment.wow} good="up" period={tr(C.wow)} />
            <Kpi label={tr(C.brent)} value={`$${f(co.brent.value)}`} delta={co.brent.vsPreWar} good="none" period={tr(C.preWar)} trend={co.brentTrend} />
            <Kpi label={tr(C.tasi)} value={co.tasi.value.toLocaleString('en-US')} delta={co.tasi.m4} good="up" period={tr(C.m4)} trend={co.tasiTrend} />
            <Kpi label={tr(C.sama)} value={`${f(co.samaRate, 2)}%`} />
            <Kpi label={`${tr(C.sentiment)}${co.sentiment.live ? `, ${tr(C.live)}` : ''}`} value={signed(co.sentiment.score, 2)} note={ar ? BAND_AR[co.sentiment.band] ?? co.sentiment.band : co.sentiment.band} trend={co.sentiment.trend.map((p) => ({ date: p.date, value: p.score }))} zero />
          </div>
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-7">
            <h3 className="text-2xl font-semibold text-ink">{tr(C.warTitle)}</h3>
            <p className="mt-1 text-base text-ink-2">{tr(C.warDek)}</p>
            <div className="mt-4 border-t-2 border-ink">
              <div className="grid grid-cols-12 gap-3 border-b border-rule py-2 text-sm font-medium text-ink-3">
                <div className="col-span-4">{tr(C.colMeasure)}</div><div className="col-span-2 text-end">{tr(C.colBefore)}</div><div className="col-span-2 text-end">{tr(C.colSince)}</div><div className="col-span-4">{tr(C.colChange)}</div>
              </div>
              {warRows.map((r) => {
                const ch = r.pre ? ((r.post - r.pre) / Math.abs(r.pre)) * 100 : 0;
                return (
                  <div key={r.key} className="grid grid-cols-12 items-center gap-3 border-b border-rule py-2.5">
                    <div className="col-span-4 text-base text-ink">{tr(r.label)}</div>
                    <div className="tnum col-span-2 text-end text-base text-ink-2">{f(r.pre, r.digits)}</div>
                    <div className="tnum col-span-2 text-end text-base font-semibold text-ink">{f(r.post, r.digits)}</div>
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="flex-1"><DivBar value={ch} max={warMax} label={`${signed(ch, 0)}%`} /></div>
                      <span className={`tnum w-12 shrink-0 text-end text-base font-semibold ${r.good === 'none' || Math.round(ch) === 0 ? 'text-ink' : (r.good === 'up') === ch > 0 ? 'delta-good' : 'delta-bad'}`}><bdi dir="ltr">{signed(ch, 0)}%</bdi></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="lg:col-span-5">
            <h3 className="text-2xl font-semibold text-ink">{tr(C.headlines)}</h3>
            <p className="mt-1 text-base text-ink-2">{fmtDate(co.sentiment.date, lang)}{co.sentiment.headlineCount ? (ar ? `، ${co.sentiment.headlineCount} عنواناً` : `, ${co.sentiment.headlineCount} headlines`) : ''}</p>
            {co.sentiment.headlines.length > 0 ? (
              <ul className="mt-4 divide-y divide-rule border-y border-rule">
                {co.sentiment.headlines.slice(0, 6).map((h, i) => (
                  <li key={i} className="flex gap-3 py-3 text-base leading-snug" dir="auto">
                    <span className={`mt-[0.45rem] h-2.5 w-2.5 shrink-0 rounded-full ${h.sentiment === 'negative' ? 'bg-st-critical' : h.sentiment === 'positive' ? 'bg-st-normal' : 'bg-ink-3'}`} aria-label={h.sentiment ?? ''} />
                    <span className="text-ink">{h.headline}{h.source ? <span className="text-ink-3"> ({h.source})</span> : null}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-4 text-base text-ink-3">{ar ? 'تظهر العناوين عند وصول التغذية المباشرة.' : 'Headlines appear when the live feed is connected.'}</p>}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- method */}
      <section className="wrap mt-24 pb-6">
        <div className="border-t border-rule pt-8">
          <h2 className="text-2xl font-semibold text-ink">{tr(C.method)}</h2>
          <ul className="mt-4 grid max-w-6xl gap-x-10 gap-y-2 text-base text-ink-2 md:grid-cols-2">
            <li>{freshness}</li>
            <li>{ar ? `تعرّض الواردات من بيانات كومتريد الأممية لعام ${ex.comtradeYear} عبر المنصة السعودية (${ex.productsCovered.toLocaleString('en-US')} منتجاً).` : `Import exposure from UN Comtrade ${ex.comtradeYear} via the KSA platform (${ex.productsCovered.toLocaleString('en-US')} products).`}</li>
            <li>{ar ? 'الناتج المحلي تقدير آني مركّب من المنصة، وليس الأرقام الفصلية الرسمية للهيئة العامة للإحصاء.' : 'GDP is the platform’s composite nowcast, not GASTAT’s official quarterly figure.'}</li>
            <li>{ar ? 'حالة مضيق هرمز مُدخل يحدّده المكتب كل صباح؛ بقية الحالات تُحسب من القواعد المنشورة.' : 'The Hormuz status is a desk input set each morning; every other status is computed from published rules.'}</li>
          </ul>
          <Link href="/modules" className="link mt-5 inline-block text-lg">{tr(C.methodLink)}</Link>
        </div>
      </section>
    </main>
  );
}

import { currentLang } from '@/lib/auth';
import { getSituation } from '@/lib/situation';
import { fmtDate } from '@/lib/i18n';
import { PILLAR_NAME } from '@/lib/strategy';
import type { L, Lang } from '@/lib/types';
import MonitorHead, { DataTable, Legend, Panel } from '@/components/MonitorHead';
import TrendChart from '@/components/TrendChart';
import GulfMap from '@/components/GulfMap';
import StatusPill from '@/components/StatusPill';
import { DivBar, Figure, Grade, Meter } from '@/components/Figures';

export const revalidate = 900;

const f = (n: number, d = 1) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const signed = (n: number, d = 1) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${f(Math.abs(n), d)}`;
const usd = (m: number, lang: Lang) => (m >= 1000 ? (lang === 'ar' ? `${f(m / 1000, 1)} مليار دولار` : `$${f(m / 1000, 1)}B`) : lang === 'ar' ? `${f(m, 0)} مليون دولار` : `$${f(m, 0)}M`);
const costAr = (c: string) => `${c.replace('$', '').replace('/t', '')} دولاراً للطن`;

const C = {
  foodChart: { en: 'Food index and overall CPI, weekly, base 100', ar: 'مؤشر الغذاء والمؤشر العام، أسبوعياً، الأساس 100' },
  food: { en: 'Food index', ar: 'مؤشر الغذاء' }, cpi: { en: 'Overall CPI', ar: 'المؤشر العام' },
  event: { en: '28 Feb: Hormuz disrupted', ar: '28 فبراير: اضطراب هرمز' }, week: { en: 'Week', ar: 'الأسبوع' },
  catTitle: { en: 'Food categories this week', ar: 'فئات الغذاء هذا الأسبوع' },
  colCat: { en: 'Category', ar: 'الفئة' }, colIdx: { en: 'Index', ar: 'المؤشر' }, colWow: { en: 'Week on week', ar: 'أسبوعياً' },
  gradeNote: { en: 'The three bars grade how much each category depends on Hormuz, as rated by the platform.', ar: 'الأعمدة الثلاثة: درجة اعتماد الفئة على هرمز وفق المنصة.' },
  basket: { en: 'The tracked basket', ar: 'السلة المتابَعة' },
  stockouts: { en: 'Stock-outs are not tracked yet. They need an availability flag in the retail price scraper.', ar: 'نفاد المخزون غير متابَع بعد، ويتطلب مؤشر توافر في جامع أسعار التجزئة.' },
  products: { en: 'Products intelligence', ar: 'ذكاء المنتجات' },
  productsDek: { en: 'Which imports depend on the strait, who else already ships them, and which way in stays open.', ar: 'أيّ الواردات تعتمد على المضيق، ومَن يشحنها فعلاً غيره، وأيّ المداخل يبقى مفتوحاً.' },
  importsVia: { en: 'of the Kingdom’s imports pass Hormuz', ar: 'من واردات المملكة تمرّ عبر هرمز' },
  critical: { en: 'critical products, over 70% through the strait', ar: 'منتجاً حرجاً، أكثر من 70% منها عبر المضيق' },
  foodVia: { en: 'of food imports pass Hormuz', ar: 'من واردات الغذاء تمرّ عبر هرمز' },
  exposedTitle: { en: 'Food imports most exposed to Hormuz', ar: 'واردات الغذاء الأكثر تعرضاً لهرمز' },
  exposedDek: { en: 'In the platform’s route model these land at Dammam through the strait. The same cargo can land at the Red Sea ports.', ar: 'في نموذج المسارات لدى المنصة، تصل هذه الواردات إلى الدمام عبر المضيق، ويمكن للشحنات نفسها أن تصل إلى موانئ البحر الأحمر.' },
  colProduct: { en: 'Product', ar: 'المنتج' }, colThrough: { en: 'Through Hormuz a year', ar: 'عبر هرمز سنوياً' }, colMain: { en: 'Main supplier', ar: 'المورد الرئيسي' }, colOption: { en: 'Hormuz-free option', ar: 'بديل دون هرمز' },
  already: { en: 'already ships', ar: 'تشحن فعلاً' }, suggested: { en: 'Suggested', ar: 'مقترح' }, noScale: { en: 'No alternative supplier at scale; stock and re-routing are the hedge.', ar: 'لا مورد بديلاً بحجم كافٍ؛ المخزون وإعادة التوجيه هما صمام الأمان.' },
  ofImports: { en: 'of imports', ar: 'من الواردات' }, days: { en: 'days', ar: 'أيام' },
  mapTitle: { en: 'The Kingdom between two seas: shipping lanes, ports and the roads east', ar: 'المملكة بين بحرين: ممرات الملاحة والموانئ والطرق نحو الشرق' },
  lgHormuz: { en: 'Shipping lane through Hormuz', ar: 'ممر الملاحة عبر هرمز' }, lgOpen: { en: 'Lanes that avoid Hormuz', ar: 'ممرات تتجنب هرمز' }, lgRoad: { en: 'Roads into the Kingdom and on to the Eastern Province', ar: 'طرق الدخول إلى المملكة ونحو المنطقة الشرقية' },
  mapNote: { en: 'Schematic, not to scale. Routes as modelled by the KSA platform. The Hormuz status is set by the desk each morning.', ar: 'رسم تخطيطي غير مطابق للمقياس. المسارات وفق نموذج المنصة السعودية، وحالة هرمز يحدّدها المكتب كل صباح.' },
  corridors: { en: 'Ways in that avoid Hormuz', ar: 'مسارات دخول تتجنب هرمز' }, corridorsDek: { en: 'Road distance, time and cost on to the Eastern Province.', ar: 'المسافة البرية والمدة والتكلفة حتى المنطقة الشرقية.' },
  portTitle: { en: 'Port calls a week since January 2025', ar: 'رسو السفن أسبوعياً منذ يناير 2025' }, portLabel: { en: 'Port calls', ar: 'رسو السفن' }, avg2025: { en: '2025 average', ar: 'متوسط 2025' },
} satisfies Record<string, L>;

export default async function InflationMonitor() {
  const lang = await currentLang();
  const s = await getSituation();
  const ar = lang === 'ar';
  const tr = (l: L) => l[lang];
  const sh = s.shelves, su = s.supply, ex = su.exposure;
  const row = s.strategy!.scorecard.find((r) => r.pillar === 'shelves');
  const catMax = Math.max(4, ...sh.categories.map((c) => Math.abs(c.wow)));
  const hormuzWord = ar ? { open: 'مفتوح', restricted: 'مقيّد', closed: 'مغلق' }[su.hormuz.state] : su.hormuz.state;

  return (
    <main className="pb-12">
      <MonitorHead s={s} lang={lang} id="inflation" meaning={row?.meaning} />

      {/* ---------------------------------------------------------------- prices */}
      <div className="wrap mt-12 grid gap-12 lg:grid-cols-12">
        <Panel className="lg:col-span-7" title={tr(C.foodChart)}>
          <Legend items={[{ label: tr(C.food), color: 's1' }, { label: tr(C.cpi), color: 'ctx' }]} />
          <div className="mt-2">
            <TrendChart lang={lang} title={tr(C.foodChart)} data={sh.series.map((p) => ({ date: p.date, food: p.food, cpi: p.cpi }))}
              series={[{ key: 'cpi', label: tr(C.cpi), color: 'context', endLabel: false }, { key: 'food', label: tr(C.food), color: 'series-1', width: 2.5 }]}
              refY={{ y: 100, label: '' }} event={{ date: s.provenance.warStart, label: tr(C.event) }} />
          </div>
          <DataTable lang={lang} head={[tr(C.week), tr(C.food), tr(C.cpi)]} rows={sh.series.slice(-12).reverse().map((p) => [fmtDate(p.date, lang, { day: 'numeric', month: 'short', year: 'numeric' }), f(p.food), f(p.cpi)])} />
          <div className="mt-8 grid gap-8 border-t border-rule pt-6 sm:grid-cols-2">
            <Figure value={`${sh.basket.directProducts}`} label={ar ? `منتجاً من أصل ${sh.productsTracked} تُشحن مباشرة عبر هرمز` : `of ${sh.productsTracked} tracked products ship direct through Hormuz`} note={ar ? `${f(sh.basket.directWeightPct)}% من وزن السلة` : `${f(sh.basket.directWeightPct)}% of basket weight`} />
            <Figure value={`${sh.basket.rawMaterialRiskProducts}`} label={ar ? 'منتجاً يعتمد على مواد خام مستوردة معرّضة' : 'depend on imported raw materials at risk'} note={ar ? `${f(sh.basket.rawMaterialRiskWeightPct)}% من وزن السلة` : `${f(sh.basket.rawMaterialRiskWeightPct)}% of basket weight`} />
          </div>
          <div className="mt-6 text-base text-ink-2">
            <div className="eyeline">{tr(C.basket)}</div>
            <p className="mt-1">{sh.basket.direct.slice(0, 4).map((p) => `${p.product.split(/[,(]/)[0].trim()} (${p.origin})`).join(ar ? '؛ ' : '; ')}.</p>
            <p className="mt-2 text-sm text-ink-3">{tr(C.stockouts)}</p>
          </div>
        </Panel>
        <Panel className="lg:col-span-5" title={tr(C.catTitle)}>
          <div className="border-t-2 border-ink">
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
            <p className="mt-2 text-sm text-ink-3">{tr(C.gradeNote)}</p>
          </div>
        </Panel>
      </div>

      {/* ---------------------------------------------------------------- products intelligence */}
      <section className="wrap mt-16 border-t-2 border-ink pt-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h2 className="section-title">{tr(C.products)}</h2>
          <span className="inline-flex items-center gap-2.5"><StatusPill status={su.status} lang={lang} /><span className="text-base text-ink-2">{tr(PILLAR_NAME.supply)}{ar ? '؛ هرمز ' : '; Hormuz '}{hormuzWord}</span></span>
        </div>
        <p className="mt-2 max-w-3xl text-lg text-ink-2">{tr(C.productsDek)}</p>

        <div className="mt-8 grid gap-8 md:grid-cols-3">
          <Figure value={`${f(ex.importsViaHormuzPct)}%`} label={tr(C.importsVia)} note={ar ? `${f(ex.importsViaHormuzUsdB, 0)} من ${f(ex.importsTotalUsdB, 0)} مليار دولار سنوياً، كومتريد ${ex.comtradeYear}` : `$${f(ex.importsViaHormuzUsdB, 0)}B of $${f(ex.importsTotalUsdB, 0)}B a year, UN Comtrade ${ex.comtradeYear}`} />
          <Figure value={ex.criticalProducts.toLocaleString('en-US')} label={tr(C.critical)} note={ar ? `من أصل ${ex.productsCovered.toLocaleString('en-US')} منتجاً مستورداً` : `of ${ex.productsCovered.toLocaleString('en-US')} products imported`} />
          <Figure value={`${f(ex.foodViaHormuzPct)}%`} label={tr(C.foodVia)} note={ar ? `${f(ex.foodViaHormuzUsdB, 1)} من ${f(ex.foodImportsUsdB, 1)} مليار دولار` : `$${f(ex.foodViaHormuzUsdB, 1)}B of $${f(ex.foodImportsUsdB, 1)}B`} />
        </div>

        <div className="mt-12">
          <h3 className="text-2xl font-semibold text-ink">{tr(C.exposedTitle)}</h3>
          <p className="mt-1 max-w-3xl text-base text-ink-2">{tr(C.exposedDek)}</p>
          <div className="mt-5 border-t-2 border-ink">
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

        <div className="mt-14 grid gap-10 lg:grid-cols-12">
          <figure className="min-w-0 lg:col-span-7">
            <div className="overflow-x-auto rounded-2xl border border-rule bg-sea">
              <div className="min-w-[600px]"><GulfMap lang={lang} state={su.hormuz.state} title={tr(C.mapTitle)} /></div>
            </div>
            <figcaption className="mt-4 space-y-2 text-base text-ink-2">
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <span className="inline-flex items-center gap-2"><svg width="34" height="8" aria-hidden><line x1="2" y1="4" x2="32" y2="4" stroke={su.hormuz.state === 'closed' ? '#d03b3b' : su.hormuz.state === 'restricted' ? '#ec835a' : '#0ca30c'} strokeWidth="3.5" strokeDasharray={su.hormuz.state === 'open' ? undefined : '8 5'} strokeLinecap="round" /></svg>{tr(C.lgHormuz)}: {hormuzWord}</span>
                <span className="inline-flex items-center gap-2"><svg width="34" height="8" aria-hidden><line x1="2" y1="4" x2="32" y2="4" stroke="#0ca30c" strokeWidth="3" strokeLinecap="round" /></svg>{tr(C.lgOpen)}</span>
                <span className="inline-flex items-center gap-2"><svg width="34" height="8" aria-hidden><line x1="2" y1="4" x2="32" y2="4" stroke="rgb(var(--accent))" strokeWidth="3" strokeLinecap="round" /></svg>{tr(C.lgRoad)}</span>
              </div>
              <p className="text-sm text-ink-3">{tr(C.mapNote)}{su.hormuz.note_en ? ` ${ar ? su.hormuz.note_ar : su.hormuz.note_en}` : ''}</p>
            </figcaption>
          </figure>
          <div className="lg:col-span-5">
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
            <h3 className="mt-10 text-2xl font-semibold text-ink">{tr(C.portTitle)}</h3>
            <div className="mt-3">
              <TrendChart lang={lang} title={tr(C.portTitle)} height={240} data={su.portCalls.series.map((p) => ({ date: p.date, calls: p.value as number }))} series={[{ key: 'calls', label: tr(C.portLabel), color: 'series-1' }]}
                digits={0} yDomain={[0, 'auto']} refY={{ y: su.portCalls.avg2025, label: `${tr(C.avg2025)}: ${su.portCalls.avg2025}` }} event={{ date: s.provenance.warStart, label: tr(C.event) }} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

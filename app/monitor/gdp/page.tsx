import { currentLang } from '@/lib/auth';
import { getSituation } from '@/lib/situation';
import { fmtDate } from '@/lib/i18n';
import type { L } from '@/lib/types';
import MonitorHead, { DataTable, Legend, Panel } from '@/components/MonitorHead';
import TrendChart from '@/components/TrendChart';
import { DivBar, Kpi } from '@/components/Figures';

export const revalidate = 900;

const f = (n: number, d = 1) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const signed = (n: number, d = 1) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${f(Math.abs(n), d)}`;

const C = {
  chart: { en: 'GDP nowcast, annualised, $ trillion', ar: 'تقدير الناتج الآني السنوي، تريليون دولار' },
  total: { en: 'Total', ar: 'الإجمالي' }, nonOil: { en: 'Non-oil', ar: 'غير النفطي' }, oil: { en: 'Oil', ar: 'النفطي' },
  event: { en: '28 Feb: Hormuz disrupted', ar: '28 فبراير: اضطراب هرمز' },
  week: { en: 'Week', ar: 'الأسبوع' },
  drivers: { en: 'What is moving it', ar: 'ما الذي يحرّكه' },
  momentum: { en: 'Four-week momentum', ar: 'زخم أربعة أسابيع' }, oilShare: { en: 'Oil share of GDP', ar: 'حصة النفط من الناتج' },
  pmi: { en: 'PMI', ar: 'مؤشر مديري المشتريات' }, employment: { en: 'Employment', ar: 'التوظيف' }, invest: { en: 'Investment confidence', ar: 'ثقة الاستثمار' }, brent: { en: 'Brent, $ a barrel', ar: 'برنت، دولار للبرميل' },
  wow: { en: 'on the week', ar: 'أسبوعياً' }, preWar: { en: 'on pre-war', ar: 'عن ما قبل الحرب' },
  expansion: { en: 'Above 50: expanding', ar: 'فوق 50: توسّع' }, contraction: { en: 'Below 50: contracting', ar: 'دون 50: انكماش' },
  warTitle: { en: 'Before and since 28 February', ar: 'قبل 28 فبراير وبعده' },
  warDek: { en: 'Average of Nov 2025 to Feb 2026 against the average since.', ar: 'متوسط نوفمبر 2025 حتى فبراير 2026 مقابل المتوسط منذ ذلك الحين.' },
  colMeasure: { en: 'Measure', ar: 'المقياس' }, colBefore: { en: 'Before', ar: 'قبل' }, colSince: { en: 'Since', ar: 'منذ' }, colChange: { en: 'Change', ar: 'التغيّر' },
  ledger: { en: 'The annual ledger', ar: 'السجل السنوي' },
  ledgerDek: { en: 'Yearly averages of the weekly nowcast; the current year to date.', ar: 'متوسطات سنوية للتقدير الأسبوعي؛ والسنة الحالية حتى تاريخه.' },
  year: { en: 'Year', ar: 'السنة' }, portCalls: { en: 'Port calls a week', ar: 'رسو السفن أسبوعياً' }, spending: { en: 'Spending index', ar: 'مؤشر الإنفاق' },
  reading: { en: 'Read momentum against PMI and non-oil output: GDP can rise on oil while the non-oil economy slows, and the room flags the second before the first hides it.', ar: 'يُقرأ الزخم مقابل مؤشر مديري المشتريات والناتج غير النفطي: قد يرتفع الناتج بفضل النفط بينما يتباطأ الاقتصاد غير النفطي، وترصد الغرفة الثاني قبل أن يخفيه الأول.' },
  caveat: { en: 'GDP is the platform’s composite nowcast, built weekly from the indicators on this page. It is not GASTAT’s quarterly figure.', ar: 'الناتج المحلي تقدير آني مركّب من المنصة، يُبنى أسبوعياً من مؤشرات هذه الصفحة، وليس الرقم الفصلي للهيئة العامة للإحصاء.' },
} satisfies Record<string, L>;

export default async function GdpMonitor() {
  const lang = await currentLang();
  const s = await getSituation();
  const ar = lang === 'ar';
  const tr = (l: L) => l[lang];
  const ec = s.economy, co = s.confidence;
  const rows = ec.sinceWar.rows.filter((r) => ['gdp', 'pmi', 'emp', 'invest', 'oil'].includes(r.key));
  const max = Math.max(10, ...rows.map((r) => Math.abs(((r.post - r.pre) / Math.abs(r.pre || 1)) * 100)));
  const ledger = [...ec.annual].reverse();

  return (
    <main className="pb-12">
      <MonitorHead s={s} lang={lang} id="gdp" meaning={C.reading} />
      <div className="wrap mt-12 grid gap-12 lg:grid-cols-12">
        <Panel className="lg:col-span-7" title={tr(C.chart)}>
          <Legend items={[{ label: tr(C.total), color: 's1' }, { label: tr(C.nonOil), color: 's2' }]} />
          <div className="mt-2">
            <TrendChart lang={lang} title={tr(C.chart)} data={ec.gdp.series} digits={2} prefix="$" series={[{ key: 'total', label: tr(C.total), color: 'series-1' }, { key: 'nonOil', label: tr(C.nonOil), color: 'series-2' }]} event={{ date: s.provenance.warStart, label: tr(C.event) }} />
          </div>
          <DataTable lang={lang} head={[tr(C.week), tr(C.total), tr(C.nonOil)]} rows={ec.gdp.series.slice(-12).reverse().map((p) => [fmtDate(p.date, lang, { day: 'numeric', month: 'short', year: 'numeric' }), `$${f(p.total, 2)}T`, `$${f(p.nonOil, 2)}T`])} />
          <p className="mt-4 text-sm text-ink-3">{tr(C.caveat)}</p>
        </Panel>
        <Panel className="lg:col-span-5" title={tr(C.drivers)}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-7">
            <Kpi label={tr(C.momentum)} value={`${signed(ec.gdp.momentum4w)}%`} note={ar ? 'الناتج السنوي مقابل ما قبل أربعة أسابيع' : 'annualised GDP against four weeks ago'} />
            <Kpi label={tr(C.oilShare)} value={`${f(ec.gdp.oilShare)}%`} note={ar ? `النفطي ${f(ec.gdp.oilUsdT, 2)} تريليون، غير النفطي ${f(ec.gdp.nonOilUsdT, 2)} تريليون` : `oil $${f(ec.gdp.oilUsdT, 2)}T, non-oil $${f(ec.gdp.nonOilUsdT, 2)}T`} />
            <Kpi label={tr(C.pmi)} value={f(ec.pmi)} note={ec.pmi >= 50 ? tr(C.expansion) : tr(C.contraction)} trend={ec.pmiTrend} />
            <Kpi label={tr(C.employment)} value={f(ec.employment.value)} delta={ec.employment.wow} good="up" period={tr(C.wow)} trend={ec.employment.trend} />
            <Kpi label={tr(C.invest)} value={f(co.investment.value)} delta={co.investment.wow} good="up" period={tr(C.wow)} />
            <Kpi label={tr(C.brent)} value={`$${f(co.brent.value)}`} delta={co.brent.vsPreWar} good="none" period={tr(C.preWar)} trend={co.brentTrend} />
          </div>
        </Panel>
      </div>

      <div className="wrap mt-16 grid gap-12 lg:grid-cols-12">
        <Panel className="lg:col-span-6" title={tr(C.warTitle)} dek={tr(C.warDek)}>
          <div className="border-t-2 border-ink">
            <div className="grid grid-cols-12 gap-3 border-b border-rule py-2 text-sm font-medium text-ink-3">
              <div className="col-span-4">{tr(C.colMeasure)}</div><div className="col-span-2 text-end">{tr(C.colBefore)}</div><div className="col-span-2 text-end">{tr(C.colSince)}</div><div className="col-span-4">{tr(C.colChange)}</div>
            </div>
            {rows.map((r) => {
              const ch = r.pre ? ((r.post - r.pre) / Math.abs(r.pre)) * 100 : 0;
              const good = r.key === 'oil' ? 'none' : 'up';
              return (
                <div key={r.key} className="grid grid-cols-12 items-center gap-3 border-b border-rule py-2.5">
                  <div className="col-span-4 text-base text-ink">{ar ? r.label_ar : r.label_en}</div>
                  <div className="tnum col-span-2 text-end text-base text-ink-2">{f(r.pre, r.digits)}</div>
                  <div className="tnum col-span-2 text-end text-base font-semibold text-ink">{f(r.post, r.digits)}</div>
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="flex-1"><DivBar value={ch} max={max} label={`${signed(ch, 0)}%`} /></div>
                    <span className={`tnum w-12 shrink-0 text-end text-base font-semibold ${good === 'none' || Math.round(ch) === 0 ? 'text-ink' : ch > 0 ? 'delta-good' : 'delta-bad'}`}><bdi dir="ltr">{signed(ch, 0)}%</bdi></span>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel className="lg:col-span-6" title={tr(C.ledger)} dek={tr(C.ledgerDek)}>
          <div className="overflow-x-auto">
            <table className="tnum w-full min-w-[520px] text-start text-base">
              <thead>
                <tr className="border-y-2 border-ink text-sm font-medium text-ink-3">
                  <th className="py-2 pe-3 text-start font-medium">{tr(C.year)}</th>
                  <th className="py-2 pe-3 text-end font-medium">{tr(C.total)}</th>
                  <th className="py-2 pe-3 text-end font-medium">{tr(C.oil)}</th>
                  <th className="py-2 pe-3 text-end font-medium">{tr(C.nonOil)}</th>
                  <th className="py-2 pe-3 text-end font-medium">{tr(C.brent)}</th>
                  <th className="py-2 pe-3 text-end font-medium">{tr(C.portCalls)}</th>
                  <th className="py-2 text-end font-medium">{tr(C.spending)}</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((y) => (
                  <tr key={y.year} className="border-b border-rule">
                    <td className="py-2 pe-3 text-ink">{y.year}{y.weeks < 50 ? <span className="text-ink-3"> ({y.weeks} {ar ? 'أسبوعاً' : 'wks'})</span> : ''}</td>
                    <td className="py-2 pe-3 text-end font-semibold text-ink">{y.gdpUsdT != null ? `$${f(y.gdpUsdT, 2)}T` : '—'}</td>
                    <td className="py-2 pe-3 text-end text-ink-2">{y.oilUsdT != null ? `$${f(y.oilUsdT, 2)}T` : '—'}</td>
                    <td className="py-2 pe-3 text-end text-ink-2">{y.nonOilUsdT != null ? `$${f(y.nonOilUsdT, 2)}T` : '—'}</td>
                    <td className="py-2 pe-3 text-end text-ink-2">{y.brent != null ? `$${f(y.brent, 0)}` : '—'}</td>
                    <td className="py-2 pe-3 text-end text-ink-2">{y.portCalls ?? '—'}</td>
                    <td className="py-2 text-end text-ink-2">{y.spending != null ? f(y.spending, 0) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </main>
  );
}

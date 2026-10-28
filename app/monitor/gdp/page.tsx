import { currentLang } from '@/lib/auth';
import { getSituation } from '@/lib/situation';
import { fmtDate } from '@/lib/i18n';
import type { L } from '@/lib/types';
import MonitorHead, { BarList, BeforeSince, DataTable, Legend, Panel } from '@/components/MonitorHead';
import TrendChart from '@/components/TrendChart';
import { Kpi } from '@/components/Figures';

export const revalidate = 900;

const f = (n: number, d = 1) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const signed = (n: number, d = 1) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${f(Math.abs(n), d)}`;

const C = {
  chart: { en: 'GDP nowcast, annualised, $ trillion', ar: 'تقدير الناتج الآني السنوي، تريليون دولار' },
  total: { en: 'Total', ar: 'الإجمالي' }, nonOil: { en: 'Non-oil', ar: 'غير النفطي' }, oil: { en: 'Oil', ar: 'النفطي' },
  event: { en: '28 Feb: Hormuz disrupted', ar: '28 فبراير: اضطراب هرمز' }, week: { en: 'Week', ar: 'الأسبوع' },
  drivers: { en: 'What is moving it', ar: 'ما الذي يحرّكه' },
  weekChange: { en: 'GDP, week on week', ar: 'الناتج، أسبوعياً' }, nonOilGdp: { en: 'Non-oil GDP', ar: 'الناتج غير النفطي' }, oilGdp: { en: 'Oil GDP', ar: 'الناتج النفطي' },
  employment: { en: 'Employment', ar: 'التوظيف' }, invest: { en: 'Investment confidence', ar: 'ثقة الاستثمار' }, brent: { en: 'Brent, $ a barrel', ar: 'برنت، دولار للبرميل' },
  wow: { en: 'on the week', ar: 'أسبوعياً' }, preWar: { en: 'on pre-war', ar: 'عن ما قبل الحرب' }, share: { en: 'of GDP', ar: 'من الناتج' },
  warTitle: { en: 'Before and since 28 February', ar: 'قبل 28 فبراير وبعده' },
  colMeasure: { en: 'Measure', ar: 'المقياس' }, colBefore: { en: 'Before', ar: 'قبل' }, colSince: { en: 'Since', ar: 'منذ' }, colChange: { en: 'Change', ar: 'التغيّر' },
  ledger: { en: 'GDP by year, oil and non-oil', ar: 'الناتج بالسنة، النفطي وغير النفطي' },
  ytd: { en: 'to date', ar: 'حتى تاريخه' },
  caveat: { en: 'The platform’s composite nowcast, not GASTAT’s quarterly figure.', ar: 'تقدير آني مركّب من المنصة، وليس الرقم الفصلي للهيئة العامة للإحصاء.' },
} satisfies Record<string, L>;

export default async function GdpMonitor() {
  const lang = await currentLang();
  const s = await getSituation();
  const tr = (l: L) => l[lang];
  const ec = s.economy, co = s.confidence;
  const rows = ec.sinceWar.rows.filter((r) => ['gdp', 'pmi', 'emp', 'invest', 'oil'].includes(r.key));
  const ledger = [...ec.annual].reverse().filter((y) => y.gdpUsdT != null);

  return (
    <main className="pb-12">
      <MonitorHead s={s} lang={lang} id="gdp" />
      <div className="wrap mt-12 grid gap-12 lg:grid-cols-12">
        <Panel className="lg:col-span-7" title={tr(C.chart)}>
          <Legend items={[{ label: tr(C.total), color: 's1' }, { label: tr(C.nonOil), color: 's2' }]} />
          <div className="mt-2">
            <TrendChart lang={lang} title={tr(C.chart)} data={ec.gdp.series} digits={2} prefix="$" series={[{ key: 'total', label: tr(C.total), color: 'series-1' }, { key: 'nonOil', label: tr(C.nonOil), color: 'series-2' }]} event={{ date: s.provenance.warStart, label: tr(C.event) }} />
          </div>
          <DataTable lang={lang} head={[tr(C.week), tr(C.total), tr(C.nonOil)]} rows={ec.gdp.series.slice(-12).reverse().map((p) => [fmtDate(p.date, lang, { day: 'numeric', month: 'short', year: 'numeric' }), `$${f(p.total, 2)}T`, `$${f(p.nonOil, 2)}T`])} />
          <p className="mt-3 text-sm text-ink-3">{tr(C.caveat)}</p>
        </Panel>
        <Panel className="lg:col-span-5" title={tr(C.drivers)}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-7">
            <Kpi label={tr(C.nonOilGdp)} value={`$${f(ec.gdp.nonOilUsdT, 2)}T`} note={`${f(100 - ec.gdp.oilShare, 0)}% ${tr(C.share)}`} />
            <Kpi label={tr(C.oilGdp)} value={`$${f(ec.gdp.oilUsdT, 2)}T`} note={`${f(ec.gdp.oilShare, 0)}% ${tr(C.share)}`} />
            <Kpi label={tr(C.weekChange)} value={`${signed(ec.gdp.wow)}%`} />
            <Kpi label={tr(C.employment)} value={f(ec.employment.value)} delta={ec.employment.wow} good="up" period={tr(C.wow)} trend={ec.employment.trend} />
            <Kpi label={tr(C.invest)} value={f(co.investment.value)} delta={co.investment.wow} good="up" period={tr(C.wow)} />
            <Kpi label={tr(C.brent)} value={`$${f(co.brent.value)}`} delta={co.brent.vsPreWar} good="none" period={tr(C.preWar)} trend={co.brentTrend} />
          </div>
        </Panel>
      </div>

      <div className="wrap mt-16 grid gap-12 lg:grid-cols-12">
        <Panel className="lg:col-span-6" title={tr(C.warTitle)}>
          <BeforeSince lang={lang} rows={rows} head={[tr(C.colMeasure), tr(C.colBefore), tr(C.colSince), tr(C.colChange)]} good={{ gdp: 'up', pmi: 'up', emp: 'up', invest: 'up', oil: 'none' }} />
        </Panel>
        <Panel className="lg:col-span-6" title={tr(C.ledger)}>
          <Legend items={[{ label: tr(C.oil), color: 's2' }, { label: tr(C.nonOil), color: 's1' }]} />
          <div className="mt-4">
            <BarList fmt={(v) => `$${f(v, 2)}T`} rows={ledger.map((y) => ({ label: y.year, value: y.gdpUsdT!, part: y.oilUsdT ?? undefined, note: y.weeks < 50 ? tr(C.ytd) : undefined }))} />
          </div>
        </Panel>
      </div>
    </main>
  );
}

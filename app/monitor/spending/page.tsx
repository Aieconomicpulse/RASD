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
  chart: { en: 'Consumer spending and employment, weekly, since January 2025', ar: 'الإنفاق الاستهلاكي والتوظيف، أسبوعياً، منذ يناير 2025' },
  spending: { en: 'Spending', ar: 'الإنفاق' }, employment: { en: 'Employment', ar: 'التوظيف' },
  event: { en: '28 Feb: Hormuz disrupted', ar: '28 فبراير: اضطراب هرمز' }, week: { en: 'Week', ar: 'الأسبوع' },
  pulse: { en: 'The household pulse', ar: 'نبض الأسر' },
  wow: { en: 'on the week', ar: 'أسبوعياً' }, m4: { en: 'Four weeks', ar: 'أربعة أسابيع' }, yoy: { en: 'On a year ago', ar: 'سنوياً' },
  pmi: { en: 'PMI', ar: 'مؤشر مديري المشتريات' },
  expansion: { en: 'Above 50: expanding', ar: 'فوق 50: توسّع' }, contraction: { en: 'Below 50: contracting', ar: 'دون 50: انكماش' },
  food: { en: 'Food prices, four weeks', ar: 'أسعار الغذاء، أربعة أسابيع' },
  warTitle: { en: 'Before and since 28 February', ar: 'قبل 28 فبراير وبعده' },
  colMeasure: { en: 'Measure', ar: 'المقياس' }, colBefore: { en: 'Before', ar: 'قبل' }, colSince: { en: 'Since', ar: 'منذ' }, colChange: { en: 'Change', ar: 'التغيّر' },
  years: { en: 'Spending index by year', ar: 'مؤشر الإنفاق بالسنة' }, ytd: { en: 'to date', ar: 'حتى تاريخه' },
} satisfies Record<string, L>;

export default async function SpendingMonitor() {
  const lang = await currentLang();
  const s = await getSituation();
  const tr = (l: L) => l[lang];
  const ec = s.economy, sh = s.shelves;
  const rows = ec.sinceWar.rows.filter((r) => ['spend', 'emp', 'pmi'].includes(r.key));
  const years = [...ec.annual].reverse().filter((y) => y.spending != null);

  return (
    <main className="pb-12">
      <MonitorHead s={s} lang={lang} id="spending" />
      <div className="wrap mt-12 grid gap-12 lg:grid-cols-12">
        <Panel className="lg:col-span-7" title={tr(C.chart)}>
          <Legend items={[{ label: tr(C.spending), color: 's1' }, { label: tr(C.employment), color: 's2' }]} />
          <div className="mt-2">
            <TrendChart lang={lang} title={tr(C.chart)} digits={0}
              data={ec.spending.series.map((p, i) => ({ date: p.date, spend: p.value, emp: ec.employment.series[i].value }))}
              series={[{ key: 'emp', label: tr(C.employment), color: 'series-2' }, { key: 'spend', label: tr(C.spending), color: 'series-1', width: 2.5 }]}
              event={{ date: s.provenance.warStart, label: tr(C.event) }} />
          </div>
          <DataTable lang={lang} head={[tr(C.week), tr(C.spending), tr(C.employment)]} rows={ec.spending.series.slice(-12).reverse().map((p, i) => [fmtDate(p.date, lang, { day: 'numeric', month: 'short', year: 'numeric' }), f(p.value), f(ec.employment.series.slice(-12).reverse()[i]?.value ?? 0)])} />
        </Panel>
        <Panel className="lg:col-span-5" title={tr(C.pulse)}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-7">
            <Kpi label={tr(C.m4)} value={`${signed(ec.spending.m4 ?? 0)}%`} />
            <Kpi label={tr(C.yoy)} value={`${signed(ec.spending.yoy ?? 0)}%`} />
            <Kpi label={tr(C.employment)} value={f(ec.employment.value)} delta={ec.employment.wow} good="up" period={tr(C.wow)} trend={ec.employment.trend} />
            <Kpi label={tr(C.pmi)} value={f(ec.pmi)} note={ec.pmi >= 50 ? tr(C.expansion) : tr(C.contraction)} trend={ec.pmiTrend} />
            <Kpi label={tr(C.food)} value={`${signed(sh.foodCpi.m4 ?? 0)}%`} />
          </div>
        </Panel>
      </div>

      <div className="wrap mt-16 grid gap-12 lg:grid-cols-12">
        <Panel className="lg:col-span-7" title={tr(C.warTitle)}>
          <BeforeSince lang={lang} rows={rows} head={[tr(C.colMeasure), tr(C.colBefore), tr(C.colSince), tr(C.colChange)]} good={{ spend: 'up', emp: 'up', pmi: 'up' }} />
        </Panel>
        <Panel className="lg:col-span-5" title={tr(C.years)}>
          <BarList fmt={(v) => f(v, 0)} rows={years.map((y) => ({ label: y.year, value: y.spending!, note: y.weeks < 50 ? tr(C.ytd) : undefined }))} />
        </Panel>
      </div>
    </main>
  );
}

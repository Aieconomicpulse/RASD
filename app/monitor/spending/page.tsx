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
  chart: { en: 'Consumer spending index, weekly, since January 2025', ar: 'مؤشر الإنفاق الاستهلاكي، أسبوعياً، منذ يناير 2025' },
  spending: { en: 'Spending', ar: 'الإنفاق' }, employment: { en: 'Employment', ar: 'التوظيف' },
  event: { en: '28 Feb: Hormuz disrupted', ar: '28 فبراير: اضطراب هرمز' },
  week: { en: 'Week', ar: 'الأسبوع' },
  pulse: { en: 'The household pulse', ar: 'نبض الأسر' },
  wow: { en: 'on the week', ar: 'أسبوعياً' }, m4: { en: 'over four weeks', ar: 'خلال أربعة أسابيع' }, yoy: { en: 'on a year ago', ar: 'سنوياً' },
  level: { en: 'Spending index', ar: 'مؤشر الإنفاق' }, pmi: { en: 'PMI', ar: 'مؤشر مديري المشتريات' },
  expansion: { en: 'Above 50: expanding', ar: 'فوق 50: توسّع' }, contraction: { en: 'Below 50: contracting', ar: 'دون 50: انكماش' },
  food: { en: 'Food prices, four weeks', ar: 'أسعار الغذاء، أربعة أسابيع' }, foodNote: { en: 'what the same basket costs more', ar: 'ما تزيد به كلفة السلة نفسها' },
  warTitle: { en: 'Before and since 28 February', ar: 'قبل 28 فبراير وبعده' },
  warDek: { en: 'Average of Nov 2025 to Feb 2026 against the average since.', ar: 'متوسط نوفمبر 2025 حتى فبراير 2026 مقابل المتوسط منذ ذلك الحين.' },
  colMeasure: { en: 'Measure', ar: 'المقياس' }, colBefore: { en: 'Before', ar: 'قبل' }, colSince: { en: 'Since', ar: 'منذ' }, colChange: { en: 'Change', ar: 'التغيّر' },
  years: { en: 'Year by year', ar: 'سنة بسنة' }, yearsDek: { en: 'Average spending index per year.', ar: 'متوسط مؤشر الإنفاق في كل سنة.' },
  reading: { en: 'Spending is read against prices: when the index rises faster than food prices, households are buying more, not just paying more.', ar: 'يُقرأ الإنفاق مقابل الأسعار: عندما يرتفع المؤشر أسرع من أسعار الغذاء، تشتري الأسر أكثر لا تدفع أكثر فحسب.' },
} satisfies Record<string, L>;

export default async function SpendingMonitor() {
  const lang = await currentLang();
  const s = await getSituation();
  const ar = lang === 'ar';
  const tr = (l: L) => l[lang];
  const ec = s.economy, sh = s.shelves;
  const rows = ec.sinceWar.rows.filter((r) => ['spend', 'emp', 'pmi'].includes(r.key));
  const max = Math.max(10, ...rows.map((r) => Math.abs(((r.post - r.pre) / Math.abs(r.pre || 1)) * 100)));
  const years = [...ec.annual].reverse().filter((y) => y.spending != null);
  const yMax = Math.max(...years.map((y) => y.spending ?? 0));

  return (
    <main className="pb-12">
      <MonitorHead s={s} lang={lang} id="spending" meaning={C.reading} />
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
            <Kpi label={tr(C.level)} value={f(ec.spending.value)} delta={ec.spending.wow} good="up" period={tr(C.wow)} trend={ec.spending.trend} />
            <Kpi label={tr(C.m4)} value={`${signed(ec.spending.m4 ?? 0)}%`} note={ar ? 'مقابل ما قبل أربعة أسابيع' : 'against four weeks ago'} />
            <Kpi label={tr(C.yoy)} value={`${signed(ec.spending.yoy ?? 0)}%`} note={ar ? 'مقابل الأسبوع نفسه من العام الماضي' : 'against the same week last year'} />
            <Kpi label={tr(C.food)} value={`${signed(sh.foodCpi.m4 ?? 0)}%`} note={tr(C.foodNote)} />
            <Kpi label={tr(C.employment)} value={f(ec.employment.value)} delta={ec.employment.wow} good="up" period={tr(C.wow)} trend={ec.employment.trend} />
            <Kpi label={tr(C.pmi)} value={f(ec.pmi)} note={ec.pmi >= 50 ? tr(C.expansion) : tr(C.contraction)} trend={ec.pmiTrend} />
          </div>
        </Panel>
      </div>

      <div className="wrap mt-16 grid gap-12 lg:grid-cols-12">
        <Panel className="lg:col-span-7" title={tr(C.warTitle)} dek={tr(C.warDek)}>
          <div className="border-t-2 border-ink">
            <div className="grid grid-cols-12 gap-3 border-b border-rule py-2 text-sm font-medium text-ink-3">
              <div className="col-span-4">{tr(C.colMeasure)}</div><div className="col-span-2 text-end">{tr(C.colBefore)}</div><div className="col-span-2 text-end">{tr(C.colSince)}</div><div className="col-span-4">{tr(C.colChange)}</div>
            </div>
            {rows.map((r) => {
              const ch = r.pre ? ((r.post - r.pre) / Math.abs(r.pre)) * 100 : 0;
              return (
                <div key={r.key} className="grid grid-cols-12 items-center gap-3 border-b border-rule py-2.5">
                  <div className="col-span-4 text-base text-ink">{ar ? r.label_ar : r.label_en}</div>
                  <div className="tnum col-span-2 text-end text-base text-ink-2">{f(r.pre, r.digits)}</div>
                  <div className="tnum col-span-2 text-end text-base font-semibold text-ink">{f(r.post, r.digits)}</div>
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="flex-1"><DivBar value={ch} max={max} label={`${signed(ch, 0)}%`} /></div>
                    <span className={`tnum w-12 shrink-0 text-end text-base font-semibold ${Math.round(ch) === 0 ? 'text-ink' : ch > 0 ? 'delta-good' : 'delta-bad'}`}><bdi dir="ltr">{signed(ch, 0)}%</bdi></span>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel className="lg:col-span-5" title={tr(C.years)} dek={tr(C.yearsDek)}>
          <ul className="space-y-2.5">
            {years.map((y) => (
              <li key={y.year} className="grid grid-cols-12 items-center gap-3">
                <span className="tnum col-span-2 text-base text-ink">{y.year}</span>
                <span className="col-span-7 h-3 rounded-full bg-s1/15" dir="ltr"><span className="block h-3 rounded-full bg-s1" style={{ width: `${((y.spending ?? 0) / yMax) * 100}%` }} /></span>
                <span className="tnum col-span-3 text-end text-base font-semibold text-ink">{f(y.spending ?? 0, 0)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </main>
  );
}

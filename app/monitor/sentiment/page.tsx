import { currentLang } from '@/lib/auth';
import { getSituation } from '@/lib/situation';
import { fmtDate } from '@/lib/i18n';
import type { L } from '@/lib/types';
import MonitorHead, { BeforeSince, DataTable, Legend, Panel } from '@/components/MonitorHead';
import TrendChart from '@/components/TrendChart';
import { Kpi } from '@/components/Figures';

export const revalidate = 900;

const f = (n: number, d = 1) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const signed = (n: number, d = 1) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${f(Math.abs(n), d)}`;

const C = {
  chart: { en: 'Press sentiment, daily, −1 to +1', ar: 'معنويات الصحافة، يومياً، من −1 إلى +1' },
  score: { en: 'Pooled score', ar: 'الدرجة المجمّعة' }, day: { en: 'Day', ar: 'اليوم' }, headlinesCol: { en: 'Headlines', ar: 'العناوين' },
  headlines: { en: 'Headlines behind today’s reading', ar: 'العناوين وراء قراءة اليوم' },
  noHeadlines: { en: 'Headlines appear when the live feed is connected.', ar: 'تظهر العناوين عند وصول التغذية المباشرة.' },
  markets: { en: 'What the markets say', ar: 'ما تقوله الأسواق' },
  tasi: { en: 'TASI', ar: 'تاسي' }, brent: { en: 'Brent, $ a barrel', ar: 'برنت، دولار للبرميل' }, sama: { en: 'SAMA repo rate', ar: 'سعر إعادة الشراء (ساما)' },
  invest: { en: 'Investment confidence', ar: 'ثقة الاستثمار' }, pmi: { en: 'PMI', ar: 'مؤشر مديري المشتريات' },
  wow: { en: 'on the week', ar: 'أسبوعياً' }, m4: { en: 'over four weeks', ar: 'خلال أربعة أسابيع' }, preWar: { en: 'on pre-war', ar: 'عن ما قبل الحرب' },
  expansion: { en: 'Above 50: expanding', ar: 'فوق 50: توسّع' }, contraction: { en: 'Below 50: contracting', ar: 'دون 50: انكماش' },
  tasiChart: { en: 'TASI and Brent, weekly, last six months', ar: 'تاسي وبرنت، أسبوعياً، آخر ستة أشهر' },
  warTitle: { en: 'Before and since 28 February', ar: 'قبل 28 فبراير وبعده' },
  colMeasure: { en: 'Measure', ar: 'المقياس' }, colBefore: { en: 'Before', ar: 'قبل' }, colSince: { en: 'Since', ar: 'منذ' }, colChange: { en: 'Change', ar: 'التغيّر' },
} satisfies Record<string, L>;

export default async function SentimentMonitor() {
  const lang = await currentLang();
  const s = await getSituation();
  const ar = lang === 'ar';
  const tr = (l: L) => l[lang];
  const co = s.confidence, ec = s.economy;
  const rows = ec.sinceWar.rows.filter((r) => ['sent', 'oil', 'invest'].includes(r.key));
  const markets = co.tasiTrend.map((p, i) => ({ date: p.date, tasi: p.value, brent: co.brentTrend[i]?.value ?? 0 }));

  return (
    <main className="pb-12">
      <MonitorHead s={s} lang={lang} id="sentiment" />
      <div className="wrap mt-12 grid gap-12 lg:grid-cols-12">
        <Panel className="lg:col-span-7" title={tr(C.chart)}>
          <div className="mt-2">
            <TrendChart lang={lang} title={tr(C.chart)} digits={2} tickEvery="month" data={co.sentiment.trend.map((p) => ({ date: p.date, score: p.score }))}
              series={[{ key: 'score', label: tr(C.score), color: 'series-1', width: 2.5 }]} refY={{ y: 0, label: '' }} yDomain={[-1, 1]} />
          </div>
          <DataTable lang={lang} head={[tr(C.day), tr(C.score), tr(C.headlinesCol)]} rows={co.sentiment.trend.slice(-14).reverse().map((p) => [fmtDate(p.date, lang, { day: 'numeric', month: 'short', year: 'numeric' }), signed(p.score, 2), p.headlines ?? '—'])} />
        </Panel>
        <Panel className="lg:col-span-5" title={tr(C.headlines)}>
          <p className="-mt-2 mb-3 text-sm text-ink-3">{fmtDate(co.sentiment.date, lang)}{co.sentiment.headlineCount ? (ar ? `، ${co.sentiment.headlineCount} عنواناً` : `, ${co.sentiment.headlineCount} headlines`) : ''}</p>
          {co.sentiment.headlines.length > 0 ? (
            <ul className="divide-y divide-rule border-y border-rule">
              {co.sentiment.headlines.slice(0, 8).map((h, i) => (
                <li key={i} className="flex gap-3 py-3 text-base leading-snug" dir="auto">
                  <span className={`mt-[0.45rem] h-2.5 w-2.5 shrink-0 rounded-full ${h.sentiment === 'negative' ? 'bg-st-critical' : h.sentiment === 'positive' ? 'bg-st-normal' : 'bg-ink-3'}`} aria-label={h.sentiment ?? ''} />
                  <span className="text-ink">{h.headline}{h.source ? <span className="text-ink-3"> ({h.source})</span> : null}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-base text-ink-3">{tr(C.noHeadlines)}</p>}
        </Panel>
      </div>

      <div className="wrap mt-16 grid gap-12 lg:grid-cols-12">
        <Panel className="lg:col-span-7" title={tr(C.markets)}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4">
            <Kpi label={tr(C.tasi)} value={co.tasi.value.toLocaleString('en-US')} delta={co.tasi.m4} good="up" period={tr(C.m4)} trend={co.tasiTrend} />
            <Kpi label={tr(C.invest)} value={f(co.investment.value)} delta={co.investment.wow} good="up" period={tr(C.wow)} />
            <Kpi label={tr(C.pmi)} value={f(ec.pmi)} note={ec.pmi >= 50 ? tr(C.expansion) : tr(C.contraction)} trend={ec.pmiTrend} />
            <Kpi label={tr(C.sama)} value={`${f(co.samaRate, 2)}%`} />
          </div>
          <h3 className="mt-10 text-xl font-semibold text-ink">{tr(C.tasiChart)}</h3>
          <Legend items={[{ label: tr(C.tasi), color: 's1' }, { label: tr(C.brent), color: 's2' }]} />
          <div className="mt-2 grid gap-6 md:grid-cols-2">
            <TrendChart lang={lang} title={tr(C.tasi)} height={200} digits={0} data={markets} series={[{ key: 'tasi', label: tr(C.tasi), color: 'series-1' }]} event={{ date: s.provenance.warStart, label: '' }} tickEvery="month" />
            <TrendChart lang={lang} title={tr(C.brent)} height={200} digits={0} prefix="$" data={markets} series={[{ key: 'brent', label: tr(C.brent), color: 'series-2' }]} event={{ date: s.provenance.warStart, label: '' }} tickEvery="month" />
          </div>
        </Panel>
        <Panel className="lg:col-span-5" title={tr(C.warTitle)}>
          <BeforeSince lang={lang} rows={rows} head={[tr(C.colMeasure), tr(C.colBefore), tr(C.colSince), tr(C.colChange)]} good={{ sent: 'up', invest: 'up', oil: 'none' }} />
        </Panel>
      </div>
    </main>
  );
}

import modules from '@/config/modules.json';
import meta from '@/data/ksa/meta.json';
import { currentLang } from '@/lib/auth';
import { fmtDate, t } from '@/lib/i18n';
import { RULES } from '@/lib/status';
import { PILLAR_NAME } from '@/lib/strategy';
import type { L, Pillar } from '@/lib/types';
import { StatusShape } from '@/components/StatusPill';

const minus = (v?: string) => (v ? v.replace(/(^|\s)-/g, '$1−') : '—');

interface Module { id: string; name: string; name_ar: string; project: string; url: string; pillar: Pillar; summary: string; summary_ar: string; now: L[]; next: L[] }

const C = {
  title: { en: 'Sources and rules', ar: 'المصادر والقواعد' },
  dek: { en: 'The platforms the picture is built from, what each one feeds today, and the rules that set every status.', ar: 'المنصات التي تُبنى منها الصورة، وما تغذّيه كل منها اليوم، والقواعد التي تحدّد كل حالة.' },
  platforms: { en: 'Platforms', ar: 'المنصات' },
  now: { en: 'Feeds the picture now', ar: 'تغذّي الصورة الآن' },
  next: { en: 'Would add', ar: 'ما يمكن إضافته' },
  none: { en: 'Linked, not yet feeding the picture.', ar: 'مرتبطة، ولا تغذّي الصورة بعد.' },
  rules: { en: 'How each status is set', ar: 'كيف تُحدَّد كل حالة' },
  rulesDek: { en: 'A pillar takes the most severe level any of its measures reaches. The Hormuz status is a desk input: restricted means at least Watch, closed means Critical.', ar: 'تأخذ الركيزة أشدّ مستوى يبلغه أيٌّ من مقاييسها. وحالة هرمز مُدخل من المكتب: «مقيّد» تعني «مراقبة» على الأقل، و«مغلق» تعني «حرج».' },
  measure: { en: 'Measure', ar: 'المقياس' },
  data: { en: 'Data on this server', ar: 'البيانات على هذا الخادم' },
} satisfies Record<string, L>;

export default async function SourcesPage() {
  const lang = await currentLang();
  const ar = lang === 'ar';
  const tr = (l: L) => l[lang];
  const list = modules.modules as Module[];
  const R = RULES;
  const rows: { pillar: Pillar; m: L; w?: string; a?: string; c?: string }[] = [
    { pillar: 'supply', m: { en: 'Port calls against the 2025 weekly average', ar: 'رسو السفن مقابل متوسط 2025 الأسبوعي' }, a: `${R.supply.portVs2025.alert}%`, c: `${R.supply.portVs2025.critical}%` },
    { pillar: 'supply', m: { en: 'Port calls, week on week', ar: 'رسو السفن، أسبوعياً' }, a: `${R.supply.portWow.alert}%`, c: `${R.supply.portWow.critical}%` },
    { pillar: 'shelves', m: { en: 'Food index, week on week', ar: 'مؤشر الغذاء، أسبوعياً' }, w: `+${R.shelves.foodWow.watch}%`, a: `+${R.shelves.foodWow.alert}%`, c: `+${R.shelves.foodWow.critical}%` },
    { pillar: 'shelves', m: { en: 'Food index, over four weeks', ar: 'مؤشر الغذاء، خلال أربعة أسابيع' }, w: `+${R.shelves.food4w.watch}%`, a: `+${R.shelves.food4w.alert}%`, c: `+${R.shelves.food4w.critical}%` },
    { pillar: 'confidence', m: { en: 'Press sentiment, −1 to +1', ar: 'معنويات الصحافة، من −1 إلى +1' }, w: `${R.confidence.sentiment.watch.toFixed(1)}`, a: `${R.confidence.sentiment.alert}`, c: `${R.confidence.sentiment.critical}` },
    { pillar: 'confidence', m: { en: 'TASI, week on week', ar: 'تاسي، أسبوعياً' }, a: `${R.confidence.tasiWow.alert}%`, c: `${R.confidence.tasiWow.critical}%` },
    { pillar: 'confidence', m: { en: 'Brent against the pre-war average', ar: 'برنت مقابل متوسط ما قبل الحرب' }, w: `+${R.confidence.brentVsPreWar.watch}%`, a: `+${R.confidence.brentVsPreWar.alert}%` },
    { pillar: 'economy', m: { en: 'GDP nowcast, four-week momentum', ar: 'تقدير الناتج، زخم أربعة أسابيع' }, w: ar ? 'دون 0%' : 'below 0%', a: `${R.economy.momentum.alert}%`, c: `${R.economy.momentum.critical}%` },
    { pillar: 'economy', m: { en: 'PMI', ar: 'مؤشر مديري المشتريات' }, a: ar ? `دون ${R.economy.pmi.alert}` : `below ${R.economy.pmi.alert}`, c: ar ? `دون ${R.economy.pmi.critical}` : `below ${R.economy.pmi.critical}` },
    { pillar: 'economy', m: { en: 'Consumer spending, week on week', ar: 'الإنفاق الاستهلاكي، أسبوعياً' }, w: `${R.economy.spendWow.watch}%`, a: `${R.economy.spendWow.alert}%` },
  ];
  const head = (lv: 'watch' | 'alert' | 'critical', l: L) => (
    <span className="inline-flex items-center gap-1.5"><StatusShape status={lv} size={11} className={lv === 'watch' ? 'text-st-watch' : lv === 'alert' ? 'text-st-alert' : 'text-st-critical'} />{tr(l)}</span>
  );
  const latest = meta.latest as Record<string, string | number>;
  return (
    <main className="wrap py-10 md:py-14">
      <h1 className="section-title">{tr(C.title)}</h1>
      <p className="mt-3 max-w-3xl text-lg text-ink-2">{tr(C.dek)}</p>

      <h2 className="mt-12 text-2xl font-semibold text-ink">{tr(C.platforms)}</h2>
      <div className="mt-4 border-t-2 border-ink">
        {list.map((m) => (
          <article key={m.id} className="grid gap-x-8 gap-y-3 border-b border-rule py-6 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <h3 className="text-xl font-semibold text-ink">{ar ? m.name_ar : m.name}</h3>
              <div className="mt-1 text-sm text-ink-3">{tr(PILLAR_NAME[m.pillar])}</div>
              <a href={m.url} target="_blank" rel="noreferrer" className="link mt-3 inline-block text-base">{t(lang, 'openPlatform')}</a>
            </div>
            <p className="text-base leading-relaxed text-ink-2 lg:col-span-4">{ar ? m.summary_ar : m.summary}</p>
            <div className="space-y-3 text-base lg:col-span-4">
              <div>
                <div className="eyeline">{tr(C.now)}</div>
                {m.now.length ? <ul className="mt-1 space-y-1 text-ink">{m.now.map((x, i) => <li key={i}>{tr(x)}</li>)}</ul> : <p className="mt-1 text-ink-3">{tr(C.none)}</p>}
              </div>
              <div>
                <div className="eyeline">{tr(C.next)}</div>
                <ul className="mt-1 space-y-1 text-ink-2">{m.next.map((x, i) => <li key={i}>{tr(x)}</li>)}</ul>
              </div>
            </div>
          </article>
        ))}
      </div>

      <h2 className="mt-16 text-2xl font-semibold text-ink">{tr(C.rules)}</h2>
      <p className="mt-2 max-w-3xl text-base text-ink-2">{tr(C.rulesDek)}</p>
      <div className="mt-4 overflow-x-auto">
        <table className="tnum w-full min-w-[640px] text-start text-base">
          <thead>
            <tr className="border-y-2 border-ink text-sm font-medium text-ink-3">
              <th className="py-2 pe-4 text-start font-medium">{tr(C.measure)}</th>
              <th className="py-2 pe-4 text-start font-medium">{head('watch', { en: 'Watch', ar: 'مراقبة' })}</th>
              <th className="py-2 pe-4 text-start font-medium">{head('alert', { en: 'Alert', ar: 'تنبيه' })}</th>
              <th className="py-2 text-start font-medium">{head('critical', { en: 'Critical', ar: 'حرج' })}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-rule">
                <td className="py-2.5 pe-4"><div className="text-ink">{tr(r.m)}</div><div className="text-sm text-ink-3">{tr(PILLAR_NAME[r.pillar])}</div></td>
                <td className="py-2.5 pe-4 text-ink"><bdi dir="ltr">{minus(r.w)}</bdi></td>
                <td className="py-2.5 pe-4 text-ink"><bdi dir="ltr">{minus(r.a)}</bdi></td>
                <td className="py-2.5 text-ink"><bdi dir="ltr">{minus(r.c)}</bdi></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-16 text-2xl font-semibold text-ink">{tr(C.data)}</h2>
      <ul className="mt-3 space-y-1 text-base text-ink-2">
        <li>{ar ? 'آخر تحديث' : 'Last refreshed'}: {fmtDate(String(meta.fetchedAt).slice(0, 10), lang)}</li>
        <li>{ar ? 'المؤشرات الأسبوعية حتى' : 'Weekly indicators to'} {fmtDate(String(latest.macro), lang)}; {ar ? 'أسعار الغذاء حتى' : 'food prices to'} {fmtDate(String(latest.cpi), lang)}; {ar ? 'كومتريد' : 'UN Comtrade'} {latest.comtradeYear}</li>
        <li>{ar ? `${meta.counts.macroWeeks} أسبوعاً من المؤشرات الكلية، ${meta.counts.cpiWeeks} أسبوعاً من الأسعار، ${meta.counts.products} منتجاً، ${meta.counts.hormuzProducts} بنداً من بنود HS6` : `${meta.counts.macroWeeks} weeks of macro indicators, ${meta.counts.cpiWeeks} weeks of prices, ${meta.counts.products} products, ${meta.counts.hormuzProducts} HS6 lines`}</li>
      </ul>
    </main>
  );
}

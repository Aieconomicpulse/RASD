import Link from 'next/link';
import { currentLang } from '@/lib/auth';
import { getSituation } from '@/lib/situation';
import { fmtDate, t } from '@/lib/i18n';
import { MONITORS, PILLAR_MONITOR, alertCounts } from '@/lib/monitors';
import { conditions, hormuzLevel, levelOf, STATUS_LABEL } from '@/lib/status';
import { PILLAR_NAME, PRIORITY_LABEL } from '@/lib/strategy';
import type { L, Lang, Pillar, Priority, Status } from '@/lib/types';
import AlertList, { AlertCounters } from '@/components/AlertList';
import Icon from '@/components/Icons';
import StatusPill, { PriorityMark, StatusShape } from '@/components/StatusPill';

export const revalidate = 900;

const C = {
  dek: { en: 'What the numbers call for this week, ranked by urgency. Below the alerts: every signal the room watches, where it stands, and the line that would raise it.', ar: 'ما تستدعيه الأرقام هذا الأسبوع، مرتّباً حسب الأولوية. وتحت التنبيهات: كل إشارة ترصدها الغرفة، وأين تقف، والخط الذي يرفعها.' },
  fromDesk: { en: 'From the desk', ar: 'من المكتب' },
  signals: { en: 'The signals behind the alerts', ar: 'الإشارات وراء التنبيهات' },
  signalsDek: { en: 'A monitor takes the most severe level any of its signals reaches. The Hormuz status is a desk input: restricted means at least Watch, closed means Critical.', ar: 'تأخذ الشاشة أشدّ مستوى تبلغه أيٌّ من إشاراتها. وحالة هرمز مُدخل من المكتب: «مقيّد» تعني «مراقبة» على الأقل، و«مغلق» تعني «حرج».' },
  colSignal: { en: 'Signal', ar: 'الإشارة' }, colNow: { en: 'Now', ar: 'الآن' }, colLevel: { en: 'Level', ar: 'المستوى' }, colLines: { en: 'Lines', ar: 'الخطوط' },
  hormuz: { en: 'Hormuz, desk status', ar: 'هرمز، حالة المكتب' },
  hormuzLines: { en: 'Restricted: at least Watch. Closed: Critical.', ar: 'مقيّد: مراقبة على الأقل. مغلق: حرج.' },
  judgments: { en: 'Key judgments', ar: 'التقديرات الرئيسية' },
  monitorWord: { en: 'monitor', ar: 'شاشة' },
} satisfies Record<string, L>;

const SIGNAL_NAME: Record<string, L> = {
  portLevel: { en: 'Port calls against the 2025 weekly average', ar: 'رسو السفن مقابل متوسط 2025 الأسبوعي' },
  portWow: { en: 'Port calls, week on week', ar: 'رسو السفن، أسبوعياً' },
  foodWow: { en: 'Food index, week on week', ar: 'مؤشر الغذاء، أسبوعياً' },
  food4w: { en: 'Food index, over four weeks', ar: 'مؤشر الغذاء، خلال أربعة أسابيع' },
  sentiment: { en: 'Press sentiment, −1 to +1', ar: 'معنويات الصحافة، من −1 إلى +1' },
  tasiWow: { en: 'TASI, week on week', ar: 'تاسي، أسبوعياً' },
  brent: { en: 'Brent against the pre-war average', ar: 'برنت مقابل متوسط ما قبل الحرب' },
  momentum: { en: 'GDP nowcast, four-week momentum', ar: 'تقدير الناتج، زخم أربعة أسابيع' },
  pmi: { en: 'PMI', ar: 'مؤشر مديري المشتريات' },
  spendWow: { en: 'Consumer spending, week on week', ar: 'الإنفاق الاستهلاكي، أسبوعياً' },
};
const TONE: Record<Status, string> = { normal: 'text-st-normal', watch: 'text-st-watch', alert: 'text-st-alert', critical: 'text-st-critical' };

export default async function AlertsPage() {
  const lang = await currentLang();
  const s = await getSituation();
  const st = s.strategy!;
  const ar = lang === 'ar';
  const tr = (l: L) => l[lang];
  const counts = alertCounts(s);
  const groups: Priority[] = ['act', 'prepare', 'monitor'];
  const desk = s.alerts.filter((a) => a.fromDesk);
  const conds = conditions(s);
  const order: Pillar[] = ['supply', 'shelves', 'confidence', 'economy'];
  const lines = (c: (typeof conds)[number], l: Lang) => (['watch', 'alert', 'critical'] as const).filter((lv) => c.levels[lv] !== undefined).map((lv) => `${STATUS_LABEL[lv][l]} ${c.phrase(c.levels[lv]!, l)}`);

  return (
    <main className="wrap pb-12 pt-8 md:pt-10">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="section-title">{t(lang, 'alerts')}</h1>
        <StatusPill status={s.overall.status} lang={lang} />
        <span className="text-base text-ink-3">{t(lang, 'asOf')} {fmtDate(s.asOf.slice(0, 10), lang)}</span>
      </div>
      <p className="mt-2 max-w-3xl text-lg text-ink-2">{tr(C.dek)}</p>
      <div className="mt-6"><AlertCounters lang={lang} counts={counts} /></div>

      {desk.length > 0 && (
        <div className="mt-8 flex max-w-4xl gap-3 border-s-4 border-accent ps-4">
          <Icon name="desk" size={22} className="mt-1 shrink-0 text-accent" />
          <div>
            <div className="eyeline">{tr(C.fromDesk)}</div>
            <ul className="mt-1 space-y-1 text-lg">{desk.map((a, i) => <li key={i}>{ar ? a.text_ar : a.text_en}</li>)}</ul>
          </div>
        </div>
      )}

      <div className="mt-10 space-y-12">
        {groups.map((g) => (
          <section key={g}>
            <div className="mb-4 flex items-center gap-3">
              <PriorityMark priority={g} label={tr(PRIORITY_LABEL[g])} />
              <span className="tnum text-base text-ink-3">{counts[g]}</span>
            </div>
            <AlertList lang={lang} items={st.decisions.filter((d) => d.priority === g)} showPriority={false} />
          </section>
        ))}
      </div>

      <section className="mt-16 border-t-2 border-ink pt-8">
        <h2 className="text-2xl font-semibold text-ink">{tr(C.judgments)}</h2>
        <ol className="mt-4 max-w-4xl space-y-3 text-lg leading-snug text-ink">
          {st.judgments.map((j, i) => <li key={i} className="flex gap-4"><span className="tnum w-6 shrink-0 text-ink-3">{i + 1}</span><span>{tr(j)}</span></li>)}
        </ol>
      </section>

      <section className="mt-16 border-t-2 border-ink pt-8">
        <h2 className="text-2xl font-semibold text-ink">{tr(C.signals)}</h2>
        <p className="mt-2 max-w-3xl text-base text-ink-2">{tr(C.signalsDek)}</p>
        <div className="mt-6 space-y-10">
          {order.map((p) => {
            const mine = conds.filter((c) => c.pillar === p);
            const mon = MONITORS.find((m) => m.id === PILLAR_MONITOR[p])!;
            return (
              <div key={p}>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <h3 className="text-xl font-semibold text-ink">{tr(PILLAR_NAME[p])}</h3>
                  <StatusPill status={p === 'supply' ? s.supply.status : p === 'shelves' ? s.shelves.status : p === 'confidence' ? s.confidence.status : s.economy.status} lang={lang} />
                  <Link href={mon.href} className="link text-base">{ar ? `${tr(C.monitorWord)} ${tr(mon.short)}` : `${tr(mon.short)} ${tr(C.monitorWord)}`}</Link>
                </div>
                <div className="mt-3 border-t border-rule">
                  <div className="hidden grid-cols-12 gap-4 border-b border-rule py-2 text-sm font-medium text-ink-3 md:grid">
                    <div className="col-span-4">{tr(C.colSignal)}</div><div className="col-span-2">{tr(C.colNow)}</div><div className="col-span-2">{tr(C.colLevel)}</div><div className="col-span-4">{tr(C.colLines)}</div>
                  </div>
                  {mine.map((c) => {
                    const lv = levelOf(c);
                    return (
                      <div key={c.id} className="grid gap-x-4 gap-y-1 border-b border-rule py-3 md:grid-cols-12">
                        <div className="text-base text-ink md:col-span-4">{tr(SIGNAL_NAME[c.id] ?? { en: c.id, ar: c.id })}</div>
                        <div className="tnum text-base font-semibold text-ink md:col-span-2"><bdi dir="ltr">{c.now(c.value, lang)}</bdi></div>
                        <div className="flex items-center gap-2 text-base text-ink md:col-span-2"><StatusShape status={lv} size={12} className={TONE[lv]} />{STATUS_LABEL[lv][lang]}</div>
                        <ul className="text-sm text-ink-2 md:col-span-4">{lines(c, lang).map((x, i) => <li key={i}>{x}</li>)}</ul>
                      </div>
                    );
                  })}
                  {p === 'supply' && (
                    <div className="grid gap-x-4 gap-y-1 border-b border-rule py-3 md:grid-cols-12">
                      <div className="text-base text-ink md:col-span-4">{tr(C.hormuz)}</div>
                      <div className="text-base font-semibold text-ink md:col-span-2">{ar ? { open: 'مفتوح', restricted: 'مقيّد', closed: 'مغلق' }[s.supply.hormuz.state] : s.supply.hormuz.state}</div>
                      <div className="flex items-center gap-2 text-base text-ink md:col-span-2"><StatusShape status={hormuzLevel(s)} size={12} className={TONE[hormuzLevel(s)]} />{STATUS_LABEL[hormuzLevel(s)][lang]}</div>
                      <div className="text-sm text-ink-2 md:col-span-4">{tr(C.hormuzLines)}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

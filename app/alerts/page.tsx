import Link from 'next/link';
import { currentLang } from '@/lib/auth';
import { getSituation } from '@/lib/situation';
import { fmtDate, t } from '@/lib/i18n';
import { MONITORS, PILLAR_MONITOR, SIGNAL_NAME, alertCounts } from '@/lib/monitors';
import { conditions, hormuzLevel, STATUS_LABEL } from '@/lib/status';
import { PILLAR_NAME, PRIORITY_LABEL } from '@/lib/strategy';
import type { L, Pillar, Priority, Status } from '@/lib/types';
import AlertList, { AlertCounters } from '@/components/AlertList';
import Gauge from '@/components/Gauge';
import Icon from '@/components/Icons';
import StatusPill, { PriorityMark, StatusShape } from '@/components/StatusPill';

export const revalidate = 900;

const C = {
  fromDesk: { en: 'From the desk', ar: 'من المكتب' },
  signals: { en: 'The signals', ar: 'الإشارات' },
  hormuz: { en: 'Hormuz, set by the desk', ar: 'هرمز، بحسب المكتب' },
  monitorWord: { en: 'monitor', ar: 'شاشة' },
} satisfies Record<string, L>;

const TONE: Record<Status, string> = { normal: 'text-st-normal', watch: 'text-st-watch', alert: 'text-st-alert', critical: 'text-st-critical' };
const HORMUZ: Record<'open' | 'restricted' | 'closed', L> = { open: { en: 'open', ar: 'مفتوح' }, restricted: { en: 'restricted', ar: 'مقيّد' }, closed: { en: 'closed', ar: 'مغلق' } };

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
  const pillarStatus = (p: Pillar) => (p === 'supply' ? s.supply.status : p === 'shelves' ? s.shelves.status : p === 'confidence' ? s.confidence.status : s.economy.status);
  const hz = hormuzLevel(s);

  return (
    <main className="wrap pb-12 pt-8 md:pt-10">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="section-title">{t(lang, 'alerts')}</h1>
        <StatusPill status={s.overall.status} lang={lang} />
        <span className="text-base text-ink-3">{fmtDate(s.asOf.slice(0, 10), lang)}</span>
      </div>
      <div className="mt-5"><AlertCounters lang={lang} counts={counts} /></div>

      {desk.length > 0 && (
        <div className="mt-8 flex max-w-4xl gap-3 border-s-4 border-accent ps-4">
          <Icon name="desk" size={22} className="mt-1 shrink-0 text-accent" />
          <div>
            <div className="eyeline">{tr(C.fromDesk)}</div>
            <ul className="mt-1 space-y-1 text-lg">{desk.map((a, i) => <li key={i}>{ar ? a.text_ar : a.text_en}</li>)}</ul>
          </div>
        </div>
      )}

      <div className="mt-8 space-y-10">
        {groups.map((g) => (
          <section key={g}>
            <div className="mb-3"><PriorityMark priority={g} label={tr(PRIORITY_LABEL[g])} /></div>
            <AlertList lang={lang} items={st.decisions.filter((d) => d.priority === g)} showPriority={false} />
          </section>
        ))}
      </div>

      <section className="mt-16 border-t-2 border-ink pt-8">
        <h2 className="section-title">{tr(C.signals)}</h2>
        <div className="mt-6 grid gap-x-12 gap-y-10 lg:grid-cols-2">
          {order.map((p) => {
            const mine = conds.filter((c) => c.pillar === p);
            const mon = MONITORS.find((m) => m.id === PILLAR_MONITOR[p])!;
            return (
              <div key={p}>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <h3 className="text-xl font-semibold text-ink">{tr(PILLAR_NAME[p])}</h3>
                  <StatusPill status={pillarStatus(p)} lang={lang} />
                  <Link href={mon.href} className="link text-base">{ar ? `${tr(C.monitorWord)} ${tr(mon.short)}` : `${tr(mon.short)} ${tr(C.monitorWord)}`}</Link>
                </div>
                <div className="mt-5 space-y-6">
                  {mine.map((c) => <Gauge key={c.id} c={c} lang={lang} label={tr(SIGNAL_NAME[c.id] ?? { en: c.id, ar: c.id })} />)}
                  {p === 'supply' && (
                    <div>
                      <div className="mb-1 flex items-center justify-between gap-3 text-sm text-ink-2"><span>{tr(C.hormuz)}</span><span className="inline-flex items-center gap-1.5 font-semibold text-ink"><StatusShape status={hz} size={10} className={TONE[hz]} />{STATUS_LABEL[hz][lang]}</span></div>
                      <div className="flex gap-1" dir="ltr">
                        {(['open', 'restricted', 'closed'] as const).map((k, i) => {
                          const lv: Status = k === 'open' ? 'normal' : k === 'restricted' ? 'watch' : 'critical';
                          const on = s.supply.hormuz.state === k;
                          return <span key={k} className={`flex-1 rounded py-1.5 text-center text-sm ${on ? `lamp-${lv} font-semibold` : 'bg-sunken text-ink-3'} ${i === 0 ? 'rounded-s-full' : i === 2 ? 'rounded-e-full' : ''}`}>{tr(HORMUZ[k])}</span>;
                        })}
                      </div>
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

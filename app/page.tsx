import { currentLang } from '@/lib/auth';
import { getSituation } from '@/lib/situation';
import { HIJRI_LOCALE, t } from '@/lib/i18n';
import { MONITORS, alertCounts, face, monitorConditions, monitorStatus } from '@/lib/monitors';
import type { L } from '@/lib/types';
import AlertList, { AlertCounters } from '@/components/AlertList';
import GulfMap from '@/components/GulfMap';
import PortalLinks from '@/components/PortalLinks';
import { Screen, Wall } from '@/components/Screen';
import StatusPill from '@/components/StatusPill';
import Icon from '@/components/Icons';

export const revalidate = 900;

const C = {
  fromDesk: { en: 'From the desk', ar: 'من المكتب' },
  mapTitle: { en: 'The Kingdom between two seas: shipping lanes, ports and the roads east', ar: 'المملكة بين بحرين: ممرات الملاحة والموانئ والطرق نحو الشرق' },
  hormuz: { en: 'Hormuz', ar: 'هرمز' },
  quiet: { en: 'No alert calls for action today.', ar: 'لا تنبيه يستدعي التحرك اليوم.' },
} satisfies Record<string, L>;

export default async function RoomPage() {
  const lang = await currentLang();
  const s = await getSituation();
  const st = s.strategy!;
  const ar = lang === 'ar';
  const tr = (l: L) => l[lang];
  const asOf = new Date(s.asOf);
  const day = asOf.toLocaleDateString(ar ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-GB', { timeZone: 'Asia/Riyadh', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const time = asOf.toLocaleTimeString('en-GB', { timeZone: 'Asia/Riyadh', hour: '2-digit', minute: '2-digit' });
  const hijri = ar ? asOf.toLocaleDateString(HIJRI_LOCALE, { timeZone: 'Asia/Riyadh', day: 'numeric', month: 'long', year: 'numeric' }) : null;
  const desk = s.alerts.filter((a) => a.fromDesk);
  const counts = alertCounts(s);
  const top = st.decisions.filter((d) => d.priority !== 'monitor').slice(0, 5);
  const icons = { gdp: 'gdp', inflation: 'inflation', spending: 'spending', sentiment: 'sentiment' } as const;
  const hormuzWord = ar ? { open: 'مفتوح', restricted: 'مقيّد', closed: 'مغلق' }[s.supply.hormuz.state] : s.supply.hormuz.state;

  return (
    <main className="pb-12">
      {/* ---------------------------------------------------------------- the board */}
      <section className="wrap pb-2 pt-8 md:pt-10">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <StatusPill status={s.overall.status} lang={lang} size="lg" />
          <span className="text-lg text-ink-2">{day}, {time} {t(lang, 'riyadh')}{hijri ? <span className="text-ink-3"> ({hijri})</span> : null}</span>
        </div>
        <h1 className={`mt-4 max-w-5xl font-display font-semibold tracking-tight text-ink ${ar ? 'text-4xl font-bold leading-[1.25] tracking-normal md:text-5xl' : 'text-4xl md:text-5xl lg:text-6xl'}`}>{tr(st.headline)}</h1>
        {desk.length > 0 && (
          <div className="mt-5 flex max-w-4xl gap-3 border-s-4 border-accent ps-4">
            <Icon name="desk" size={22} className="mt-1 shrink-0 text-accent" />
            <div>
              <div className="eyeline">{tr(C.fromDesk)}</div>
              <ul className="mt-1 space-y-1 text-lg">{desk.map((a, i) => <li key={i}>{ar ? a.text_ar : a.text_en}</li>)}</ul>
            </div>
          </div>
        )}
      </section>

      {/* ---------------------------------------------------------------- the wall */}
      <Wall title={t(lang, 'monitoring')} door={{ href: '/monitor', label: t(lang, 'monitors') }}>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {MONITORS.map((m) => (
            <Screen key={m.id} lang={lang} href={m.href} name={m.wall} icon={icons[m.id]} status={monitorStatus(s, m.id)} face={face(s, m.id)} gauge={monitorConditions(s, m.id)[0]} cta={t(lang, 'openMonitor')} />
          ))}
        </div>
      </Wall>

      {/* ---------------------------------------------------------------- alerts, on the map */}
      <Wall title={t(lang, 'alerts')} door={{ href: '/alerts', label: t(lang, 'allAlerts') }}>
        <div className="grid gap-8 lg:grid-cols-12">
          <figure className="min-w-0 lg:col-span-7">
            <div className="overflow-x-auto rounded-2xl border border-rule bg-sea">
              <div className="min-w-[600px]"><GulfMap lang={lang} state={s.supply.hormuz.state} title={tr(C.mapTitle)} /></div>
            </div>
            <figcaption className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-base text-ink-2">
              <span className="inline-flex items-center gap-2"><svg width="34" height="8" aria-hidden><line x1="2" y1="4" x2="32" y2="4" stroke={s.supply.hormuz.state === 'closed' ? '#d03b3b' : s.supply.hormuz.state === 'restricted' ? '#ec835a' : '#0ca30c'} strokeWidth="3.5" strokeDasharray={s.supply.hormuz.state === 'open' ? undefined : '8 5'} strokeLinecap="round" /></svg>{tr(C.hormuz)}: {hormuzWord}</span>
              <span className="inline-flex items-center gap-2"><svg width="34" height="8" aria-hidden><line x1="2" y1="4" x2="32" y2="4" stroke="#0ca30c" strokeWidth="3" strokeLinecap="round" /></svg>{ar ? 'ممرات تتجنب هرمز' : 'Lanes that avoid Hormuz'}</span>
              <span className="inline-flex items-center gap-2"><svg width="34" height="8" aria-hidden><line x1="2" y1="4" x2="32" y2="4" stroke="rgb(var(--accent))" strokeWidth="3" strokeLinecap="round" /></svg>{ar ? 'الطرق البرية' : 'Roads'}</span>
            </figcaption>
          </figure>
          <div className="min-w-0 lg:col-span-5">
            <AlertCounters lang={lang} counts={counts} />
            <div className="mt-5">
              {top.length ? <AlertList lang={lang} items={top} compact /> : <p className="text-base text-ink-3">{tr(C.quiet)}</p>}
            </div>
          </div>
        </div>
      </Wall>

      {/* ---------------------------------------------------------------- portals */}
      <Wall title={t(lang, 'portals')} door={{ href: '/portals', label: t(lang, 'allPortals') }}>
        <PortalLinks lang={lang} />
      </Wall>
    </main>
  );
}

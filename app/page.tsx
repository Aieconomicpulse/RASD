import { currentLang } from '@/lib/auth';
import { getSituation } from '@/lib/situation';
import { fmtDate, HIJRI_LOCALE, t } from '@/lib/i18n';
import { MONITORS, alertCounts, face, monitorStatus } from '@/lib/monitors';
import type { L } from '@/lib/types';
import AlertList, { AlertCounters } from '@/components/AlertList';
import PortalLinks from '@/components/PortalLinks';
import { Screen, Wall } from '@/components/Screen';
import StatusPill from '@/components/StatusPill';
import Icon from '@/components/Icons';

export const revalidate = 900;

const C = {
  fromDesk: { en: 'From the desk', ar: 'من المكتب' },
  monitoringDek: { en: 'Four screens, each fed by the Kingdom platforms. Open one for the charts, the tables and the products behind the reading.', ar: 'أربع شاشات تغذّيها منصات المملكة. افتح أيّاً منها للرسوم والجداول والمنتجات وراء القراءة.' },
  alertsDek: { en: 'What the numbers call for, ranked by urgency. Each alert names its evidence.', ar: 'ما تستدعيه الأرقام، مرتّباً حسب الأولوية. كل تنبيه يسمّي دليله.' },
  portalsDek: { en: 'Each platform opens on its own, in a new window.', ar: 'كل منصة تُفتح وحدها في نافذة جديدة.' },
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
  const short = (iso: string) => fmtDate(iso, lang, { day: 'numeric', month: 'long' });
  const freshness = ar
    ? `المؤشرات الأسبوعية حتى ${short(s.confidence.asOf)}؛ أسعار الغذاء حتى ${short(s.shelves.asOf)}؛ معنويات الصحافة حتى ${short(s.confidence.sentiment.date)}${s.confidence.sentiment.live ? ' (مباشر)' : ''}.`
    : `Weekly indicators to ${short(s.confidence.asOf)}; food prices to ${short(s.shelves.asOf)}; press sentiment to ${short(s.confidence.sentiment.date)}${s.confidence.sentiment.live ? ' (live)' : ''}.`;
  const desk = s.alerts.filter((a) => a.fromDesk);
  const counts = alertCounts(s);
  const top = st.decisions.filter((d) => d.priority !== 'monitor').slice(0, 4);
  const icons = { gdp: 'gdp', inflation: 'inflation', spending: 'spending', sentiment: 'sentiment' } as const;

  return (
    <main className="pb-12">
      {/* ---------------------------------------------------------------- the board */}
      <section className="wrap pb-4 pt-8 md:pt-10">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <StatusPill status={s.overall.status} lang={lang} size="lg" />
          <span className="text-lg text-ink-2">{day}, {time} {t(lang, 'riyadh')}{hijri ? <span className="text-ink-3"> ({hijri})</span> : null}</span>
        </div>
        <h1 className={`mt-5 max-w-5xl font-display font-semibold tracking-tight text-ink ${ar ? 'text-4xl font-bold leading-[1.25] tracking-normal md:text-5xl' : 'text-4xl md:text-5xl lg:text-6xl'}`}>{tr(st.headline)}</h1>
        <p className="mt-4 max-w-4xl text-xl leading-snug text-ink-2 md:text-2xl">{tr(st.standfirst)}</p>
        <p className="mt-4 text-base text-ink-3">{freshness}</p>
        {desk.length > 0 && (
          <div className="mt-6 flex max-w-4xl gap-3 border-s-4 border-accent ps-4">
            <Icon name="desk" size={22} className="mt-1 shrink-0 text-accent" />
            <div>
              <div className="eyeline">{tr(C.fromDesk)}</div>
              <ul className="mt-1 space-y-1 text-lg">{desk.map((a, i) => <li key={i}>{ar ? a.text_ar : a.text_en}</li>)}</ul>
            </div>
          </div>
        )}
      </section>

      {/* ---------------------------------------------------------------- the wall */}
      <Wall title={t(lang, 'monitoring')} dek={tr(C.monitoringDek)} door={{ href: '/monitor', label: t(lang, 'monitors') }}>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {MONITORS.map((m) => (
            <Screen key={m.id} lang={lang} href={m.href} name={m.wall} icon={icons[m.id]} status={monitorStatus(s, m.id)} face={face(s, m.id)} cta={t(lang, 'openMonitor')} />
          ))}
        </div>
      </Wall>

      {/* ---------------------------------------------------------------- alerts */}
      <Wall title={t(lang, 'alerts')} dek={tr(C.alertsDek)} door={{ href: '/alerts', label: t(lang, 'allAlerts') }}>
        <AlertCounters lang={lang} counts={counts} />
        <div className="mt-6">
          {top.length ? <AlertList lang={lang} items={top} /> : <p className="text-base text-ink-3">{tr(C.quiet)}</p>}
        </div>
      </Wall>

      {/* ---------------------------------------------------------------- portals */}
      <Wall title={t(lang, 'portals')} dek={tr(C.portalsDek)} door={{ href: '/portals', label: t(lang, 'allPortals') }}>
        <PortalLinks lang={lang} />
      </Wall>
    </main>
  );
}

import { currentLang } from '@/lib/auth';
import { getSituation } from '@/lib/situation';
import { t } from '@/lib/i18n';
import { MONITORS, face, monitorConditions, monitorStatus } from '@/lib/monitors';
import { Screen } from '@/components/Screen';

export const revalidate = 900;

export default async function MonitorsPage() {
  const lang = await currentLang();
  const s = await getSituation();
  const icons = { gdp: 'gdp', inflation: 'inflation', spending: 'spending', sentiment: 'sentiment' } as const;
  return (
    <main className="wrap pb-12 pt-8 md:pt-10">
      <h1 className="section-title">{t(lang, 'monitoring')}</h1>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {MONITORS.map((m) => (
          <Screen key={m.id} lang={lang} href={m.href} name={m.wall} icon={icons[m.id]} status={monitorStatus(s, m.id)} face={face(s, m.id)} gauge={monitorConditions(s, m.id)[0]} cta={t(lang, 'openMonitor')} />
        ))}
      </div>
    </main>
  );
}

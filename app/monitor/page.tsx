import { currentLang } from '@/lib/auth';
import { getSituation } from '@/lib/situation';
import { t } from '@/lib/i18n';
import { MONITORS, face, monitorStatus } from '@/lib/monitors';
import type { L } from '@/lib/types';
import { Screen } from '@/components/Screen';

export const revalidate = 900;

const C = {
  dek: { en: 'Four screens, each a question the minister asks, each fed by the Kingdom platforms and read against published thresholds.', ar: 'أربع شاشات، كل منها سؤال يطرحه الوزير، تغذّيها منصات المملكة وتُقرأ مقابل عتبات منشورة.' },
} satisfies Record<string, L>;

export default async function MonitorsPage() {
  const lang = await currentLang();
  const s = await getSituation();
  const icons = { gdp: 'gdp', inflation: 'inflation', spending: 'spending', sentiment: 'sentiment' } as const;
  return (
    <main className="wrap pb-12 pt-8 md:pt-10">
      <h1 className="section-title">{t(lang, 'monitoring')}</h1>
      <p className="mt-2 max-w-3xl text-lg text-ink-2">{C.dek[lang]}</p>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {MONITORS.map((m) => (
          <Screen key={m.id} lang={lang} href={m.href} name={m.wall} icon={icons[m.id]} status={monitorStatus(s, m.id)} face={face(s, m.id)} cta={t(lang, 'openMonitor')} />
        ))}
      </div>
    </main>
  );
}

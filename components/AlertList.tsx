import type { Lang, Snapshot } from '@/lib/types';
import { t } from '@/lib/i18n';
import { STATUS_LABEL } from '@/lib/status';

export default function AlertList({ alerts, lang }: { alerts: Snapshot['alerts']; lang: Lang }) {
  const tz = 'Asia/Riyadh';
  return (
    <section className="card">
      <div className="flex items-center justify-between px-5 pt-4">
        <div className="label">{t(lang, 'alerts')}</div>
        <span className="num text-xs text-mist-500">{alerts.length}</span>
      </div>
      <ul className="divide-y divide-line px-5 pb-3 pt-2">
        {alerts.map((a, i) => (
          <li key={i} className="flex items-start gap-3 py-2.5">
            <span className={`chip chip-${a.level === 'info' ? 'info' : a.level} mt-0.5 shrink-0`}>{a.level === 'info' ? t(lang, 'info') : STATUS_LABEL[a.level][lang]}</span>
            <div className="min-w-0 flex-1">
              <div className="text-sm leading-snug text-mist-100">{lang === 'ar' ? a.text_ar : a.text_en}</div>
              <div className="num mt-0.5 text-[11px] text-mist-500">
                {new Date(a.time).toLocaleTimeString(lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz })} {t(lang, 'riyadh')}
                {a.panel ? ` · ${t(lang, a.panel)}` : ''}
              </div>
            </div>
          </li>
        ))}
        {!alerts.length && <li className="py-3 text-sm text-mist-500">—</li>}
      </ul>
    </section>
  );
}

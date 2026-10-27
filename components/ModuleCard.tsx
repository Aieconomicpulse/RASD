import type { Lang } from '@/lib/types';
import { t } from '@/lib/i18n';

export interface Module { id: string; name: string; name_ar: string; project: string; url: string; panel: string; summary: string; feeds: { live: string[]; to_wire: string[] } }

export default function ModuleCard({ m, lang }: { m: Module; lang: Lang }) {
  return (
    <div className="card flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="label">{t(lang, m.panel as 'shelves' | 'supply' | 'confidence')} · {m.project}</div>
          <h3 className="mt-1 text-base font-semibold text-white">{lang === 'ar' ? m.name_ar : m.name}</h3>
        </div>
        <a href={m.url} target="_blank" rel="noreferrer" className="shrink-0 rounded-md bg-pulse-blue/15 px-3 py-1.5 text-xs font-semibold text-pulse-blue hover:bg-pulse-blue/25">{t(lang, 'openModule')} ↗</a>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-mist-300">{m.summary}</p>
      <div className="mt-4 grid gap-3 text-xs md:grid-cols-2">
        <div>
          <div className="label mb-1">{t(lang, 'feedsLive')}</div>
          {m.feeds.live.length ? m.feeds.live.map((f, i) => <div key={i} className="text-pulse-green">● {f}</div>) : <div className="text-mist-500">—</div>}
        </div>
        <div>
          <div className="label mb-1">{t(lang, 'feedsToWire')}</div>
          {m.feeds.to_wire.map((f, i) => <div key={i} className="text-mist-300">○ {f}</div>)}
        </div>
      </div>
    </div>
  );
}

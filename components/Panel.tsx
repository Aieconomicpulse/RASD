import type { ReactNode } from 'react';
import StatusChip from './StatusChip';
import type { Lang, Status } from '@/lib/types';
import { t } from '@/lib/i18n';

export default function Panel({ lang, status, title, question, index, sample, source, children }:
  { lang: Lang; status: Status; title: string; question: string; index: string; sample?: boolean; source?: string; children: ReactNode }) {
  return (
    <section className="card flex flex-col overflow-hidden">
      <div className={`h-1 w-full bar-${status}`} />
      <div className="flex items-start justify-between gap-3 px-5 pt-4">
        <div>
          <div className="label">{index} · {title}</div>
          <h2 className="mt-1 text-lg font-semibold leading-tight text-white md:text-xl">{question}</h2>
        </div>
        <StatusChip status={status} lang={lang} pulse />
      </div>
      <div className="flex-1 px-5 pb-5 pt-4">{children}</div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-2 text-[11px] text-mist-500">
        <span className="truncate">{t(lang, 'source')}: {source}</span>
        {sample ? <span className="chip chip-watch">{t(lang, 'sample')}</span> : <span className="chip chip-normal">{t(lang, 'live')}</span>}
      </div>
    </section>
  );
}

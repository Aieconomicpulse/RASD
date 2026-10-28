import { t } from '@/lib/i18n';
import { MONITORS, face, monitor, monitorNext, monitorStatus } from '@/lib/monitors';
import type { L, Lang, MonitorId, Snapshot } from '@/lib/types';
import Icon, { type IconName } from './Icons';
import MonitorTabs from './MonitorTabs';
import { PORTALS } from './PortalLinks';
import StatusPill, { StatusShape } from './StatusPill';

const ICON: Record<MonitorId, IconName> = { gdp: 'gdp', inflation: 'inflation', spending: 'spending', sentiment: 'sentiment' };

/** The top of every monitor page: the tabs across the four screens, then this screen's reading, meaning and next threshold. */
export default function MonitorHead({ s, lang, id, meaning }: { s: Snapshot; lang: Lang; id: MonitorId; meaning?: L }) {
  const tr = (l: L) => l[lang];
  const m = monitor(id);
  const status = monitorStatus(s, id);
  const fc = face(s, id);
  const next = monitorNext(s, id);
  const portals = PORTALS.filter((p) => m.portals.includes(p.id));
  return (
    <header className="wrap pt-6 md:pt-8">
      <MonitorTabs label={t(lang, 'monitoring')} items={MONITORS.map((x) => ({ href: x.href, label: tr(x.short), status: monitorStatus(s, x.id) }))} />
      <div className={`screen screen-${status} mt-6 p-6 pt-7 md:p-8 md:pt-9`}>
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="inline-flex items-center gap-2.5 text-ink"><Icon name={ICON[id]} size={24} className="text-ink-2" /><h1 className="text-2xl font-semibold">{tr(m.name)}</h1></span>
              <StatusPill status={status} lang={lang} />
            </div>
            <p className="mt-2 text-lg text-ink-2">{tr(m.question)}</p>
            <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="figure font-display text-6xl leading-none"><bdi dir="ltr">{fc.value}</bdi></span>
              <span className="text-lg text-ink-2">{tr(fc.unit)}</span>
            </div>
            <ul className="mt-4 space-y-1 text-lg leading-snug text-ink">{fc.lines.map((l, i) => <li key={i}>{tr(l)}</li>)}</ul>
            {meaning && <p className="mt-4 max-w-2xl text-lg leading-snug text-ink-2">{tr(meaning)}</p>}
          </div>
          <div className="lg:col-span-5 lg:border-s lg:border-rule lg:ps-8">
            <div className="eyeline">{t(lang, 'nextLine')}</div>
            {next ? (
              <>
                <div className="mt-2 flex items-start gap-2 text-lg leading-snug text-ink">
                  <StatusShape status={next.level} size={13} className={`mt-[0.4rem] ${next.level === 'critical' ? 'text-st-critical' : next.level === 'alert' ? 'text-st-alert' : 'text-st-watch'}`} />
                  <span>{tr(next.text)}</span>
                </div>
                <div className="mt-1 ps-[1.3rem] text-base text-ink-3">{tr(next.now)}</div>
              </>
            ) : <div className="mt-2 text-lg text-ink-3">{t(lang, 'topOfScale')}</div>}
            <div className="mt-6 eyeline">{t(lang, 'drawsOn')}</div>
            <ul className="mt-2 space-y-1.5">
              {portals.map((p) => (
                <li key={p.id}>
                  <a href={p.url} target="_blank" rel="noreferrer" className="link inline-flex items-center gap-1.5 text-base">{lang === 'ar' ? p.name_ar : p.name}<Icon name="external" size={15} /></a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}

/** A titled block on a monitor page. */
export function Panel({ title, dek, children, className = '' }: { title: string; dek?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 ${className}`}>
      <h2 className="text-2xl font-semibold text-ink">{title}</h2>
      {dek && <p className="mt-1 max-w-3xl text-base text-ink-2">{dek}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** The small data table under a chart. */
export function DataTable({ lang, head, rows }: { lang: Lang; head: string[]; rows: (string | number)[][] }) {
  return (
    <details className="no-print mt-3 text-sm">
      <summary className="cursor-pointer text-ink-2 hover:text-ink">{lang === 'ar' ? 'عرض البيانات' : 'View the data'}</summary>
      <div className="mt-2 max-h-72 overflow-auto rounded-lg border border-rule">
        <table className="tnum w-full text-start">
          <thead className="sticky top-0 bg-sunken"><tr>{head.map((h) => <th key={h} className="px-3 py-1.5 text-start font-medium text-ink-2">{h}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i} className="border-t border-rule">{r.map((c, j) => <td key={j} className="px-3 py-1.5 text-ink">{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </details>
  );
}

/** Legend swatches for a chart. */
export function Legend({ items }: { items: { label: string; color: 's1' | 's2' | 'ctx' }[] }) {
  const bg = { s1: 'bg-s1', s2: 'bg-s2', ctx: 'bg-ctx' };
  return (
    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-base text-ink-2">
      {items.map((it) => <span key={it.label} className="inline-flex items-center gap-2"><span className={`inline-block h-[3px] w-6 rounded ${bg[it.color]}`} />{it.label}</span>)}
    </div>
  );
}

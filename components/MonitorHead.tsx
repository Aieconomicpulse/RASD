import { t } from '@/lib/i18n';
import { MONITORS, SIGNAL_NAME, face, monitor, monitorConditions, monitorStatus } from '@/lib/monitors';
import type { L, Lang, MonitorId, Snapshot } from '@/lib/types';
import Gauge from './Gauge';
import Icon, { type IconName } from './Icons';
import MonitorTabs from './MonitorTabs';
import { PORTALS } from './PortalLinks';
import StatusPill from './StatusPill';

const ICON: Record<MonitorId, IconName> = { gdp: 'gdp', inflation: 'inflation', spending: 'spending', sentiment: 'sentiment' };

/** The top of every monitor page: the tabs across the four screens, then this screen's reading and its gauges. */
export default function MonitorHead({ s, lang, id }: { s: Snapshot; lang: Lang; id: MonitorId }) {
  const tr = (l: L) => l[lang];
  const m = monitor(id);
  const status = monitorStatus(s, id);
  const fc = face(s, id);
  const conds = monitorConditions(s, id);
  const portals = PORTALS.filter((p) => m.portals.includes(p.id));
  return (
    <header className="wrap pt-6 md:pt-8">
      <MonitorTabs label={t(lang, 'monitoring')} items={MONITORS.map((x) => ({ href: x.href, label: tr(x.short), status: monitorStatus(s, x.id) }))} />
      <div className={`screen screen-${status} mt-6 p-6 pt-7 md:p-8 md:pt-9`}>
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="inline-flex items-center gap-2.5 text-ink"><Icon name={ICON[id]} size={24} className="text-ink-2" /><h1 className="text-2xl font-semibold">{tr(m.name)}</h1></span>
              <StatusPill status={status} lang={lang} />
            </div>
            <p className="mt-1 text-base text-ink-3">{tr(m.question)}</p>
            <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="figure font-display text-6xl leading-none"><bdi dir="ltr">{fc.value}</bdi></span>
              <span className="text-lg text-ink-2">{tr(fc.unit)}</span>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-1.5">
              {portals.map((p) => (
                <li key={p.id}><a href={p.url} target="_blank" rel="noreferrer" className="link inline-flex items-center gap-1.5 text-base">{lang === 'ar' ? p.name_ar : p.name}<Icon name="external" size={15} /></a></li>
              ))}
            </ul>
          </div>
          <div className="space-y-5 lg:col-span-7 lg:border-s lg:border-rule lg:ps-8">
            {conds.map((c) => <Gauge key={c.id} c={c} lang={lang} label={tr(SIGNAL_NAME[c.id] ?? { en: c.id, ar: c.id })} />)}
          </div>
        </div>
      </div>
    </header>
  );
}

/** A titled block on a monitor page. */
export function Panel({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 ${className}`}>
      <h2 className="text-2xl font-semibold text-ink">{title}</h2>
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

/** Before-and-since rows as bars: the measure, the two averages, and the change drawn around zero. */
export function BeforeSince({ lang, rows, head, good }: { lang: Lang; rows: { key: string; label_en: string; label_ar: string; pre: number; post: number; digits: number }[]; head: [string, string, string, string]; good: Record<string, 'up' | 'down' | 'none'> }) {
  const f = (n: number, d: number) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const signed = (n: number, d = 0) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${f(Math.abs(n), d)}`;
  const max = Math.max(10, ...rows.map((r) => Math.abs(((r.post - r.pre) / Math.abs(r.pre || 1)) * 100)));
  return (
    <div className="border-t-2 border-ink">
      <div className="grid grid-cols-12 gap-3 border-b border-rule py-2 text-sm font-medium text-ink-3">
        <div className="col-span-4">{head[0]}</div><div className="col-span-2 text-end">{head[1]}</div><div className="col-span-2 text-end">{head[2]}</div><div className="col-span-4">{head[3]}</div>
      </div>
      {rows.map((r) => {
        const ch = r.pre ? ((r.post - r.pre) / Math.abs(r.pre)) * 100 : 0;
        const g = good[r.key] ?? 'none';
        const w = Math.min(50, (Math.abs(ch) / max) * 50);
        return (
          <div key={r.key} className="grid grid-cols-12 items-center gap-3 border-b border-rule py-2.5">
            <div className="col-span-4 text-base text-ink">{lang === 'ar' ? r.label_ar : r.label_en}</div>
            <div className="tnum col-span-2 text-end text-base text-ink-2">{f(r.pre, r.digits)}</div>
            <div className="tnum col-span-2 text-end text-base font-semibold text-ink">{f(r.post, r.digits)}</div>
            <div className="col-span-4 flex items-center gap-3">
              <div className="relative h-3 flex-1" dir="ltr" role="img" aria-label={`${signed(ch)}%`}>
                <div className="absolute inset-y-0 left-1/2 w-px bg-ink-3" />
                <div className={`absolute inset-y-0 bg-ink-3 ${ch >= 0 ? 'rounded-r' : 'rounded-l'}`} style={ch >= 0 ? { left: '50%', width: `${w}%` } : { right: '50%', width: `${w}%` }} />
              </div>
              <span className={`tnum w-12 shrink-0 text-end text-base font-semibold ${g === 'none' || Math.round(ch) === 0 ? 'text-ink' : (g === 'up') === ch > 0 ? 'delta-good' : 'delta-bad'}`}><bdi dir="ltr">{signed(ch)}%</bdi></span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Horizontal bars for a short list of yearly values, with an optional second part stacked inside. */
export function BarList({ rows, fmt }: { rows: { label: string; value: number; part?: number; note?: string }[]; fmt: (v: number) => string }) {
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-12 items-center gap-3">
          <span className="tnum col-span-2 text-base text-ink">{r.label}</span>
          <span className="col-span-7 flex h-3.5 overflow-hidden rounded-full bg-s1/15" dir="ltr">
            {r.part !== undefined && <span className="block h-full bg-s2" style={{ width: `${(r.part / max) * 100}%` }} />}
            <span className="block h-full bg-s1" style={{ width: `${((r.value - (r.part ?? 0)) / max) * 100}%` }} />
          </span>
          <span className="tnum col-span-3 text-end text-base font-semibold text-ink"><bdi dir="ltr">{fmt(r.value)}</bdi>{r.note && <span className="ms-1 text-sm font-normal text-ink-3">{r.note}</span>}</span>
        </li>
      ))}
    </ul>
  );
}

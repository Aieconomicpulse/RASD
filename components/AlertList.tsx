import Link from 'next/link';
import { PILLAR_MONITOR, monitor } from '@/lib/monitors';
import { PILLAR_NAME, PRIORITY_LABEL } from '@/lib/strategy';
import type { Decision, L, Lang, Priority } from '@/lib/types';
import { PriorityMark } from './StatusPill';

const RULE: Record<Priority, string> = { act: 'border-st-alert', prepare: 'border-st-watch', monitor: 'border-ink-3' };

/** Alerts as rows: priority, what to do, the evidence, and the monitor that shows it. */
export default function AlertList({ lang, items, showMonitor = true, showPriority = true }: { lang: Lang; items: Decision[]; showMonitor?: boolean; showPriority?: boolean }) {
  const tr = (l: L) => l[lang];
  if (!items.length) return <p className="text-base text-ink-3">{lang === 'ar' ? 'لا تنبيهات في هذا المستوى اليوم.' : 'Nothing at this level today.'}</p>;
  return (
    <ol className="divide-y divide-rule border-y border-rule">
      {items.map((d) => {
        const m = monitor(PILLAR_MONITOR[d.pillar]);
        return (
          <li key={d.id} className={`grid gap-x-6 gap-y-2 border-s-4 py-4 ps-4 md:grid-cols-12 ${RULE[d.priority]}`}>
            {showPriority && <div className="md:col-span-2"><PriorityMark priority={d.priority} label={tr(PRIORITY_LABEL[d.priority])} /></div>}
            <div className={showPriority ? 'md:col-span-7' : 'md:col-span-9'}>
              <h3 className="text-xl font-semibold leading-snug text-ink">{tr(d.title)}</h3>
              <p className="mt-1.5 text-base leading-relaxed text-ink-2">{tr(d.body)}</p>
            </div>
            <div className="text-sm text-ink-3 md:col-span-3 md:text-end">
              <div>{tr(PILLAR_NAME[d.pillar])}</div>
              {showMonitor && <Link href={m.href} className="link mt-1 inline-block text-sm">{lang === 'ar' ? `شاشة ${tr(m.short)}` : `${tr(m.short)} monitor`}</Link>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** The three counters along the top of the alerts board. */
export function AlertCounters({ lang, counts }: { lang: Lang; counts: Record<Priority, number> }) {
  const tr = (l: L) => l[lang];
  const order: Priority[] = ['act', 'prepare', 'monitor'];
  const lamp: Record<Priority, string> = { act: 'lamp-alert', prepare: 'lamp-watch', monitor: 'bg-sunken text-ink' };
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-3">
      {order.map((p) => (
        <div key={p} className="flex items-center gap-3">
          <span className={`lamp ${lamp[p]} tnum text-base font-bold`}>{counts[p]}</span>
          <span className="text-lg text-ink">{tr(PRIORITY_LABEL[p])}</span>
        </div>
      ))}
    </div>
  );
}

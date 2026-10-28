import modules from '@/config/modules.json';
import type { L, Lang, Pillar } from '@/lib/types';
import Icon, { type IconName } from './Icons';

export interface Portal { id: string; name: string; name_ar: string; project: string; url: string; pillar: Pillar; summary: string; summary_ar: string; now: L[]; next: L[] }
export const PORTALS = modules.modules as Portal[];
export const PORTAL_ICON: Record<string, IconName> = { foodwatch: 'foodwatch', macro: 'macro', shipping: 'shipping', stocks: 'stocks', jamarik: 'jamarik' };

/** The doors to the platforms, each opening alone in a new window. */
export default function PortalLinks({ lang, ids, compact = false }: { lang: Lang; ids?: string[]; compact?: boolean }) {
  const ar = lang === 'ar';
  const list = ids ? PORTALS.filter((p) => ids.includes(p.id)) : PORTALS;
  return (
    <ul className={compact ? 'flex flex-wrap gap-3' : 'grid gap-4 sm:grid-cols-2 xl:grid-cols-5'}>
      {list.map((p) => (
        <li key={p.id}>
          <a href={p.url} target="_blank" rel="noreferrer" className={`group flex items-center gap-3 rounded-xl border border-rule bg-surface hover:border-ink-3 ${compact ? 'px-3.5 py-2.5' : 'p-4'}`}>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-sunken text-accent"><Icon name={PORTAL_ICON[p.id] ?? 'portals'} size={24} /></span>
            <span className="min-w-0">
              <span className="block text-base font-semibold leading-tight text-ink">{ar ? p.name_ar : p.name}</span>
              {!compact && <span className="mt-0.5 block text-sm text-ink-3">{p.now.length ? (ar ? 'تغذّي الغرفة' : 'Feeds the room') : ar ? 'مرتبطة' : 'Linked'}</span>}
            </span>
            <Icon name="external" size={18} className="ms-auto shrink-0 text-ink-3 group-hover:text-ink" />
          </a>
        </li>
      ))}
    </ul>
  );
}

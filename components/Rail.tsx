'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon, { type IconName } from './Icons';

export interface RailItem { href: string; label: string; icon: IconName; badge?: number; badgeTone?: 'alert' | 'watch' | 'quiet' }

/**
 * The room's navigation: a rail of five doors on the start side of the screen (the end side in Arabic),
 * and the same five as a bar along the bottom on a phone. The alerts door carries a count.
 */
export default function Rail({ items, label }: { items: RailItem[]; label: string }) {
  const path = usePathname();
  const isActive = (href: string) => (href === '/' ? path === '/' : path === href || path.startsWith(href + '/'));
  return (
    <nav aria-label={label} className="rail no-print">
      <ul className="rail-list">
        {items.map((it) => {
          const active = isActive(it.href);
          return (
            <li key={it.href}>
              <Link href={it.href} aria-current={active ? 'page' : undefined} className={`rail-link ${active ? 'is-active' : ''}`}>
                <span className="rail-icon">
                  <Icon name={it.icon} size={24} />
                  {it.badge ? <span className={`rail-badge rail-badge-${it.badgeTone ?? 'quiet'}`} aria-label={`${it.badge}`}>{it.badge}</span> : null}
                </span>
                <span className="rail-label">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

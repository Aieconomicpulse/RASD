'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Status } from '@/lib/types';
import { StatusShape } from './StatusPill';

/** The strip over the four monitors: each tab carries its monitor's status shape in the status colour. */
export default function MonitorTabs({ items, label }: { items: { href: string; label: string; status: Status }[]; label: string }) {
  const path = usePathname();
  const tone: Record<Status, string> = { normal: 'text-st-normal', watch: 'text-st-watch', alert: 'text-st-alert', critical: 'text-st-critical' };
  return (
    <nav className="tabs" aria-label={label}>
      {items.map((it) => {
        const active = path === it.href;
        return (
          <Link key={it.href} href={it.href} aria-current={active ? 'page' : undefined} className={`tab ${active ? 'is-active' : ''}`}>
            <StatusShape status={it.status} size={11} className={tone[it.status]} />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}

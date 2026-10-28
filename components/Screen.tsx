import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Condition } from '@/lib/status';
import type { L, Lang, Status } from '@/lib/types';
import type { Face } from '@/lib/monitors';
import Gauge from './Gauge';
import Icon, { type IconName } from './Icons';
import MiniTrend from './MiniTrend';
import StatusPill from './StatusPill';

/**
 * A screen on the wall: name and status along the bezel, one big reading, a gauge showing how far the
 * reading sits from its next line, and the last six months as a trace. The whole screen is the door to the monitor.
 */
export function Screen({ lang, href, name, icon, status, face, gauge, cta }:
  { lang: Lang; href: string; name: L; icon: IconName; status: Status; face: Face; gauge?: Condition; cta: string }) {
  const tr = (l: L) => l[lang];
  return (
    <Link href={href} className={`screen screen-${status} p-5 pt-6 sm:p-6 sm:pt-7`} aria-label={`${tr(name)}: ${face.value} ${tr(face.unit)}. ${cta}`}>
      <div className="flex min-h-[3.25rem] items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 text-ink">
          <Icon name={icon} size={22} className="shrink-0 text-ink-2" />
          <span className="text-lg font-semibold leading-tight">{tr(name)}</span>
        </div>
        <StatusPill status={status} lang={lang} />
      </div>
      <div className="mt-4">
        <span className="figure font-display text-[2.75rem] leading-none sm:text-5xl"><bdi dir="ltr">{face.value}</bdi></span>
      </div>
      <div className="mt-1.5 text-base text-ink-2">{tr(face.unit)}</div>
      <div className="mt-4 text-base leading-snug text-ink">{tr(face.lines[0])}</div>
      {gauge && <div className="mt-4"><Gauge c={gauge} lang={lang} compact /></div>}
      <div className="mt-4"><MiniTrend data={face.trend} label={tr(name)} zero={face.zero} /></div>
    </Link>
  );
}

/** A section of the wall: a title with an optional door at the end of the line. */
export function Wall({ title, door, children }: { title: string; door?: { href: string; label: string }; children: ReactNode }) {
  return (
    <section className="wrap mt-12 first:mt-0">
      <div className="flex items-baseline justify-between gap-6">
        <h2 className="section-title">{title}</h2>
        {door && <Link href={door.href} className="link shrink-0 text-lg">{door.label}</Link>}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

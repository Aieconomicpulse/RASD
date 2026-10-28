import Link from 'next/link';
import type { ReactNode } from 'react';
import type { L, Lang, Status } from '@/lib/types';
import type { Face } from '@/lib/monitors';
import Icon, { type IconName } from './Icons';
import MiniTrend from './MiniTrend';
import StatusPill from './StatusPill';

/**
 * A screen on the wall: the monitor's name and status along the bezel, one big reading,
 * two lines that qualify it, and the last six months as a line. The whole screen is the door to the monitor.
 */
export function Screen({ lang, href, name, icon, status, face, cta }:
  { lang: Lang; href: string; name: L; icon: IconName; status: Status; face: Face; cta: string }) {
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
      <div className="mt-5 flex items-baseline gap-3">
        <span className="figure font-display text-[2.75rem] leading-none sm:text-5xl"><bdi dir="ltr">{face.value}</bdi></span>
      </div>
      <div className="mt-1.5 text-base text-ink-2">{tr(face.unit)}</div>
      <ul className="mt-4 space-y-1 text-base leading-snug text-ink">
        {face.lines.map((l, i) => <li key={i}>{tr(l)}</li>)}
      </ul>
      <div className="mt-5"><MiniTrend data={face.trend} label={tr(name)} zero={face.zero} /></div>
      <div className="mt-4 text-sm font-medium text-accent">{cta}</div>
    </Link>
  );
}

/** A section of the wall with its title and an optional door at the end of the title line. */
export function Wall({ title, dek, door, children }: { title: string; dek?: string; door?: { href: string; label: string }; children: ReactNode }) {
  return (
    <section className="wrap mt-14 first:mt-0">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <h2 className="section-title">{title}</h2>
          {dek && <p className="mt-2 max-w-3xl text-lg text-ink-2">{dek}</p>}
        </div>
        {door && <Link href={door.href} className="link text-lg">{door.label}</Link>}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

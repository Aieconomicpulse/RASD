import { STATUS_LABEL } from '@/lib/status';
import type { Lang, Priority, Status } from '@/lib/types';

/** Each status has its own shape so it never relies on colour alone: circle, diamond, triangle, octagon. */
export function StatusShape({ status, size = 12, className = '' }: { status: Status; size?: number; className?: string }) {
  const s = size;
  const common = { width: s, height: s, viewBox: '0 0 12 12', 'aria-hidden': true, className: `shrink-0 ${className}` } as const;
  if (status === 'normal') return <svg {...common}><circle cx="6" cy="6" r="5" fill="currentColor" /></svg>;
  if (status === 'watch') return <svg {...common}><path d="M6 0.6 11.4 6 6 11.4 0.6 6Z" fill="currentColor" /></svg>;
  if (status === 'alert') return <svg {...common}><path d="M6 0.8 11.6 11H0.4Z" fill="currentColor" /></svg>;
  return <svg {...common}><path d="M3.6 0.5h4.8l3.1 3.1v4.8l-3.1 3.1H3.6L0.5 8.4V3.6Z" fill="currentColor" /></svg>;
}

export default function StatusPill({ status, lang, size = 'md' }: { status: Status; lang: Lang; size?: 'md' | 'lg' }) {
  return (
    <span className={`pill pill-${status} ${size === 'lg' ? 'pill-lg' : ''}`}>
      <StatusShape status={status} size={size === 'lg' ? 13 : 11} />
      {STATUS_LABEL[status][lang]}
    </span>
  );
}

const PRIORITY_COLOR: Record<Priority, string> = { act: 'text-st-alert', prepare: 'text-st-watch', monitor: 'text-ink-3' };
const PRIORITY_SHAPE: Record<Priority, Status> = { act: 'alert', prepare: 'watch', monitor: 'normal' };
export function PriorityMark({ priority, label }: { priority: Priority; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-base font-semibold text-ink">
      {priority === 'monitor'
        ? <svg width="13" height="13" viewBox="0 0 12 12" aria-hidden className="shrink-0 text-ink-3"><circle cx="6" cy="6" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
        : <StatusShape status={PRIORITY_SHAPE[priority]} size={13} className={PRIORITY_COLOR[priority]} />}
      {label}
    </span>
  );
}

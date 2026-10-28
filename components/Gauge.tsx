import type { Condition } from '@/lib/status';
import { levelOf, STATUS_LABEL } from '@/lib/status';
import type { Lang, Status } from '@/lib/types';
import { StatusShape } from './StatusPill';

const ZONE: Record<Status, string> = { normal: 'bg-ink-3/20', watch: 'bg-st-watch/40', alert: 'bg-st-alert/50', critical: 'bg-st-critical/55' };
const TONE: Record<Status, string> = { normal: 'text-st-normal', watch: 'text-st-watch', alert: 'text-st-alert', critical: 'text-st-critical' };

/**
 * A threshold gauge: the signal's scale laid out left to right from calm to critical, the zones in the
 * status colours, and a marker where the reading sits today. Worse is always to the right, whichever
 * direction the underlying number moves. HTML, so labels stay upright in any width and language.
 */
export default function Gauge({ c, lang, label, compact = false }: { c: Condition; lang: Lang; label?: string; compact?: boolean }) {
  const levels = (['watch', 'alert', 'critical'] as const).filter((l) => c.levels[l] !== undefined).map((l) => ({ level: l as Status, t: c.levels[l]! }));
  if (!levels.length) return null;
  const sign = c.dir === 'rise' ? 1 : -1;
  let floor = levels[0].t - sign * c.scale * 1.5;
  let ceil = levels[levels.length - 1].t + sign * c.scale * 0.75;
  if (sign * (c.value - ceil) > 0) ceil = c.value + sign * c.scale * 0.25;
  if (sign * (floor - c.value) > 0) floor = c.value - sign * c.scale * 0.25;
  const p = (v: number) => Math.max(0, Math.min(100, ((v - floor) / (ceil - floor)) * 100));
  const bounds = [floor, ...levels.map((l) => l.t), ceil];
  const zones = [{ level: 'normal' as Status, from: p(bounds[0]), to: p(bounds[1]) }, ...levels.map((l, i) => ({ level: l.level, from: p(bounds[i + 1]), to: p(bounds[i + 2]) }))];
  const now = levelOf(c);
  const x = p(c.value);
  const edge = (pos: number) => (pos < 12 ? 'translate-x-0' : pos > 88 ? '-translate-x-full' : '-translate-x-1/2');
  const reading = c.now(c.value, lang);

  if (compact) {
    return (
      <div dir="ltr" className="relative h-2.5 w-full" role="img" aria-label={`${label ?? ''} ${reading}`.trim()}>
        <div className="absolute inset-x-0 top-0.5 flex h-1.5 overflow-hidden rounded-full">
          {zones.map((z) => <div key={z.level} className={ZONE[z.level]} style={{ width: `${z.to - z.from}%` }} />)}
        </div>
        <span className="absolute top-0 h-2.5 w-[3px] -translate-x-1/2 rounded-sm bg-ink ring-2 ring-page" style={{ left: `${x}%` }} />
      </div>
    );
  }
  return (
    <div className="w-full" role="img" aria-label={`${label ?? ''}: ${reading}, ${STATUS_LABEL[now][lang]}`}>
      {label && <div className="mb-1 flex items-center justify-between gap-3 text-sm text-ink-2"><span>{label}</span><span className={`inline-flex items-center gap-1.5 font-semibold text-ink`}><StatusShape status={now} size={10} className={TONE[now]} />{STATUS_LABEL[now][lang]}</span></div>}
      <div dir="ltr" className="relative h-14">
        <div className={`absolute top-0 whitespace-nowrap text-base font-semibold text-ink ${edge(x)}`} style={{ left: `${x}%` }}><bdi>{reading}</bdi></div>
        <div className="absolute inset-x-0 top-7 flex h-2 overflow-hidden rounded-full">
          {zones.map((z) => <div key={z.level} className={ZONE[z.level]} style={{ width: `${z.to - z.from}%` }} />)}
        </div>
        <span className="absolute top-[1.35rem] h-5 w-[3px] -translate-x-1/2 rounded-sm bg-ink ring-2 ring-page" style={{ left: `${x}%` }} />
        {levels.map((l) => (
          <div key={l.level} className={`absolute top-10 whitespace-nowrap text-xs text-ink-3 ${edge(p(l.t))}`} style={{ left: `${p(l.t)}%` }}>
            <span className="inline-flex items-center gap-1"><StatusShape status={l.level} size={8} className={TONE[l.level]} /><bdi>{c.now(l.t, lang)}</bdi></span>
          </div>
        ))}
      </div>
    </div>
  );
}

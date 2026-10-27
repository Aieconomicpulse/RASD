import type { Point } from '@/lib/types';

/**
 * A small server-rendered trend line for a stat: the history in the de-emphasis grey, the latest
 * reading as a dot in the accent series colour. No axes — the number beside it carries the value.
 * The line stretches with the tile; the dot is HTML so it stays round at any width.
 */
export default function MiniTrend({ data, label, zero = false }: { data: Point[]; label: string; zero?: boolean }) {
  if (data.length < 2) return null;
  const vals = data.map((d) => d.value);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (zero) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
  if (hi === lo) { hi += 1; lo -= 1; }
  const pad = 8; // % of height kept clear top and bottom
  const x = (i: number) => (i / (data.length - 1)) * 100;
  const y = (v: number) => pad + (1 - (v - lo) / (hi - lo)) * (100 - pad * 2);
  const d = data.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(2)} ${y(p.value).toFixed(2)}`).join(' ');
  const last = data[data.length - 1];
  return (
    <div className="relative h-10 w-full" role="img" aria-label={label} dir="ltr">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        {zero && <line x1="0" x2="100" y1={y(0)} y2={y(0)} stroke="rgb(var(--rule))" strokeWidth="1" vectorEffect="non-scaling-stroke" />}
        <path d={d} fill="none" stroke="rgb(var(--context))" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-s1 ring-2 ring-page" style={{ left: '100%', top: `${y(last.value)}%` }} />
    </div>
  );
}

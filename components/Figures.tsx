import type { ReactNode } from 'react';
import type { HormuzGrade, Lang, Point } from '@/lib/types';
import MiniTrend from './MiniTrend';

const fmt = (n: number, d: number) => Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

/** A signed change, coloured by whether that direction is good news; neutral when it is neither. */
export function Delta({ value, good = 'none', digits = 1, suffix = '%' }: { value?: number | null; good?: 'up' | 'down' | 'none'; digits?: number; suffix?: string }) {
  if (value === undefined || value === null || !Number.isFinite(value)) return <span className="text-ink-3">—</span>;
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  const tone = good === 'none' || value === 0 ? 'text-ink' : (good === 'up') === value > 0 ? 'delta-good' : 'delta-bad';
  return <bdi dir="ltr" className={`font-semibold ${tone}`}>{sign}{fmt(value, digits)}{suffix}</bdi>;
}

/** A large standalone figure with what it is and where it comes from. */
export function Figure({ value, label, note, children }: { value: string; label: string; note?: string; children?: ReactNode }) {
  return (
    <div>
      <div className="figure text-5xl leading-none"><bdi dir="ltr">{value}</bdi></div>
      <div className="mt-2 text-lg leading-snug text-ink">{label}</div>
      {note && <div className="mt-1 text-sm text-ink-3">{note}</div>}
      {children}
    </div>
  );
}

/** A stat tile: label, value, a change against a named period, and the last six months. */
export function Kpi({ label, value, delta, good, period, trend, note, zero }:
  { label: string; value: string; delta?: number | null; good?: 'up' | 'down' | 'none'; period?: string; trend?: Point[]; note?: string; zero?: boolean }) {
  return (
    <div className="border-t border-rule pt-3">
      <div className="eyeline">{label}</div>
      <div className="figure mt-1 text-3xl"><bdi dir="ltr">{value}</bdi></div>
      {(delta !== undefined || note) && (
        <div className="mt-1 text-sm text-ink-2">
          {delta !== undefined && <><Delta value={delta} good={good} /> {period}</>}
          {note && <span className={delta !== undefined ? 'ms-1 text-ink-3' : 'text-ink-3'}>{note}</span>}
        </div>
      )}
      {trend && <div className="mt-2"><MiniTrend data={trend} label={label} zero={zero} /></div>}
    </div>
  );
}

/** A two-sided bar around zero: falls to the left, rises to the right, always drawn left-to-right. The bar is neutral; the number beside it says whether the move is good news. */
export function DivBar({ value, max, label }: { value: number; max: number; label: string }) {
  const w = Math.min(50, (Math.abs(value) / max) * 50);
  return (
    <div className="relative h-3 w-full" dir="ltr" role="img" aria-label={label}>
      <div className="absolute inset-y-0 left-1/2 w-px bg-ink-3" />
      <div className={`absolute inset-y-0 bg-ink-3 ${value >= 0 ? 'rounded-r' : 'rounded-l'}`}
        style={value >= 0 ? { left: '50%', width: `${w}%` } : { right: '50%', width: `${w}%` }} />
    </div>
  );
}

/** A share of a whole: one hue on a lighter track of the same hue. */
export function Meter({ pct, label }: { pct: number; label: string }) {
  return (
    <div className="h-2 w-full rounded-full bg-s1/15" dir="ltr" role="img" aria-label={label}>
      <div className="h-2 rounded-full bg-s1" style={{ width: `${Math.max(2, Math.min(100, pct))}%` }} />
    </div>
  );
}

const GRADE_BARS: Record<HormuzGrade, number> = { HIGH: 3, MEDIUM: 2, LOW: 1, NONE: 0, INDEX: 0 };
const GRADE_WORD: Record<HormuzGrade, { en: string; ar: string }> = { HIGH: { en: 'High', ar: 'مرتفع' }, MEDIUM: { en: 'Medium', ar: 'متوسط' }, LOW: { en: 'Low', ar: 'منخفض' }, NONE: { en: 'None', ar: 'لا يوجد' }, INDEX: { en: '—', ar: '—' } };
/** Hormuz exposure as an ordered three-step glyph plus the word — no status colours, it is a grade not a state. */
export function Grade({ g, lang }: { g: HormuzGrade; lang: Lang }) {
  const n = GRADE_BARS[g];
  return (
    <span className="inline-flex items-center gap-2 text-sm text-ink-2">
      <span className="inline-flex items-end gap-[3px]" aria-hidden dir="ltr">
        {[1, 2, 3].map((i) => <span key={i} className={`w-[5px] rounded-sm ${i <= n ? 'bg-ink-2' : 'bg-rule'}`} style={{ height: 4 + i * 4 }} />)}
      </span>
      {GRADE_WORD[g][lang]}
    </span>
  );
}

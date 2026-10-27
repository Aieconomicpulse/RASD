import type { ReactNode } from 'react';

const fmt = (n: number, d: number) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

export function Delta({ value, suffix = '%', digits = 1, invert = false }: { value?: number | null; suffix?: string; digits?: number; invert?: boolean }) {
  if (value === undefined || value === null || !Number.isFinite(value)) return <span className="text-mist-500">—</span>;
  const good = invert ? value <= 0 : value >= 0;
  const col = value === 0 ? 'text-mist-300' : good ? 'text-pulse-green' : 'text-pulse-red';
  return <span className={`num text-xs font-semibold ${col}`}>{value > 0 ? '+' : ''}{fmt(value, digits)}{suffix}</span>;
}

export default function Stat({ label, value, digits = 1, prefix = '', suffix = '', delta, deltaLabel, invert, children, big = false }:
  { label: string; value?: number | string | null; digits?: number; prefix?: string; suffix?: string; delta?: number | null; deltaLabel?: string; invert?: boolean; children?: ReactNode; big?: boolean }) {
  const v = typeof value === 'number' ? fmt(value, digits) : value ?? '—';
  return (
    <div className="min-w-0">
      <div className="label leading-tight">{label}</div>
      <div className={`num mt-1 font-semibold leading-none text-white ${big ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl'}`}>{prefix}{v}{suffix && <span className="text-sm text-mist-500"> {suffix}</span>}</div>
      {(delta !== undefined || children) && (
        <div className="mt-1 flex items-center gap-2 text-xs text-mist-500">
          {delta !== undefined && <Delta value={delta} invert={invert} />}
          {deltaLabel && <span>{deltaLabel}</span>}
          {children}
        </div>
      )}
    </div>
  );
}

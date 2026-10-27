'use client';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Lang } from '@/lib/types';

export interface ChartSeries { key: string; label: string; color: 'series-1' | 'series-2' | 'context'; width?: number; endLabel?: boolean }
type Row = Record<string, string | number>;

const LOCALE: Record<Lang, string> = { en: 'en-GB', ar: 'ar-SA-u-nu-latn-ca-gregory' };
const fmtNum = (v: number, digits: number) => v.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/**
 * A weekly line chart with one axis, hairline grid, an optional baseline and an optional event marker.
 * Lines end in a dot with a direct label; the tooltip reads every series at the hovered week.
 */
export default function TrendChart({ data, series, lang, height = 300, digits = 1, prefix = '', suffix = '', refY, event, yDomain, title }:
  { data: Row[]; series: ChartSeries[]; lang: Lang; height?: number; digits?: number; prefix?: string; suffix?: string;
    refY?: { y: number; label: string; position?: 'insideTopLeft' | 'insideBottomRight' | 'insideTopRight' | 'insideBottomLeft' }; event?: { date: string; label: string }; yDomain?: [number | 'auto' | 'dataMin' | 'dataMax', number | 'auto' | 'dataMin' | 'dataMax']; title: string }) {
  const dates = data.map((d) => String(d.date));
  // one tick per quarter: the first week of Jan, Apr, Jul, Oct
  const ticks = dates.filter((d, i) => i === 0 || (d.slice(5, 7) !== dates[i - 1].slice(5, 7) && ['01', '04', '07', '10'].includes(d.slice(5, 7))));
  const eventX = event ? dates.find((d) => d >= event.date) : undefined;
  const tick = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString(LOCALE[lang], { month: 'short', year: '2-digit', timeZone: 'UTC' });
  const fmt = (v: number) => `${prefix}${fmtNum(v, digits)}${suffix}`;
  const last = data.length - 1;

  const EndLabel = (color: string) => function EndLabelInner(props: { x?: number; y?: number; index?: number; value?: number }) {
    if (props.index !== last || props.x === undefined || props.y === undefined || props.value === undefined) return <g />;
    return (
      <g>
        <circle cx={props.x} cy={props.y} r={5} fill={`rgb(var(--${color}))`} stroke="rgb(var(--page))" strokeWidth={2} />
        <text x={props.x + 10} y={props.y + 5} fill="rgb(var(--ink))" fontSize={15} fontWeight={600}>{fmt(props.value)}</text>
      </g>
    );
  };

  return (
    <figure dir="ltr" className="w-full" aria-label={title}>
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 28, right: 64, bottom: 4, left: 4 }}>
            <CartesianGrid vertical={false} stroke="rgb(var(--rule))" />
            <XAxis dataKey="date" ticks={ticks} tickFormatter={tick} tick={{ fill: 'rgb(var(--ink-3))', fontSize: 14 }} axisLine={{ stroke: 'rgb(var(--rule))' }} tickLine={false} minTickGap={12} />
            <YAxis domain={yDomain ?? ['auto', 'auto']} tickFormatter={(v: number) => `${prefix}${fmtNum(v, digits > 1 ? digits : 0)}${suffix}`} tick={{ fill: 'rgb(var(--ink-3))', fontSize: 14 }} axisLine={false} tickLine={false} width={56} />
            {refY && (
              <ReferenceLine y={refY.y} stroke="rgb(var(--ink-3))" strokeWidth={1}
                label={{ value: refY.label, position: refY.position ?? 'insideBottomRight', fill: 'rgb(var(--ink-2))', fontSize: 14, offset: 8 }} />
            )}
            {eventX && (
              <ReferenceLine x={eventX} stroke="rgb(var(--ink-2))" strokeWidth={1}
                label={{ value: event!.label, position: 'top', fill: 'rgb(var(--ink-2))', fontSize: 14, fontWeight: 600 }} />
            )}
            <Tooltip
              cursor={{ stroke: 'rgb(var(--ink-3))', strokeWidth: 1 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-lg border border-rule bg-surface px-3 py-2 shadow-lg" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                    <div className="text-sm text-ink-3">{new Date(`${label}T00:00:00Z`).toLocaleDateString(LOCALE[lang], { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}</div>
                    {payload.map((p) => {
                      const s = series.find((x) => x.key === p.dataKey);
                      return (
                        <div key={String(p.dataKey)} className="mt-1 flex items-center gap-2">
                          <span className="inline-block h-0.5 w-4 rounded" style={{ background: `rgb(var(--${s?.color ?? 'series-1'}))` }} />
                          <span className="text-base font-semibold text-ink">{fmt(Number(p.value))}</span>
                          <span className="text-sm text-ink-2">{s?.label}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              }}
            />
            {series.map((s) => (
              <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={`rgb(var(--${s.color}))`} strokeWidth={s.width ?? 2}
                dot={false} activeDot={{ r: 5, stroke: 'rgb(var(--page))', strokeWidth: 2 }} isAnimationActive={false} label={s.endLabel === false ? undefined : EndLabel(s.color)} connectNulls={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

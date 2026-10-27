'use client';
import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, YAxis } from 'recharts';

let uid = 0;

/** A small area chart for a weekly or daily series. `data` is [{date, value}]; pass `zero` to draw the zero line (scores). */
export default function Sparkline({ data, color = '#4C8DFF', height = 64, domain, digits = 1, zero = false, prefix = '', label = '' }:
  { data: { date: string; value: number }[]; color?: string; height?: number; domain?: [number, number]; digits?: number; zero?: boolean; prefix?: string; label?: string }) {
  if (!data?.length) return <div className="h-16 rounded bg-ink-800/60" />;
  const id = `spark-${(uid = (uid + 1) % 1000)}`;
  return (
    <div style={{ height }} className="w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={domain ?? ['auto', 'auto']} />
          {zero && <ReferenceLine y={0} stroke="#27365A" strokeDasharray="3 3" />}
          <Tooltip contentStyle={{ background: '#0A1020', border: '1px solid #1F2B45', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#7C8AA6' }} formatter={(v: number) => [`${prefix}${Number(v).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`, label]} />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${id})`} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

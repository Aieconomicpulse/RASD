'use client';
import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, YAxis } from 'recharts';

export default function Sparkline({ data, color = '#4C8DFF', height = 64, domain }: { data: { date: string; score: number }[]; color?: string; height?: number; domain?: [number, number] }) {
  if (!data?.length) return <div className="h-16 rounded bg-ink-800/60" />;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
          <defs>
            <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={domain ?? ['auto', 'auto']} />
          <ReferenceLine y={0} stroke="#27365A" strokeDasharray="3 3" />
          <Tooltip contentStyle={{ background: '#0A1020', border: '1px solid #1F2B45', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#7C8AA6' }} formatter={(v: number) => [v.toFixed(2), 'score']} />
          <Area type="monotone" dataKey="score" stroke={color} strokeWidth={2} fill="url(#spark)" dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

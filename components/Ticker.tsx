import type { Snapshot } from '@/lib/types';

const f = (n: number, d = 1) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const s = (n?: number | null, d = 1) => (n === undefined || n === null ? '' : `${n > 0 ? '+' : ''}${f(n, d)}%`);

export default function Ticker({ snap }: { snap: Snapshot }) {
  const { shelves: sh, supply: su, confidence: co, economy: ec } = snap;
  const items = [
    ['BRENT', `$${f(co.brent.value)}`, `${s(co.brent.wow)} w/w`],
    ['TASI', f(co.tasi.value, 0), `${s(co.tasi.wow)} w/w`],
    ['FOOD CPI', f(sh.foodCpi.value), `${s(sh.foodCpi.wow)} w/w · ${s(sh.foodCpi.m4)} 4w`],
    ['CPI', f(sh.cpiOverall.value), `${s(sh.cpiOverall.wow)} w/w`],
    ['HORMUZ', su.hormuz.state.toUpperCase(), `${f(su.exposure.importsViaHormuzPct)}% of imports`],
    ['PORT CALLS', `${su.portCalls.weekly}/wk`, `${s(su.portCalls.wow)} w/w · ${s(su.portCalls.vs2025, 0)} vs 2025`],
    ['GDP', `$${f(ec.gdp.totalUsdT, 2)}T`, `${s(ec.gdp.momentum4w)} 4w`],
    ['NON-OIL GDP', `$${f(ec.gdp.nonOilUsdT, 2)}T`, `${f(100 - ec.gdp.oilShare, 0)}% of GDP`],
    ['SPENDING', f(ec.spending.value), `${s(ec.spending.wow)} w/w · ${s(ec.spending.yoy)} y/y`],
    ['PMI', f(co.pmi), `SAMA ${f(co.samaRate, 2)}%`],
    ['SENTIMENT', `${co.sentiment.score > 0 ? '+' : ''}${f(co.sentiment.score, 2)}`, co.sentiment.band],
  ];
  const row = items.map(([k, v, d], i) => (
    <span key={i} className="mx-5 inline-flex items-baseline gap-2 whitespace-nowrap">
      <span className="label">{k}</span>
      <span className="num text-sm font-semibold text-white">{v}</span>
      <span className="num text-xs text-mist-500">{d}</span>
    </span>
  ));
  return (
    <div dir="ltr" className="no-print overflow-hidden border-b border-line bg-ink-900/70">
      <div className="flex w-max animate-ticker py-1.5">{row}{row}</div>
    </div>
  );
}

import type { Snapshot } from '@/lib/types';

const f = (n: number, d = 1) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const s = (n?: number, d = 1) => (n === undefined ? '' : `${n > 0 ? '+' : ''}${f(n, d)}%`);

export default function Ticker({ snap }: { snap: Snapshot }) {
  const items = [
    ['BRENT', `$${f(snap.confidence.brent.value)}`, s(snap.confidence.brent.d1)],
    ['TASI', f(snap.confidence.tasi.value, 0), s(snap.confidence.tasi.d1)],
    ['FOOD CPI', f(snap.shelves.foodCpi.value), `${s(snap.shelves.foodCpi.wow)} w/w`],
    ['HORMUZ', snap.supply.hormuz.state.toUpperCase(), `${f(snap.supply.exposure.importsViaHormuzPct, 0)}% of imports`],
    ['PORT CALLS', `${snap.supply.portCalls.weekly}/wk`, s(snap.supply.portCalls.wow)],
    ['DAYS OF SUPPLY · GULF', `${snap.supply.inbound.daysOfSupplyGulfPorts}d`, `Red Sea ${snap.supply.inbound.daysOfSupplyRedSeaPorts}d`],
    ['SENTIMENT', `${snap.confidence.sentiment.score > 0 ? '+' : ''}${f(snap.confidence.sentiment.score, 2)}`, snap.confidence.sentiment.band],
    ['STOCK-OUTS', String(snap.shelves.stockouts.count), 'product × city'],
    ['SAMA', `${f(snap.confidence.samaRate, 2)}%`, `PMI ${f(snap.confidence.pmi)}`],
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

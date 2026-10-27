import { applyStatuses } from './status';
import { fetchOverlay, fetchSentiment, loadBaseSnapshot } from './sources';
import type { Snapshot } from './types';

function merge<T extends object>(base: T, over: Partial<T> | null): T {
  if (!over) return base;
  return { ...base, ...over, sample: false } as T;
}

/** Compose today's situation picture: base snapshot → live overlays → statuses. */
export async function getSituation(): Promise<Snapshot> {
  const base = await loadBaseSnapshot();
  const [sentiment, shelves, supply, confidence, markets] = await Promise.all([
    fetchSentiment(),
    fetchOverlay<Snapshot['shelves']>('SOURCE_CPI_URL'),
    fetchOverlay<Snapshot['supply']>('SOURCE_SUPPLY_URL'),
    fetchOverlay<Snapshot['confidence']>('SOURCE_MACRO_URL'),
    fetchOverlay<Snapshot['confidence']>('SOURCE_MARKETS_URL'),
  ]);
  const snap: Snapshot = {
    ...base,
    shelves: merge(base.shelves, shelves),
    supply: merge(base.supply, supply),
    confidence: {
      ...merge(merge(base.confidence, confidence), markets),
      sentiment: sentiment ?? base.confidence.sentiment,
    },
  };
  // The picture is "as of" the newest input we actually have.
  const stamps = [base.asOf, sentiment?.date ? `${sentiment.date}T06:00:00Z` : null].filter(Boolean) as string[];
  snap.asOf = stamps.sort().at(-1) ?? base.asOf;
  snap.sample = Boolean(snap.shelves.sample || snap.supply.sample || snap.confidence.sample);
  return applyStatuses(snap);
}

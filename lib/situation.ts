import { baseSnapshot } from './ksa';
import { applyStatuses } from './status';
import { buildStrategy } from './strategy';
import { fetchSentiment, loadDesk } from './sources';
import type { Snapshot } from './types';

/** Compose today's situation picture: KSA datasets + desk inputs → live sentiment overlay → statuses → strategy. */
export async function getSituation(): Promise<Snapshot> {
  const [desk, sentiment] = await Promise.all([loadDesk(), fetchSentiment()]);
  const snap = baseSnapshot(desk);
  if (sentiment) {
    // Keep the long daily history for the sparkline where the live feed is shorter.
    const seen = new Set(sentiment.trend.map((p) => p.date));
    const older = snap.confidence.sentiment.trend.filter((p) => p.date < sentiment.trend[0]?.date && !seen.has(p.date));
    snap.confidence.sentiment = { ...sentiment, trend: [...older, ...sentiment.trend].slice(-60) };
    snap.confidence.source = snap.confidence.source.replace('press sentiment daily', `press sentiment live to ${sentiment.date}`);
  }
  // The picture is "as of" the newest input we actually have.
  const stamps = [snap.asOf, sentiment?.date ? `${sentiment.date}T03:30:00Z` : null].filter(Boolean) as string[];
  snap.asOf = stamps.sort().at(-1) ?? snap.asOf;
  snap.sample = false;
  const out = applyStatuses(snap);
  const strategy = buildStrategy(out);
  out.strategy = strategy;
  out.overall = { ...out.overall, headline_en: `${strategy.headline.en} ${strategy.standfirst.en}`, headline_ar: `${strategy.headline.ar} ${strategy.standfirst.ar}` };
  return out;
}

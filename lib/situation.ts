import { baseSnapshot } from './ksa';
import { BAND_AR } from './sentiment';
import { applyStatuses } from './status';
import { fetchSentiment, loadDesk } from './sources';
import type { Snapshot } from './types';

/** Compose today's situation picture: KSA datasets + desk inputs → live sentiment overlay → statuses. */
export async function getSituation(): Promise<Snapshot> {
  const [desk, sentiment] = await Promise.all([loadDesk(), fetchSentiment()]);
  const snap = baseSnapshot(desk);
  if (sentiment) {
    // Keep the long daily history for the sparkline where the live feed is shorter.
    const seen = new Set(sentiment.trend.map((p) => p.date));
    const older = snap.confidence.sentiment.trend.filter((p) => p.date < sentiment.trend[0]?.date && !seen.has(p.date));
    snap.confidence.sentiment = { ...sentiment, trend: [...older, ...sentiment.trend].slice(-60) };
    snap.confidence.source = snap.confidence.source.replace('press sentiment daily', `press sentiment live (${sentiment.date})`);
    const sc = sentiment.score;
    snap.alerts.push({
      level: sc <= -0.6 ? 'critical' : sc <= -0.3 ? 'alert' : sc <= 0 ? 'watch' : 'info', time: `${sentiment.date}T03:30:00Z`, panel: 'confidence',
      text_en: `Press sentiment ${sc > 0 ? '+' : ''}${sc.toFixed(2)} (${sentiment.band}) across ${sentiment.headlineCount} headlines on ${sentiment.date}.`,
      text_ar: `معنويات الصحافة ${sc > 0 ? '+' : ''}${sc.toFixed(2)} (${BAND_AR[sentiment.band] ?? sentiment.band}) عبر ${sentiment.headlineCount} عنواناً بتاريخ ${sentiment.date}.`,
    });
  }
  // The picture is "as of" the newest input we actually have.
  const stamps = [snap.asOf, sentiment?.date ? `${sentiment.date}T03:30:00Z` : null].filter(Boolean) as string[];
  snap.asOf = stamps.sort().at(-1) ?? snap.asOf;
  snap.sample = false;
  const out = applyStatuses(snap);
  const order = { critical: 0, alert: 1, watch: 2, info: 3 };
  out.alerts.sort((a, b) => order[a.level] - order[b.level]);
  return out;
}

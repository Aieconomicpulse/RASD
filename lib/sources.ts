import fs from 'node:fs/promises';
import path from 'node:path';
import { sentimentBand } from './sentiment';
import type { Desk, SentimentReading } from './types';

const REVALIDATE = 1800; // seconds — every remote source is re-fetched at most twice an hour

async function getJson<T>(url: string, revalidate = REVALIDATE): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate }, headers: { accept: 'application/json' } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch { return null; }
}

/**
 * Desk inputs — the few things no feed can decide (the Hormuz state, a hand-written alert).
 * A hosted DESK_URL lets the desk change them without a deploy; otherwise data/desk.json ships with the build.
 */
export async function loadDesk(): Promise<Desk | null> {
  const hosted = process.env.DESK_URL;
  if (hosted) { const d = await getJson<Desk>(hosted, 300); if (d) return d; }
  try {
    const raw = await fs.readFile(path.join(process.cwd(), 'data', 'desk.json'), 'utf8');
    return JSON.parse(raw) as Desk;
  } catch { return null; }
}

interface KsaSentimentApi {
  snapshots: { date: string; overallScore: number; headlineCount: number; headlines: { headline: string; source?: string; sentiment?: string; score?: number; important?: boolean; date?: string }[] }[];
  source?: string;
}

/** Live overlay from the KSA platform's news-sentiment endpoint (the only part of the picture fetched at request time). */
export async function fetchSentiment(): Promise<SentimentReading | null> {
  const url = process.env.SOURCE_SENTIMENT_URL;
  if (!url) return null;
  const api = await getJson<KsaSentimentApi>(url);
  if (!api?.snapshots?.length) return null;
  const snaps = [...api.snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const last = snaps[snaps.length - 1];
  return {
    score: Number(last.overallScore.toFixed(3)),
    band: sentimentBand(last.overallScore),
    date: last.date,
    headlineCount: last.headlineCount,
    trend: snaps.slice(-60).map((s) => ({ date: s.date, score: Number(s.overallScore.toFixed(3)), headlines: s.headlineCount })),
    headlines: last.headlines.filter((h) => h.important).slice(0, 8).map((h) => ({ headline: h.headline, source: h.source, sentiment: h.sentiment, score: h.score, important: h.important, date: h.date })),
    live: true,
  };
}

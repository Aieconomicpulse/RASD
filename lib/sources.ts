import fs from 'node:fs/promises';
import path from 'node:path';
import type { SentimentReading, Snapshot } from './types';

const REVALIDATE = 1800; // seconds — every source is re-fetched at most twice an hour

async function getJson<T>(url: string, revalidate = REVALIDATE): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate }, headers: { accept: 'application/json' } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch { return null; }
}

/** Base snapshot: hosted SNAPSHOT_URL → data/snapshot.json (built by scripts/build-snapshot.mjs) → the sample. */
export async function loadBaseSnapshot(): Promise<Snapshot> {
  const hosted = process.env.SNAPSHOT_URL;
  if (hosted) { const s = await getJson<Snapshot>(hosted); if (s) return s; }
  for (const file of ['snapshot.json', 'snapshot.sample.json']) {
    try {
      const raw = await fs.readFile(path.join(process.cwd(), 'data', file), 'utf8');
      return JSON.parse(raw) as Snapshot;
    } catch { /* try next */ }
  }
  throw new Error('No snapshot available');
}

/** Band from a pooled daily score, −1…+1 (same bands the KSA platform uses). */
export function sentimentBand(score: number): string {
  if (score >= 0.6) return 'strongly positive';
  if (score >= 0.2) return 'positive';
  if (score > -0.2) return 'neutral';
  if (score > -0.6) return 'negative';
  return 'strongly negative';
}

interface KsaSentimentApi {
  snapshots: { date: string; overallScore: number; headlineCount: number; headlines: { headline: string; source?: string; sentiment?: string; score?: number; important?: boolean; date?: string }[] }[];
  source?: string;
}

/** Live overlay from the KSA platform's open news-sentiment endpoint. */
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

/**
 * Partial overlays for the other panels. Each expects a JSON object shaped like the matching
 * block of the snapshot (see data/snapshot.sample.json). Missing fields keep the base values.
 */
export async function fetchOverlay<T extends object>(envName: string): Promise<Partial<T> | null> {
  const url = process.env[envName];
  if (!url) return null;
  return getJson<Partial<T>>(url);
}

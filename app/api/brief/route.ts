import { NextResponse, type NextRequest } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getSituation } from '@/lib/situation';
import { templateBrief } from '@/lib/brief';
import { aiBrief } from '@/lib/brief-ai';
import type { Lang } from '@/lib/types';

const cachedBrief = unstable_cache(
  async (lang: Lang) => {
    const snap = await getSituation();
    const base = templateBrief(snap, lang);
    const doc = (await aiBrief(snap, base, lang)) ?? base;
    return { date: snap.asOf, lang, status: snap.overall.status, ...doc };
  },
  ['rasd-brief-v2'],
  { revalidate: 3600 },
);

/** Today's brief: polished by the model when ANTHROPIC_API_KEY is set, otherwise composed deterministically from the picture. */
export async function GET(req: NextRequest) {
  const lang: Lang = req.nextUrl.searchParams.get('lang') === 'ar' ? 'ar' : 'en';
  return NextResponse.json(await cachedBrief(lang));
}

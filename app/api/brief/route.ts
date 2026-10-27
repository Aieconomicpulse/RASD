import { NextResponse, type NextRequest } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getSituation } from '@/lib/situation';
import { templateBrief } from '@/lib/brief';
import { aiBrief } from '@/lib/brief-ai';
import type { Lang } from '@/lib/types';

const cachedBrief = unstable_cache(
  async (lang: Lang) => {
    const snap = await getSituation();
    const ai = await aiBrief(snap, lang);
    return { date: snap.asOf, lang, generated: Boolean(ai), paragraphs: ai ?? templateBrief(snap, lang), sample: snap.sample };
  },
  ['rasd-brief'],
  { revalidate: 3600 },
);

/** Today's brief: model-written when ANTHROPIC_API_KEY is set, otherwise composed deterministically from the picture. */
export async function GET(req: NextRequest) {
  const lang: Lang = req.nextUrl.searchParams.get('lang') === 'ar' ? 'ar' : 'en';
  return NextResponse.json(await cachedBrief(lang));
}

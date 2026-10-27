import { NextResponse } from 'next/server';
import { getSituation } from '@/lib/situation';

export const dynamic = 'force-dynamic'; // upstream fetches are cached 30 min in lib/sources.ts

/** The composed daily picture as JSON — the same object the pages render. */
export async function GET() {
  const snap = await getSituation();
  return NextResponse.json(snap, { headers: { 'cache-control': 'private, max-age=300' } });
}

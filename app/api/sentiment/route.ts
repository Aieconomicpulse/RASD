import { NextResponse } from 'next/server';
import { fetchSentiment } from '@/lib/sources';

export const revalidate = 1800;

/** Live press-sentiment reading, proxied from the KSA platform. */
export async function GET() {
  const s = await fetchSentiment();
  if (!s) return NextResponse.json({ error: 'sentiment source unavailable' }, { status: 503 });
  return NextResponse.json(s);
}

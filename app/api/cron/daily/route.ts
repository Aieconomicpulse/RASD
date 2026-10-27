import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';

/**
 * 06:30 Riyadh every day (03:30 UTC, see vercel.json): refresh the picture and warm the brief.
 * Vercel sends Authorization: Bearer <CRON_SECRET>; a ?key= query works for manual runs.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization') ?? '';
  const key = req.nextUrl.searchParams.get('key');
  if (secret && auth !== `Bearer ${secret}` && key !== secret) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  revalidatePath('/'); revalidatePath('/brief'); revalidatePath('/api/situation'); revalidatePath('/api/brief');
  const origin = req.nextUrl.origin;
  const warm = await fetch(`${origin}/api/brief?lang=en`, { headers: { cookie: req.headers.get('cookie') ?? '' } }).then((r) => r.status).catch(() => 0);
  return NextResponse.json({ ok: true, refreshed: new Date().toISOString(), briefWarm: warm });
}

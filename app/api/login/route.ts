import { NextResponse, type NextRequest } from 'next/server';
import { makeToken, SESSION_COOKIE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({ password: '' }));
  const expected = process.env.PORTAL_PASSWORD; const secret = process.env.SESSION_SECRET;
  if (!expected || !secret) return NextResponse.json({ ok: true, note: 'gate not configured' });
  if (typeof password !== 'string' || password !== expected) {
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await makeToken(secret), { httpOnly: true, sameSite: 'lax', secure: req.nextUrl.protocol === 'https:', path: '/', maxAge: 60 * 60 * 12 });
  return res;
}

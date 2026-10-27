import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifyToken } from '@/lib/auth';

const PUBLIC = ['/login', '/api/login', '/api/logout', '/api/cron/daily', '/favicon.ico', '/icon.svg'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + '/')) || pathname.startsWith('/_next')) return NextResponse.next();
  const secret = process.env.SESSION_SECRET;
  if (!process.env.PORTAL_PASSWORD || !secret) return NextResponse.next(); // gate off until configured (local dev)
  const ok = await verifyToken(secret, req.cookies.get(SESSION_COOKIE)?.value);
  if (ok) return NextResponse.next();
  if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  const url = req.nextUrl.clone(); url.pathname = '/login'; url.searchParams.set('next', pathname);
  return NextResponse.redirect(url);
}

export const config = { matcher: ['/((?!_next/static|_next/image).*)'] };

import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'rasd_session';
export const LANG_COOKIE = 'rasd_lang';

const enc = new TextEncoder();

async function hmac(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Session token: "<expiry-ms>.<hmac>" — works in the Edge middleware and in Node route handlers. */
export async function makeToken(secret: string, ttlMs = 1000 * 60 * 60 * 12): Promise<string> {
  const exp = String(Date.now() + ttlMs);
  return `${exp}.${await hmac(secret, exp)}`;
}

export async function verifyToken(secret: string, token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig) return false;
  if (Number(exp) < Date.now()) return false;
  return (await hmac(secret, exp)) === sig;
}

export async function currentLang(): Promise<'en' | 'ar'> {
  const c = await cookies();
  return c.get(LANG_COOKIE)?.value === 'ar' ? 'ar' : 'en';
}

export const THEME_COOKIE = 'rasd_theme';
/** 'light' | 'dark' when the viewer chose one; null follows the device setting. */
export async function currentTheme(): Promise<'light' | 'dark' | null> {
  const v = (await cookies()).get(THEME_COOKIE)?.value;
  return v === 'light' || v === 'dark' ? v : null;
}

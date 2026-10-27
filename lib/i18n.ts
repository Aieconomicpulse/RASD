import type { L, Lang } from './types';

/** Shared interface strings. Page-specific copy lives next to the page as bilingual {en, ar} pairs. */
export const T = {
  brand: { en: 'Rasd', ar: 'رصد' },
  tagline: { en: 'Daily economic situation picture, Kingdom of Saudi Arabia', ar: 'صورة الوضع الاقتصادي اليومية، المملكة العربية السعودية' },
  by: { en: 'AI Economic Pulse', ar: 'AI Economic Pulse' },
  situation: { en: 'Situation', ar: 'الوضع' },
  brief: { en: 'Daily brief', ar: 'الموجز اليومي' },
  sources: { en: 'Sources', ar: 'المصادر' },
  signIn: { en: 'Sign in', ar: 'تسجيل الدخول' },
  signOut: { en: 'Sign out', ar: 'خروج' },
  password: { en: 'Access code', ar: 'رمز الدخول' },
  wrongCode: { en: 'That access code is not right. Check it and try again.', ar: 'رمز الدخول غير صحيح. تحقّق منه وأعد المحاولة.' },
  authorized: { en: 'For authorised personnel. Access is logged.', ar: 'للمخوّلين فقط. يُسجَّل الدخول.' },
  riyadh: { en: 'Riyadh time', ar: 'بتوقيت الرياض' },
  print: { en: 'Print or save as PDF', ar: 'طباعة أو حفظ PDF' },
  openPlatform: { en: 'Open platform', ar: 'فتح المنصة' },
  themeDark: { en: 'Switch to the dark theme', ar: 'التحويل إلى الوضع الداكن' },
  themeLight: { en: 'Switch to the light theme', ar: 'التحويل إلى الوضع الفاتح' },
  otherLang: { en: 'العربية', ar: 'English' },
  indicators: {
    en: 'Every figure is an indicator built from public and partner data. Connected to the Kingdom’s own feeds, it becomes an operating picture.',
    ar: 'جميع الأرقام مؤشرات مبنية على بيانات عامة وبيانات شركاء، وتصبح صورة تشغيلية عند ربطها ببيانات المملكة.',
  },
} as const satisfies Record<string, L>;

export type Key = keyof typeof T;
export const t = (lang: Lang, key: Key): string => T[key][lang];
export const tx = (l: L, lang: Lang): string => l[lang];
export const dir = (lang: Lang) => (lang === 'ar' ? 'rtl' : 'ltr');

/** Dates: Gregorian with Latin digits in both languages; the Arabic header adds the Hijri date. */
export const DATE_LOCALE: Record<Lang, string> = { en: 'en-GB', ar: 'ar-SA-u-nu-latn-ca-gregory' };
export const HIJRI_LOCALE = 'ar-SA-u-nu-latn-ca-islamic-umalqura';
export function fmtDate(iso: string, lang: Lang, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) {
  const d = iso.length <= 10 ? new Date(`${iso}T00:00:00Z`) : new Date(iso);
  return d.toLocaleDateString(DATE_LOCALE[lang], { timeZone: iso.length <= 10 ? 'UTC' : 'Asia/Riyadh', ...opts });
}

/**
 * Keep signed figures, money and percentages reading left-to-right inside Arabic sentences
 * ("+6.5%", not "6.5%+") by wrapping them in Unicode isolates. Years, dates and plain counts are left alone.
 */
const LRI = '⁦', PDI = '⁩';
export const isoNums = (s: string) =>
  s.replace(/[+−-]?\$?\d[\d,]*(?:\.\d+)?(?:%|T\b|B\b|M\b)?/g, (m) => (/^[+−-]|\$|%/.test(m) ? `${LRI}${m}${PDI}` : m));
/** Apply isoNums to every Arabic string in a nested {en, ar} structure. */
export function isoDeep<T>(x: T): T {
  if (Array.isArray(x)) return x.map(isoDeep) as unknown as T;
  if (x && typeof x === 'object') {
    const o: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(x as Record<string, unknown>)) o[k] = k === 'ar' && typeof v === 'string' ? isoNums(v) : isoDeep(v);
    return o as T;
  }
  return x;
}

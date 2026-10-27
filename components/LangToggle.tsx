'use client';
import { useRouter } from 'next/navigation';
import type { Lang } from '@/lib/types';

export default function LangToggle({ lang }: { lang: Lang }) {
  const router = useRouter();
  const other: Lang = lang === 'ar' ? 'en' : 'ar';
  return (
    <button
      type="button"
      onClick={() => { document.cookie = `rasd_lang=${other}; path=/; max-age=31536000; samesite=lax`; router.refresh(); }}
      className="rounded-md border border-line px-2.5 py-1 text-xs font-semibold text-mist-300 hover:border-mist-500 hover:text-white"
      aria-label={other === 'ar' ? 'العربية' : 'English'}
    >
      {other === 'ar' ? 'عربي' : 'EN'}
    </button>
  );
}

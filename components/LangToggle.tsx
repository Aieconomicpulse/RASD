'use client';
import { useRouter } from 'next/navigation';
import type { Lang } from '@/lib/types';

export default function LangToggle({ lang, label }: { lang: Lang; label: string }) {
  const router = useRouter();
  const other: Lang = lang === 'ar' ? 'en' : 'ar';
  return (
    <button
      type="button"
      lang={other}
      onClick={() => { document.cookie = `rasd_lang=${other}; path=/; max-age=31536000; samesite=lax`; router.refresh(); }}
      className="rounded-full border border-rule px-3.5 py-1.5 text-base font-medium text-ink hover:border-ink-3"
      data-lang-toggle
    >
      {label}
    </button>
  );
}

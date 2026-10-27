'use client';
import { useEffect, useState } from 'react';

/** Light or dark, remembered in a cookie; with no choice made the page follows the device. */
export default function ThemeToggle({ labels }: { labels: { toDark: string; toLight: string } }) {
  const [dark, setDark] = useState<boolean | null>(null);
  useEffect(() => {
    const set = document.documentElement.dataset.theme;
    setDark(set ? set === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, []);
  const toggle = () => {
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    document.cookie = `rasd_theme=${next}; path=/; max-age=31536000; samesite=lax`;
    setDark(!dark);
  };
  const label = dark ? labels.toLight : labels.toDark;
  return (
    <button type="button" onClick={toggle} aria-label={label} title={label} data-theme-toggle
      className="grid h-10 w-10 place-items-center rounded-full text-ink-2 hover:bg-sunken hover:text-ink">
      {/* both icons ship; CSS shows the one for the current theme so the static demo can swap them too */}
      <svg className="theme-moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z" /></svg>
      <svg className="theme-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" /></svg>
    </button>
  );
}

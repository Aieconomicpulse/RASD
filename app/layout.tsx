import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';
import { currentLang } from '@/lib/auth';
import { dir, t } from '@/lib/i18n';
import LangToggle from '@/components/LangToggle';
import SignOut from '@/components/SignOut';

export const metadata: Metadata = {
  title: 'Rasd — a daily economic situation picture for Saudi Arabia',
  description: 'Shelves and prices, supply and routes, confidence — every morning, from AI Economic Pulse.',
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: '#05080F', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await currentLang();
  return (
    <html lang={lang} dir={dir(lang)}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen">
        <header className="no-print sticky top-0 z-20 border-b border-line bg-ink-950/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5">
            <Link href="/" className="flex items-baseline gap-3">
              <span className="font-mono text-lg font-semibold tracking-[0.3em] text-white">{t(lang, 'brand')}</span>
              <span className="hidden text-xs text-mist-500 md:inline">{t(lang, 'tagline')}</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/" className="text-mist-300 hover:text-white">{t(lang, 'situation')}</Link>
              <Link href="/brief" className="text-mist-300 hover:text-white">{t(lang, 'brief')}</Link>
              <Link href="/modules" className="text-mist-300 hover:text-white">{t(lang, 'modules')}</Link>
              <LangToggle lang={lang} />
              <SignOut label={t(lang, 'signOut')} />
            </nav>
          </div>
        </header>
        {children}
        <footer className="mx-auto max-w-7xl px-4 py-6 text-[11px] text-mist-500">
          <div>{t(lang, 'by')} · {t(lang, 'tagline')}</div>
          <div className="mt-1">{t(lang, 'indicators')}</div>
        </footer>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
// Self-hosted fonts (no third-party requests from a ministry portal): Plex for the instrument, Source Serif and Naskh for the memo.
import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-500.css';
import '@fontsource/ibm-plex-sans/latin-600.css';
import '@fontsource/ibm-plex-sans/latin-700.css';
import '@fontsource/ibm-plex-sans-condensed/latin-500.css';
import '@fontsource/ibm-plex-sans-condensed/latin-600.css';
import '@fontsource/ibm-plex-sans-condensed/latin-700.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-400.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-500.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-600.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-700.css';
import '@fontsource/noto-naskh-arabic/arabic-400.css';
import '@fontsource/noto-naskh-arabic/arabic-600.css';
import '@fontsource-variable/source-serif-4/opsz.css';
import './globals.css';
import { currentLang, currentTheme } from '@/lib/auth';
import { dir, t } from '@/lib/i18n';
import LangToggle from '@/components/LangToggle';
import NavLinks from '@/components/NavLinks';
import HideOn from '@/components/HideOn';
import SignOut from '@/components/SignOut';
import ThemeToggle from '@/components/ThemeToggle';

export const metadata: Metadata = {
  title: 'Rasd — Saudi Arabia',
  description: 'The daily economic situation picture for Saudi Arabia: supply and routes, prices, markets and growth, with the decisions they call for.',
  robots: { index: false, follow: false },
};
export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, viewportFit: 'cover',
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#F7F9FA' }, { media: '(prefers-color-scheme: dark)', color: '#0B1820' }],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [lang, theme] = await Promise.all([currentLang(), currentTheme()]);
  return (
    <html lang={lang} dir={dir(lang)} data-theme={theme ?? undefined} suppressHydrationWarning>
      <body className="min-h-screen">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2">{lang === 'ar' ? 'انتقل إلى المحتوى' : 'Skip to content'}</a>
        <header className="no-print sticky top-0 z-30 border-b border-rule bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
          <div className="wrap flex flex-wrap items-center gap-x-6 gap-y-2 py-3">
            <Link href="/" className="flex items-baseline gap-2.5" aria-label={`${t(lang, 'brand')}, ${t(lang, 'situation')}`}>
              <span className="font-display text-[1.75rem] font-bold leading-none tracking-tight text-ink" lang="en">Rasd</span>
              <span className="text-[1.75rem] font-bold leading-none text-accent" lang="ar">رصد</span>
            </Link>
            <span className="hidden max-w-xs text-sm leading-snug text-ink-3 xl:block">{t(lang, 'tagline')}</span>
            <HideOn paths={['/login']} fallback={<div className="ms-auto" aria-hidden />}>
              <div className="order-last -mx-2 w-full overflow-x-auto md:order-none md:mx-0 md:ms-auto md:w-auto">
                <NavLinks items={[{ href: '/', label: t(lang, 'situation') }, { href: '/brief', label: t(lang, 'brief') }, { href: '/modules', label: t(lang, 'sources') }]} />
              </div>
            </HideOn>
            <div className="ms-auto flex items-center gap-1 sm:gap-2 md:ms-0">
              <span className="mx-1 hidden h-6 w-px bg-rule md:block" aria-hidden />
              <LangToggle lang={lang} label={t(lang, 'otherLang')} />
              <ThemeToggle labels={{ toDark: t(lang, 'themeDark'), toLight: t(lang, 'themeLight') }} />
              <HideOn paths={['/login']}><SignOut label={t(lang, 'signOut')} /></HideOn>
            </div>
          </div>
        </header>
        <div id="main">{children}</div>
        <footer className="wrap border-t border-rule py-8 text-sm text-ink-3">
          <p className="max-w-prose">{t(lang, 'indicators')}</p>
          <p className="mt-2">{t(lang, 'by')}, economicpulse.ai</p>
        </footer>
      </body>
    </html>
  );
}

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
import { getSituation } from '@/lib/situation';
import { alertCounts } from '@/lib/monitors';
import LangToggle from '@/components/LangToggle';
import HideOn from '@/components/HideOn';
import Rail from '@/components/Rail';
import SignOut from '@/components/SignOut';
import StatusPill from '@/components/StatusPill';
import ThemeToggle from '@/components/ThemeToggle';

export const metadata: Metadata = {
  title: 'Rasd — Saudi Arabia',
  description: 'The economic intelligence room for Saudi Arabia: GDP, inflation and products, consumer spending and sentiment on one wall, the alerts that call for action, and the door to every platform behind them.',
  robots: { index: false, follow: false },
};
export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, viewportFit: 'cover',
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#F7F9FA' }, { media: '(prefers-color-scheme: dark)', color: '#0B1820' }],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [lang, theme, s] = await Promise.all([currentLang(), currentTheme(), getSituation()]);
  const counts = alertCounts(s);
  const asOf = new Date(s.asOf);
  const stamp = `${asOf.toLocaleDateString(lang === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-GB', { timeZone: 'Asia/Riyadh', day: 'numeric', month: 'short' })}, ${asOf.toLocaleTimeString('en-GB', { timeZone: 'Asia/Riyadh', hour: '2-digit', minute: '2-digit' })} ${t(lang, 'riyadh')}`;
  const items = [
    { href: '/', label: t(lang, 'room'), icon: 'room' as const },
    { href: '/monitor', label: t(lang, 'monitors'), icon: 'monitoring' as const },
    { href: '/alerts', label: t(lang, 'alerts'), icon: 'alerts' as const, badge: counts.total, badgeTone: (counts.act ? 'alert' : counts.prepare ? 'watch' : 'quiet') as 'alert' | 'watch' | 'quiet' },
    { href: '/portals', label: t(lang, 'portals'), icon: 'portals' as const },
    { href: '/brief', label: t(lang, 'brief'), icon: 'brief' as const },
  ];
  return (
    // The room is dark unless the viewer chose light: a wall of screens reads best unlit.
    <html lang={lang} dir={dir(lang)} data-theme={theme ?? 'dark'} suppressHydrationWarning>
      <body className="min-h-screen">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2">{lang === 'ar' ? 'انتقل إلى المحتوى' : 'Skip to content'}</a>
        <header className="topbar no-print">
          <div className="flex h-full items-center gap-4 px-4 sm:px-6">
            <Link href="/" className="flex items-baseline gap-2.5" aria-label={`${t(lang, 'brand')}, ${t(lang, 'room')}`}>
              <span className="font-display text-[1.75rem] font-bold leading-none tracking-tight text-ink" lang="en">Rasd</span>
              <span className="text-[1.75rem] font-bold leading-none text-accent" lang="ar">رصد</span>
            </Link>
            <span className="hidden text-base text-ink-3 lg:block">{t(lang, 'tagline')}</span>
            <HideOn paths={['/login', '/']}>
              <div className="ms-auto hidden items-center gap-3 md:flex">
                <StatusPill status={s.overall.status} lang={lang} />
                <span className="tnum text-sm text-ink-2">{stamp}</span>
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
        <HideOn paths={['/login']}><Rail items={items} label={lang === 'ar' ? 'أبواب الغرفة' : 'Doors of the room'} /></HideOn>
        <HideOn paths={['/login']} fallback={<div id="main">{children}</div>}>
          <div id="main" className="room">
            {children}
            <footer className="wrap border-t border-rule py-8 text-sm text-ink-3">
              <p className="max-w-prose">{t(lang, 'indicators')}</p>
              <p className="mt-2">{t(lang, 'by')}, economicpulse.ai</p>
            </footer>
          </div>
        </HideOn>
      </body>
    </html>
  );
}

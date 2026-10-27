import { currentLang } from '@/lib/auth';
import { t } from '@/lib/i18n';
import LoginForm from '@/components/LoginForm';

export default async function LoginPage() {
  const lang = await currentLang();
  return (
    <main className="wrap flex min-h-[72vh] flex-col justify-center py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-6xl font-bold tracking-tight text-ink" lang="en">Rasd</span>
          <span className="text-6xl font-bold text-accent" lang="ar">رصد</span>
        </div>
        <p className="mt-3 text-xl leading-snug text-ink-2">{t(lang, 'tagline')}</p>
        <LoginForm labels={{ password: t(lang, 'password'), signIn: t(lang, 'signIn'), wrong: t(lang, 'wrongCode') }} />
        <p className="mt-4 text-sm text-ink-3">{t(lang, 'authorized')}</p>
      </div>
    </main>
  );
}

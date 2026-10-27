import { currentLang } from '@/lib/auth';
import { t } from '@/lib/i18n';
import LoginForm from '@/components/LoginForm';

export default async function LoginPage() {
  const lang = await currentLang();
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4">
      <div className="label">{t(lang, 'by')}</div>
      <h1 className="mt-2 font-mono text-4xl font-semibold tracking-[0.3em] text-white">{t(lang, 'brand')}</h1>
      <p className="mt-2 text-sm text-mist-300">{t(lang, 'tagline')}</p>
      <LoginForm labels={{ password: t(lang, 'password'), signIn: t(lang, 'signIn') }} />
      <p className="mt-4 text-[11px] text-mist-500">{t(lang, 'authorized')}</p>
    </main>
  );
}

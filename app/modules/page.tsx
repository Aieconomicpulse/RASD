import modules from '@/config/modules.json';
import { currentLang } from '@/lib/auth';
import { t } from '@/lib/i18n';
import ModuleCard, { type Module } from '@/components/ModuleCard';

export default async function ModulesPage() {
  const lang = await currentLang();
  const list = modules.modules as Module[];
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="label">{t(lang, 'brand')}</div>
      <h1 className="mt-2 text-3xl font-semibold text-white">{t(lang, 'modules')}</h1>
      <p className="mt-1 max-w-2xl text-sm text-mist-500">{t(lang, 'modulesSub')}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {list.map((m) => <ModuleCard key={m.id} m={m} lang={lang} />)}
      </div>
    </main>
  );
}

import { currentLang } from '@/lib/auth';
import { getSituation } from '@/lib/situation';
import { templateBrief } from '@/lib/brief';
import { aiBrief } from '@/lib/brief-ai';
import { t } from '@/lib/i18n';
import StatusChip from '@/components/StatusChip';
import PrintButton from '@/components/PrintButton';

export const revalidate = 3600;

export default async function BriefPage() {
  const lang = await currentLang();
  const s = await getSituation();
  const ai = await aiBrief(s, lang);
  const paragraphs = ai ?? templateBrief(s, lang);
  const stamp = new Date(s.asOf).toLocaleString(lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB', { timeZone: 'Asia/Riyadh', weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 print:max-w-none">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="label">{t(lang, 'brand')} · {stamp} · 07:00 {t(lang, 'riyadh')}</div>
          <h1 className="mt-2 text-3xl font-semibold text-white print:text-black">{t(lang, 'briefTitle')}</h1>
          <p className="mt-1 text-sm text-mist-500">{t(lang, 'briefSub')}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusChip status={s.overall.status} lang={lang} />
          <PrintButton label={t(lang, 'print')} />
        </div>
      </div>
      <article className="card mt-6 space-y-4 p-6 text-[15px] leading-relaxed text-mist-100 print:text-black">
        {paragraphs.map((p, i) => <p key={i} className={i === 0 ? 'text-lg font-medium text-white print:text-black' : ''}>{p}</p>)}
      </article>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-mist-500">
        <span>{ai ? (lang === 'ar' ? 'صيغ بواسطة النموذج من بيانات الصورة فقط' : 'Written by the model from the picture data only') : (lang === 'ar' ? 'مركّب مباشرة من بيانات الصورة' : 'Composed directly from the picture data')}</span>
        {s.sample && <span className="chip chip-watch">{t(lang, 'sample')}</span>}
      </div>
    </main>
  );
}

import { currentLang } from '@/lib/auth';
import { getSituation } from '@/lib/situation';
import { templateBrief } from '@/lib/brief';
import { aiBrief } from '@/lib/brief-ai';
import { HIJRI_LOCALE, t } from '@/lib/i18n';
import { PRIORITY_LABEL } from '@/lib/strategy';
import type { L, Priority } from '@/lib/types';
import StatusPill, { PriorityMark, StatusShape } from '@/components/StatusPill';
import PrintButton from '@/components/PrintButton';

export const revalidate = 3600;

const C = {
  title: { en: 'Daily brief', ar: 'الموجز اليومي' },
  for: { en: 'For the deputy minister, before the morning meeting', ar: 'لنائب الوزير، قبل اجتماع الصباح' },
  bottom: { en: 'Bottom line', ar: 'الخلاصة' },
  judgments: { en: 'Key judgments', ar: 'التقديرات الرئيسية' },
  decisions: { en: 'Decisions for this week', ar: 'قرارات هذا الأسبوع' },
  watch: { en: 'What would change the picture', ar: 'ما الذي قد يغيّر الصورة' },
  pillars: { en: 'The four pillars', ar: 'الركائز الأربع' },
  composed: { en: 'Composed directly from the situation data; every figure traces to the situation page.', ar: 'مركّب مباشرة من بيانات الوضع؛ كل رقم يعود إلى صفحة الوضع.' },
  generated: { en: 'Prose polished by the model from the situation data only; decisions and thresholds are computed.', ar: 'صيغت النصوص بواسطة النموذج من بيانات الوضع فقط؛ أما القرارات والعتبات فمحسوبة.' },
} satisfies Record<string, L>;

export default async function BriefPage() {
  const lang = await currentLang();
  const ar = lang === 'ar';
  const s = await getSituation();
  const base = templateBrief(s, lang);
  const doc = (await aiBrief(s, base, lang)) ?? base;
  const tr = (l: L) => l[lang];
  const asOf = new Date(s.asOf);
  const day = asOf.toLocaleDateString(ar ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-GB', { timeZone: 'Asia/Riyadh', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const hijri = ar ? asOf.toLocaleDateString(HIJRI_LOCALE, { timeZone: 'Asia/Riyadh', day: 'numeric', month: 'long', year: 'numeric' }) : null;
  const groups: Priority[] = ['act', 'prepare', 'monitor'];
  const h2 = 'mt-12 border-t border-rule pt-6 font-sans text-xl font-semibold text-ink';

  return (
    <main className="wrap py-10 md:py-14">
      <article className="mx-auto max-w-[46rem]">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-base text-ink-2">{t(lang, 'brand')}, {day}, 07:00 {t(lang, 'riyadh')}{hijri ? <span className="text-ink-3"> ({hijri})</span> : null}</div>
            <h1 className={`mt-2 font-display font-semibold text-ink ${ar ? 'text-5xl font-bold leading-tight' : 'text-6xl tracking-tight'}`}>{tr(C.title)}</h1>
            <p className="mt-2 text-lg text-ink-2">{tr(C.for)}</p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <StatusPill status={s.overall.status} lang={lang} size="lg" />
            <PrintButton label={t(lang, 'print')} />
          </div>
        </header>

        <h2 className={h2}>{tr(C.bottom)}</h2>
        <p className="mt-3 font-serif text-[1.625rem] leading-[1.45] text-ink">{doc.bottomLine}</p>

        <h2 className={h2}>{tr(C.judgments)}</h2>
        <ol className="mt-3 space-y-4 font-serif text-xl leading-[1.6] text-ink">
          {doc.judgments.map((j, i) => (
            <li key={i} className="flex gap-4"><span className="w-6 shrink-0 pt-0.5 font-sans text-lg font-semibold text-ink-3">{i + 1}</span><span>{j}</span></li>
          ))}
        </ol>

        <h2 className={h2}>{tr(C.decisions)}</h2>
        <div className="mt-4 space-y-8">
          {groups.map((g) => {
            const items = doc.decisions.filter((d) => d.priority === g);
            if (!items.length) return null;
            return (
              <div key={g}>
                <PriorityMark priority={g} label={tr(PRIORITY_LABEL[g])} />
                <ul className="mt-3 space-y-5">
                  {items.map((d, i) => (
                    <li key={i} className="border-s-2 border-rule ps-4">
                      <div className="text-xl font-semibold leading-snug text-ink">{d.title}</div>
                      <p className="mt-1.5 font-serif text-lg leading-[1.6] text-ink-2">{d.body}</p>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <h2 className={h2}>{tr(C.watch)}</h2>
        <ul className="mt-4 space-y-4">
          {doc.watch.map((w, i) => (
            <li key={i} className="grid gap-1 sm:grid-cols-[11rem_1fr] sm:gap-4">
              <div className="flex items-center gap-2 text-lg font-semibold text-ink"><StatusPill status={w.status} lang={lang} /></div>
              <div>
                <div className="text-sm font-medium text-ink-3">{w.pillar}</div>
                <div className="flex items-start gap-2 text-lg leading-snug text-ink">
                  <StatusShape status={w.level} size={12} className={`mt-[0.45rem] ${w.level === 'critical' ? 'text-st-critical' : w.level === 'alert' ? 'text-st-alert' : 'text-st-watch'}`} />
                  <span>{w.text}</span>
                </div>
                <div className="ps-5 text-base text-ink-3">{w.now}</div>
              </div>
            </li>
          ))}
        </ul>

        <h2 className={h2}>{tr(C.pillars)}</h2>
        <div className="mt-4 space-y-7">
          {doc.pillars.map((p) => (
            <section key={p.key}>
              <div className="flex items-center gap-3"><h3 className="text-xl font-semibold text-ink">{p.name}</h3><StatusPill status={p.status} lang={lang} /></div>
              <p className="mt-2 font-serif text-lg leading-[1.65] text-ink">{p.text}</p>
            </section>
          ))}
        </div>

        <p className="mt-12 border-t border-rule pt-4 text-sm text-ink-3">{doc.generated ? tr(C.generated) : tr(C.composed)}</p>
      </article>
    </main>
  );
}

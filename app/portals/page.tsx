import meta from '@/data/ksa/meta.json';
import { currentLang } from '@/lib/auth';
import { fmtDate, t } from '@/lib/i18n';
import { MONITORS } from '@/lib/monitors';
import type { L } from '@/lib/types';
import Icon from '@/components/Icons';
import { PORTALS, PORTAL_ICON } from '@/components/PortalLinks';

const C = {
  dek: { en: 'The platforms behind the room. Each opens on its own, in a new window, with its full depth: every product, every route, every company.', ar: 'المنصات وراء الغرفة. كل منها تُفتح وحدها في نافذة جديدة بكامل عمقها: كل منتج، وكل مسار، وكل شركة.' },
  feeds: { en: 'Feeds the room with', ar: 'تغذّي الغرفة بـ' },
  next: { en: 'Would add', ar: 'ما يمكن إضافته' },
  none: { en: 'Linked; not yet feeding the room.', ar: 'مرتبطة، ولا تغذّي الغرفة بعد.' },
  screens: { en: 'Screens', ar: 'الشاشات' },
  data: { en: 'Data in the room', ar: 'البيانات في الغرفة' },
  login: { en: 'The platforms sit behind the team’s own sign-in until each gets its own domain.', ar: 'تقف المنصات خلف تسجيل دخول الفريق إلى أن تحصل كل منها على نطاقها الخاص.' },
} satisfies Record<string, L>;

export default async function PortalsPage() {
  const lang = await currentLang();
  const ar = lang === 'ar';
  const tr = (l: L) => l[lang];
  const latest = meta.latest as Record<string, string | number>;
  return (
    <main className="wrap pb-12 pt-8 md:pt-10">
      <h1 className="section-title">{t(lang, 'portals')}</h1>
      <p className="mt-2 max-w-3xl text-lg text-ink-2">{tr(C.dek)}</p>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {PORTALS.map((p) => {
          const screens = MONITORS.filter((m) => m.portals.includes(p.id));
          return (
            <article key={p.id} className="flex flex-col rounded-2xl border border-rule bg-surface p-6">
              <div className="flex items-start gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-sunken text-accent"><Icon name={PORTAL_ICON[p.id] ?? 'portals'} size={30} /></span>
                <div className="min-w-0">
                  <h2 className="text-2xl font-semibold leading-tight text-ink">{ar ? p.name_ar : p.name}</h2>
                  <p className="mt-2 text-base leading-relaxed text-ink-2">{ar ? p.summary_ar : p.summary}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-5 border-t border-rule pt-5 sm:grid-cols-2">
                <div>
                  <div className="eyeline">{tr(C.feeds)}</div>
                  {p.now.length ? <ul className="mt-1 space-y-1 text-base text-ink">{p.now.map((x, i) => <li key={i}>{tr(x)}</li>)}</ul> : <p className="mt-1 text-base text-ink-3">{tr(C.none)}</p>}
                  {screens.length > 0 && <p className="mt-2 text-sm text-ink-3">{tr(C.screens)}: {screens.map((m) => tr(m.short)).join(ar ? '، ' : ', ')}</p>}
                </div>
                <div>
                  <div className="eyeline">{tr(C.next)}</div>
                  <ul className="mt-1 space-y-1 text-base text-ink-2">{p.next.map((x, i) => <li key={i}>{tr(x)}</li>)}</ul>
                </div>
              </div>
              <a href={p.url} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 self-start rounded-full bg-accent px-5 py-2.5 text-base font-semibold text-page hover:opacity-90">
                {t(lang, 'openPortal')}<Icon name="external" size={17} />
              </a>
            </article>
          );
        })}
      </div>
      <p className="mt-6 text-sm text-ink-3">{tr(C.login)}</p>

      <h2 className="mt-16 text-2xl font-semibold text-ink">{tr(C.data)}</h2>
      <ul className="mt-3 space-y-1 text-base text-ink-2">
        <li>{ar ? 'آخر تحديث' : 'Last refreshed'}: {fmtDate(String(meta.fetchedAt).slice(0, 10), lang)}</li>
        <li>{ar ? 'المؤشرات الأسبوعية حتى' : 'Weekly indicators to'} {fmtDate(String(latest.macro), lang)}; {ar ? 'أسعار الغذاء حتى' : 'food prices to'} {fmtDate(String(latest.cpi), lang)}; {ar ? 'كومتريد' : 'UN Comtrade'} {latest.comtradeYear}</li>
        <li>{ar ? `${meta.counts.macroWeeks} أسبوعاً من المؤشرات الكلية، ${meta.counts.cpiWeeks} أسبوعاً من الأسعار، ${meta.counts.products} منتجاً، ${meta.counts.hormuzProducts} بنداً من بنود HS6` : `${meta.counts.macroWeeks} weeks of macro indicators, ${meta.counts.cpiWeeks} weeks of prices, ${meta.counts.products} products, ${meta.counts.hormuzProducts} HS6 lines`}</li>
      </ul>
    </main>
  );
}

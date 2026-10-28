import meta from '@/data/ksa/meta.json';
import { currentLang } from '@/lib/auth';
import { fmtDate, t } from '@/lib/i18n';
import { MONITORS } from '@/lib/monitors';
import type { L } from '@/lib/types';
import Icon from '@/components/Icons';
import { PORTALS, PORTAL_ICON } from '@/components/PortalLinks';

const C = {
  feeds: { en: 'Feeds', ar: 'تغذّي' },
  linked: { en: 'Linked', ar: 'مرتبطة' },
  data: { en: 'Data in the room', ar: 'البيانات في الغرفة' },
  refreshed: { en: 'Refreshed', ar: 'آخر تحديث' }, weekly: { en: 'Weekly indicators', ar: 'المؤشرات الأسبوعية' }, prices: { en: 'Food prices', ar: 'أسعار الغذاء' }, comtrade: { en: 'UN Comtrade', ar: 'كومتريد' },
  weeks: { en: 'weeks', ar: 'أسبوعاً' }, products: { en: 'products', ar: 'منتجاً' }, lines: { en: 'HS6 lines', ar: 'بنداً HS6' },
} satisfies Record<string, L>;

export default async function PortalsPage() {
  const lang = await currentLang();
  const ar = lang === 'ar';
  const tr = (l: L) => l[lang];
  const latest = meta.latest as Record<string, string | number>;
  const facts = [
    { v: fmtDate(String(meta.fetchedAt).slice(0, 10), lang, { day: 'numeric', month: 'short' }), l: tr(C.refreshed) },
    { v: fmtDate(String(latest.macro), lang, { day: 'numeric', month: 'short' }), l: tr(C.weekly) },
    { v: fmtDate(String(latest.cpi), lang, { day: 'numeric', month: 'short' }), l: tr(C.prices) },
    { v: String(latest.comtradeYear), l: tr(C.comtrade) },
    { v: String(meta.counts.macroWeeks), l: tr(C.weeks) },
    { v: String(meta.counts.products), l: tr(C.products) },
    { v: String(meta.counts.hormuzProducts), l: tr(C.lines) },
  ];
  return (
    <main className="wrap pb-12 pt-8 md:pt-10">
      <h1 className="section-title">{t(lang, 'portals')}</h1>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {PORTALS.map((p) => {
          const screens = MONITORS.filter((m) => m.portals.includes(p.id));
          return (
            <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="group screen flex min-h-[15rem] flex-col p-6 pt-7 hover:border-ink-3" style={{ ['--bezel' as string]: p.now.length ? 'rgb(var(--accent))' : 'rgb(var(--rule))' }}>
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-sunken text-accent"><Icon name={PORTAL_ICON[p.id] ?? 'portals'} size={34} /></span>
              <h2 className="mt-5 text-2xl font-semibold leading-tight text-ink">{ar ? p.name_ar : p.name}</h2>
              <div className="mt-2 text-base text-ink-3">{screens.length ? `${tr(C.feeds)}: ${screens.map((m) => tr(m.short)).join(ar ? '، ' : ', ')}` : tr(C.linked)}</div>
              <span className="mt-auto inline-flex items-center gap-2 pt-6 text-base font-semibold text-accent">{t(lang, 'openPortal')}<Icon name="external" size={17} className="transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" /></span>
            </a>
          );
        })}
      </div>

      <h2 className="mt-14 text-2xl font-semibold text-ink">{tr(C.data)}</h2>
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4 xl:grid-cols-7">
        {facts.map((x) => <div key={x.l} className="border-t border-rule pt-3"><div className="figure text-2xl"><bdi dir="ltr">{x.v}</bdi></div><div className="mt-1 text-sm text-ink-3">{x.l}</div></div>)}
      </div>
    </main>
  );
}

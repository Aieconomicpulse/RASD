import Link from 'next/link';
import { currentLang } from '@/lib/auth';
import { getSituation } from '@/lib/situation';
import { t, T } from '@/lib/i18n';
import { BAND_AR } from '@/lib/sentiment';
import type { Category, HormuzGrade, Lang } from '@/lib/types';
import Ticker from '@/components/Ticker';
import Panel from '@/components/Panel';
import Stat, { Delta } from '@/components/Stat';
import StatusChip from '@/components/StatusChip';
import Sparkline from '@/components/Sparkline';
import AlertList from '@/components/AlertList';

export const revalidate = 900;

const GRADE_CLASS: Record<HormuzGrade, string> = { HIGH: 'chip-alert', MEDIUM: 'chip-watch', LOW: 'chip-normal', NONE: 'bg-ink-700 text-mist-300', INDEX: 'bg-ink-700 text-mist-300' };
const f = (n: number, d = 1) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtDate = (iso: string, lang: Lang) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

function Grade({ g, lang }: { g: HormuzGrade; lang: Lang }) {
  return <span className={`chip ${GRADE_CLASS[g]} !tracking-normal`}>{lang === 'ar' ? 'هرمز' : 'Hz'} {T.hzGrade[g][lang]}</span>;
}

function CategoryRow({ c, lang }: { c: Category; lang: Lang }) {
  return (
    <li className="flex items-center justify-between gap-2 text-sm">
      <span className="flex min-w-0 items-center gap-2"><span className="truncate text-mist-100">{lang === 'ar' ? c.label_ar : c.label_en}</span><Grade g={c.hormuz} lang={lang} /></span>
      <span className="flex shrink-0 items-center gap-2"><span className="num text-xs text-mist-500">{f(c.value)}</span><Delta value={c.wow} invert /></span>
    </li>
  );
}

export default async function SituationPage() {
  const lang = await currentLang();
  const s = await getSituation();
  const ar = lang === 'ar';
  const asOf = new Date(s.asOf);
  const stamp = asOf.toLocaleString(ar ? 'ar-SA-u-nu-latn' : 'en-GB', { timeZone: 'Asia/Riyadh', weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const { shelves: sh, supply: su, confidence: co, economy: ec } = s;
  const hz = T.hormuzState[su.hormuz.state][lang];
  const sentColor = co.sentiment.score >= 0.2 ? 'text-pulse-green' : co.sentiment.score > -0.2 ? 'text-pulse-amber' : 'text-pulse-red';

  return (
    <main>
      <Ticker snap={s} />
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-6">
        {/* Masthead */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="label">{t(lang, 'overall')} · {t(lang, 'asOf')} {stamp} {t(lang, 'riyadh')}</div>
            <h1 className="mt-2 max-w-5xl text-2xl font-semibold leading-tight text-white md:text-[1.7rem] md:leading-tight">{ar ? s.overall.headline_ar : s.overall.headline_en}</h1>
          </div>
          <div className="flex items-center gap-3">
            <StatusChip status={s.overall.status} lang={lang} pulse />
            <Link href="/brief" className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-ink-950 hover:bg-mist-100">{t(lang, 'brief')} →</Link>
          </div>
        </div>

        {/* The three questions */}
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {/* 01 · Shelves & prices */}
          <Panel lang={lang} index="01" title={t(lang, 'shelves')} question={t(lang, 'shelvesQ')} status={sh.status} sample={sh.sample} source={sh.source}>
            <div className="grid grid-cols-2 gap-4">
              <Stat big label={t(lang, 'foodCpi')} value={sh.foodCpi.value} delta={sh.foodCpi.wow} deltaLabel={t(lang, 'wow')} invert>
                <span className="num">·</span><Delta value={sh.foodCpi.m4} invert /><span>{t(lang, 'm4')}</span>
              </Stat>
              <Stat big label={t(lang, 'cpiOverall')} value={sh.cpiOverall.value} delta={sh.cpiOverall.wow} deltaLabel={t(lang, 'wow')} invert>
                <span className="num">·</span><Delta value={sh.cpiOverall.yoy} invert /><span>{t(lang, 'yoy')}</span>
              </Stat>
            </div>
            <div className="mt-3"><Sparkline data={sh.foodTrend} color="#F5A524" height={56} label={t(lang, 'foodCpi')} /></div>
            <div className="flex items-baseline justify-between text-[11px] text-mist-500"><span>{t(lang, 'foodCpi')} · {t(lang, 'trend52')}</span><span><span className="num text-mist-300">{sh.productsTracked}</span> {t(lang, 'productsTracked')}</span></div>
            <div className="mt-4">
              <div className="label">{t(lang, 'categories')}</div>
              <ul className="mt-2 space-y-1.5">{sh.categories.slice(0, 6).map((c) => <CategoryRow key={c.key} c={c} lang={lang} />)}</ul>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-line bg-ink-800/60 px-4 py-3">
              <div>
                <div className="label">{t(lang, 'sinceWar')}</div>
                <div className="num mt-1 text-sm text-mist-100">{f(sh.sinceWar.foodPre)} → <span className="font-semibold text-white">{f(sh.sinceWar.foodPost)}</span></div>
                <div className="text-[11px] text-mist-500">{t(lang, 'foodCpi')} · {t(lang, 'sinceWarSub')}</div>
              </div>
              {sh.sinceWar.worst && (
                <div>
                  <div className="label">{t(lang, 'worstSinceWar')}</div>
                  <div className="mt-1 truncate text-sm text-mist-100">{ar ? sh.sinceWar.worst.label_ar : sh.sinceWar.worst.label_en}</div>
                  <div className="text-[11px] text-mist-500"><Delta value={sh.sinceWar.worst.sinceWar} suffix={` ${t(lang, 'points')}`} invert /> · <Grade g={sh.sinceWar.worst.hormuz} lang={lang} /></div>
                </div>
              )}
            </div>
            <div className="mt-4">
              <div className="label">{t(lang, 'basket')}</div>
              <div className="mt-1 text-sm text-mist-100"><span className="num font-semibold text-white">{sh.basket.directProducts}</span> {t(lang, 'directProducts')} · <span className="num text-white">{f(sh.basket.directWeightPct)}%</span> {t(lang, 'ofWeight')}</div>
              <div className="text-sm text-mist-300"><span className="num text-mist-100">{sh.basket.rawMaterialRiskProducts}</span> {t(lang, 'rawRisk')} · <span className="num">{f(sh.basket.rawMaterialRiskWeightPct)}%</span></div>
              <div className="mt-1 truncate text-[11px] text-mist-500">{sh.basket.direct.slice(0, 4).map((p) => `${p.product.split(/[,(]/)[0].trim()} (${p.origin})`).join(' · ')}</div>
            </div>
            <div className="mt-3 text-[11px] text-mist-500">{t(lang, 'stockoutsNA')}</div>
          </Panel>

          {/* 02 · Supply & routes */}
          <Panel lang={lang} index="02" title={t(lang, 'supply')} question={t(lang, 'supplyQ')} status={su.status} sample={su.sample} source={su.source}>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-ink-800/60 px-4 py-3">
              <div>
                <div className="label">{t(lang, 'hormuz')} · {t(lang, 'deskSet')}</div>
                <div className={`num mt-0.5 text-2xl font-semibold ${su.hormuz.state === 'open' ? 'text-pulse-green' : su.hormuz.state === 'restricted' ? 'text-pulse-amber' : 'text-pulse-red'}`}>{hz}</div>
              </div>
              <div className="max-w-[55%] text-right text-[11px] leading-snug text-mist-500 rtl:text-left">{ar ? su.hormuz.note_ar : su.hormuz.note_en}</div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Stat label={t(lang, 'importsViaHormuz')} value={su.exposure.importsViaHormuzPct} suffix="%"><span>${f(su.exposure.importsViaHormuzUsdB, 0)}B / ${f(su.exposure.importsTotalUsdB, 0)}B</span></Stat>
              <Stat label={t(lang, 'foodViaHormuz')} value={su.exposure.foodViaHormuzPct} suffix="%"><span>${f(su.exposure.foodViaHormuzUsdB, 1)}B {t(lang, 'atRisk')}</span></Stat>
              <Stat label={t(lang, 'critical')} value={su.exposure.criticalProducts} digits={0}><span>{t(lang, 'ofProducts')} {su.exposure.productsCovered.toLocaleString('en-US')}</span></Stat>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Stat label={t(lang, 'portCalls')} value={su.portCalls.weekly} digits={0} delta={su.portCalls.wow} deltaLabel={t(lang, 'wow')} />
              <Stat label={t(lang, 'vs2025')} value={su.portCalls.vs2025} digits={0} suffix="%"><span>{su.portCalls.avg2025}/wk 2025</span></Stat>
              <div className="min-w-0"><div className="label leading-tight">{t(lang, 'portCallsTrend')}</div><Sparkline data={su.portCalls.trend} color="#4C8DFF" height={44} digits={0} label={t(lang, 'portCalls')} /></div>
            </div>
            <div className="mt-4">
              <div className="label">{t(lang, 'topAtRisk')}</div>
              <ul className="mt-2 space-y-2">
                {su.topAtRisk.slice(0, 5).map((p) => (
                  <li key={p.hs6} className="text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-mist-100">{ar ? p.product_ar ?? p.product : p.product} <span className="num text-mist-500">HS {p.hs6}</span></span>
                      <span className={`num shrink-0 font-semibold ${p.hormuzPct >= 70 ? 'text-pulse-red' : p.hormuzPct >= 40 ? 'text-pulse-amber' : 'text-pulse-green'}`}>{f(p.hormuzPct, 0)}% · ${p.hormuzUsdM >= 1000 ? `${f(p.hormuzUsdM / 1000, 1)}B` : `${p.hormuzUsdM}M`}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1 w-20 shrink-0 rounded bg-ink-700"><div className={`h-1 rounded ${p.hormuzPct >= 70 ? 'bg-pulse-red' : p.hormuzPct >= 40 ? 'bg-pulse-amber' : 'bg-pulse-green'}`} style={{ width: `${p.hormuzPct}%` }} /></div>
                      <span className="truncate text-mist-500">{ar ? p.mainSource_ar ?? p.mainSource : p.mainSource} → <span className="text-mist-300">{ar ? p.altSupplier_ar ?? p.altSupplier : p.altSupplier}</span>{p.altDays ? ` · ${p.altDays} ${ar ? 'يوم' : 'd'}` : ''}{p.altCost ? ` · ${p.altCost}` : ''}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4">
              <div className="label">{t(lang, 'corridors')}</div>
              <ul className="mt-2 space-y-1 text-xs">
                {su.corridors.map((c, i) => (
                  <li key={i} className="flex justify-between gap-2"><span className="min-w-0"><span className="text-mist-100">{ar ? c.name_ar : c.name_en}</span> <span className="text-mist-500">— {ar ? c.via_ar : c.via_en}</span></span>{(c.days || c.cost) && <span className="num shrink-0 text-mist-500">{[c.days ? `${c.days} ${ar ? 'أيام' : 'days'}` : null, c.cost].filter(Boolean).join(' · ')}</span>}</li>
                ))}
              </ul>
            </div>
          </Panel>

          {/* 03 · Confidence */}
          <Panel lang={lang} index="03" title={t(lang, 'confidence')} question={t(lang, 'confidenceQ')} status={co.status} sample={co.sample} source={co.source} fresh={co.sentiment.live ? 'mixed' : 'daily'}>
            <div className="grid grid-cols-2 gap-4">
              <Stat big label={t(lang, 'brent')} value={co.brent.value} prefix="$" delta={co.brent.wow} deltaLabel={t(lang, 'wow')}>
                <span className="num">·</span><Delta value={co.brent.vsPreWar} digits={0} /><span>{ar ? 'عن ما قبل الحرب' : 'vs pre-war'}</span>
              </Stat>
              <Stat big label={t(lang, 'tasi')} value={co.tasi.value} digits={0} delta={co.tasi.wow} deltaLabel={t(lang, 'wow')}>
                <span className="num">·</span><Delta value={co.tasi.m4} /><span>{t(lang, 'm4')}</span>
              </Stat>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-4">
              <Sparkline data={co.brentTrend} color="#F5A524" height={44} prefix="$" label={t(lang, 'brent')} />
              <Sparkline data={co.tasiTrend} color="#4C8DFF" height={44} digits={0} label={t(lang, 'tasi')} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Stat label={t(lang, 'samaRate')} value={co.samaRate} digits={2} suffix="%" />
              <Stat label={t(lang, 'pmi')} value={co.pmi}><span>{co.pmi >= 50 ? (ar ? 'توسّع' : 'expansion') : ar ? 'انكماش' : 'contraction'}</span></Stat>
              <Stat label={t(lang, 'investment')} value={co.investment.value} delta={co.investment.wow} deltaLabel={t(lang, 'wow')} />
            </div>
            <div className="mt-4 rounded-lg border border-line bg-ink-800/60 px-4 py-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="label">{t(lang, 'sentiment')} {co.sentiment.live && <span className="chip chip-normal ml-2 align-middle">{t(lang, 'live')}</span>}</div>
                  <div className="text-[11px] text-mist-500">{t(lang, 'sentimentSub')} · {co.sentiment.date}{co.sentiment.headlineCount ? ` · ${co.sentiment.headlineCount} ${ar ? 'عنواناً' : 'headlines'}` : ''}</div>
                </div>
                <div className={`num text-2xl font-semibold ${sentColor}`}>{co.sentiment.score > 0 ? '+' : ''}{co.sentiment.score.toFixed(2)} <span className="text-xs font-normal text-mist-500">{ar ? BAND_AR[co.sentiment.band] ?? co.sentiment.band : co.sentiment.band}</span></div>
              </div>
              <div className="mt-2"><Sparkline data={co.sentiment.trend.map((p) => ({ date: p.date, value: p.score }))} domain={[-1, 1]} zero digits={2} color={co.sentiment.score >= 0 ? '#1FB58C' : '#E5484D'} label={t(lang, 'sentiment')} /></div>
              {co.sentiment.headlines.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-mist-300">
                  {co.sentiment.headlines.slice(0, 6).map((h, i) => (
                    <li key={i} className="flex gap-2"><span className={h.sentiment === 'negative' ? 'text-pulse-red' : h.sentiment === 'positive' ? 'text-pulse-green' : 'text-mist-500'}>●</span><span className="truncate">{h.headline}</span></li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>
        </div>

        {/* 04 · The economy */}
        <div className="mt-4">
          <Panel lang={lang} index="04" title={t(lang, 'economy')} question={t(lang, 'economyQ')} status={ec.status} sample={ec.sample} source={ec.source}>
            <div className="grid gap-5 lg:grid-cols-3">
              <div className="grid grid-cols-2 gap-4 lg:col-span-2 md:grid-cols-4">
                <div>
                  <Stat big label={t(lang, 'gdp')} value={ec.gdp.totalUsdT} digits={2} prefix="$" suffix="T" delta={ec.gdp.momentum4w} deltaLabel={t(lang, 'momentum')} />
                  <div className="mt-2"><Sparkline data={ec.gdp.trend} color="#1FB58C" height={48} digits={2} prefix="$" label={t(lang, 'gdp')} /></div>
                  <div className="text-[11px] text-mist-500">{t(lang, 'oilGdp')} ${f(ec.gdp.oilUsdT, 2)}T · {f(ec.gdp.oilShare, 0)}% {t(lang, 'oilShare')}</div>
                </div>
                <div>
                  <Stat big label={t(lang, 'nonOilGdp')} value={ec.gdp.nonOilUsdT} digits={2} prefix="$" suffix="T"><span>{f(100 - ec.gdp.oilShare, 0)}% {ar ? 'من الناتج' : 'of GDP'}</span></Stat>
                  <div className="mt-2"><Sparkline data={ec.gdp.nonOilTrend} color="#4C8DFF" height={48} digits={2} prefix="$" label={t(lang, 'nonOilGdp')} /></div>
                  <div className="text-[11px] text-mist-500">{t(lang, 'trend52')}</div>
                </div>
                <div>
                  <Stat big label={t(lang, 'spending')} value={ec.spending.value} delta={ec.spending.wow} deltaLabel={t(lang, 'wow')}>
                    <span className="num">·</span><Delta value={ec.spending.yoy} /><span>{t(lang, 'yoy')}</span>
                  </Stat>
                  <div className="mt-2"><Sparkline data={ec.spending.trend} color="#F5A524" height={48} label={t(lang, 'spending')} /></div>
                  <div className="text-[11px] text-mist-500">{t(lang, 'spendingSub')} · {t(lang, 'trend52')}</div>
                </div>
                <div className="space-y-3">
                  <Stat label={t(lang, 'employment')} value={ec.employment.value} delta={ec.employment.wow} deltaLabel={t(lang, 'wow')} />
                  <Stat label={t(lang, 'investment')} value={ec.investment.value} delta={ec.investment.wow} deltaLabel={t(lang, 'wow')} />
                  <Stat label={t(lang, 'pmi')} value={ec.pmi}><span>{ec.pmi >= 50 ? (ar ? 'فوق 50 = توسّع' : 'above 50 = expansion') : ar ? 'تحت 50 = انكماش' : 'below 50 = contraction'}</span></Stat>
                </div>
              </div>
              <div className="rounded-lg border border-line bg-ink-800/60 px-4 py-3">
                <div className="flex items-baseline justify-between"><div className="label">{t(lang, 'sinceWar')}</div><div className="text-[11px] text-mist-500">{t(lang, 'sinceWarSub')}</div></div>
                <ul className="mt-2 divide-y divide-line">
                  {ec.sinceWar.rows.map((r) => {
                    const ch = r.pre ? ((r.post - r.pre) / r.pre) * 100 : 0;
                    return (
                      <li key={r.key} className="flex items-center justify-between gap-2 py-1.5 text-xs">
                        <span className="truncate text-mist-300">{ar ? r.label_ar : r.label_en}</span>
                        <span className="num shrink-0 text-mist-100">{f(r.pre, r.digits)} → <span className="font-semibold text-white">{f(r.post, r.digits)}</span> <Delta value={Math.round(ch * 10) / 10} digits={0} invert={r.key === 'oil'} /></span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
            <div className="mt-4 border-t border-line pt-3">
              <div className="flex items-baseline justify-between"><div className="label">{t(lang, 'annual')}</div><div className="text-[11px] text-mist-500">{t(lang, 'annualSub')}</div></div>
              <div dir="ltr" className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {ec.annual.map((y) => (
                  <div key={y.year} className="min-w-[7.5rem] shrink-0 rounded-md border border-line bg-ink-800/40 px-3 py-2">
                    <div className="num text-[11px] text-mist-500">{y.year}{y.weeks < 52 ? ` · ${y.weeks}w` : ''}</div>
                    <div className="num text-base font-semibold text-white">{y.gdpUsdT !== null ? `$${f(y.gdpUsdT, 2)}T` : '—'}</div>
                    <div className="num text-[11px] text-mist-500">${y.brent !== null ? f(y.brent, 0) : '—'} · {y.portCalls ?? '—'}/wk</div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2"><AlertList alerts={s.alerts} lang={lang} /></div>
          <section className="card p-5">
            <div className="label">{t(lang, 'modules')}</div>
            <p className="mt-2 text-sm text-mist-300">{t(lang, 'modulesSub')}</p>
            <Link href="/modules" className="mt-3 inline-block text-sm font-semibold text-pulse-blue hover:underline">{t(lang, 'modules')} →</Link>
            <p className="mt-4 text-[11px] leading-snug text-mist-500">{t(lang, 'provenance')} {ar ? 'آخر تحديث للبيانات' : 'Data refreshed'} {fmtDate(s.provenance.fetchedAt.slice(0, 10), lang)}.</p>
          </section>
        </div>
      </div>
    </main>
  );
}

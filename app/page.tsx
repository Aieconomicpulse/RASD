import Link from 'next/link';
import { currentLang } from '@/lib/auth';
import { getSituation } from '@/lib/situation';
import { t } from '@/lib/i18n';
import { T } from '@/lib/i18n';
import Ticker from '@/components/Ticker';
import Panel from '@/components/Panel';
import Stat, { Delta } from '@/components/Stat';
import StatusChip from '@/components/StatusChip';
import Sparkline from '@/components/Sparkline';
import AlertList from '@/components/AlertList';

export const revalidate = 900;

export default async function SituationPage() {
  const lang = await currentLang();
  const s = await getSituation();
  const asOf = new Date(s.asOf);
  const stamp = asOf.toLocaleString(lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB', { timeZone: 'Asia/Riyadh', weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const ar = lang === 'ar';
  const hz = T.hormuzState[s.supply.hormuz.state][lang];

  return (
    <main>
      <Ticker snap={s} />
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-6">
        {/* Masthead */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="label">{t(lang, 'overall')} · {t(lang, 'asOf')} {stamp} {t(lang, 'riyadh')}</div>
            <h1 className="mt-2 max-w-4xl text-2xl font-semibold leading-tight text-white md:text-4xl">{ar ? s.overall.headline_ar : s.overall.headline_en}</h1>
          </div>
          <div className="flex items-center gap-3">
            <StatusChip status={s.overall.status} lang={lang} pulse />
            <Link href="/brief" className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-ink-950 hover:bg-mist-100">{t(lang, 'brief')} →</Link>
          </div>
        </div>

        {/* Three panels */}
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {/* 1 · Shelves & prices */}
          <Panel lang={lang} index="01" title={t(lang, 'shelves')} question={t(lang, 'shelvesQ')} status={s.shelves.status} sample={s.shelves.sample} source={s.shelves.source}>
            <div className="grid grid-cols-2 gap-4">
              <Stat big label={t(lang, 'foodCpi')} value={s.shelves.foodCpi.value} delta={s.shelves.foodCpi.wow} deltaLabel={t(lang, 'wow')} invert />
              <Stat big label={t(lang, 'cpiOverall')} value={s.shelves.cpiOverall.value} delta={s.shelves.cpiOverall.wow} deltaLabel={t(lang, 'wow')} invert />
            </div>
            <div className="mt-4 text-xs text-mist-500"><span className="num text-mist-300">{s.shelves.productsTracked}</span> {t(lang, 'productsTracked')}</div>
            <div className="mt-4">
              <div className="label">{t(lang, 'fastestRising')}</div>
              <ul className="mt-2 space-y-1.5">
                {s.shelves.fastestRising.map((f, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-mist-100">{ar ? f.category_ar ?? f.category : f.category}</span>
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 rounded bg-pulse-amber/70" style={{ width: Math.min(96, Math.max(8, f.wow * 40)) }} />
                      <Delta value={f.wow} invert />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline justify-between">
                <div className="label">{t(lang, 'stockouts')}</div>
                <span className="num text-lg font-semibold text-white">{s.shelves.stockouts.count}</span>
              </div>
              <div className="text-[11px] text-mist-500">{t(lang, 'stockoutsSub')}</div>
              <ul className="mt-2 space-y-1 text-xs text-mist-300">
                {s.shelves.stockouts.items.slice(0, 4).map((it, i) => (
                  <li key={i} className="flex justify-between gap-2"><span className="truncate">{ar ? it.product_ar ?? it.product : it.product}</span><span className="shrink-0 text-mist-500">{ar ? it.city_ar ?? it.city : it.city} · {it.retailers}</span></li>
                ))}
              </ul>
            </div>
          </Panel>

          {/* 2 · Supply & routes */}
          <Panel lang={lang} index="02" title={t(lang, 'supply')} question={t(lang, 'supplyQ')} status={s.supply.status} sample={s.supply.sample} source={s.supply.source}>
            <div className="flex items-center justify-between rounded-lg border border-line bg-ink-800/60 px-4 py-3">
              <div>
                <div className="label">{t(lang, 'hormuz')}</div>
                <div className={`num mt-0.5 text-2xl font-semibold ${s.supply.hormuz.state === 'open' ? 'text-pulse-green' : s.supply.hormuz.state === 'restricted' ? 'text-pulse-amber' : 'text-pulse-red'}`}>{hz}</div>
              </div>
              <div className="max-w-[55%] text-right text-[11px] leading-snug text-mist-500 rtl:text-left">{ar ? s.supply.hormuz.note_ar : s.supply.hormuz.note_en}</div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Stat label={t(lang, 'importsViaHormuz')} value={s.supply.exposure.importsViaHormuzPct} digits={0} suffix="%" />
              <Stat label={t(lang, 'cpiAtRisk')} value={s.supply.exposure.cpiWeightAtRisk} suffix="%" />
              <Stat label={t(lang, 'critical')} value={s.supply.exposure.criticalProducts} digits={0} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Stat label={t(lang, 'portCalls')} value={s.supply.portCalls.weekly} digits={0} delta={s.supply.portCalls.wow} deltaLabel={t(lang, 'wow')} />
              <Stat label={t(lang, 'daysGulf')} value={s.supply.inbound.daysOfSupplyGulfPorts} digits={0} />
              <Stat label={t(lang, 'daysRedSea')} value={s.supply.inbound.daysOfSupplyRedSeaPorts} digits={0} />
            </div>
            <div className="mt-3 text-xs text-mist-500">{t(lang, 'inbound')}: <span className="num text-mist-100">{s.supply.inbound.vesselsGulf}</span> {t(lang, 'gulf')} · <span className="num text-mist-100">{s.supply.inbound.vesselsRedSea}</span> {t(lang, 'redSea')}</div>
            <div className="mt-4">
              <div className="label">{t(lang, 'topAtRisk')}</div>
              <ul className="mt-2 space-y-2">
                {s.supply.topAtRisk.slice(0, 4).map((p, i) => (
                  <li key={i} className="text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-mist-100">{ar ? p.product_ar ?? p.product : p.product} <span className="num text-mist-500">HS {p.hs6}</span></span>
                      <span className={`num shrink-0 font-semibold ${p.hormuzPct >= 70 ? 'text-pulse-red' : p.hormuzPct >= 40 ? 'text-pulse-amber' : 'text-pulse-green'}`}>{p.hormuzPct}%</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1 flex-1 rounded bg-ink-700"><div className={`h-1 rounded ${p.hormuzPct >= 70 ? 'bg-pulse-red' : p.hormuzPct >= 40 ? 'bg-pulse-amber' : 'bg-pulse-green'}`} style={{ width: `${p.hormuzPct}%` }} /></div>
                      <span className="shrink-0 text-mist-500">→ {ar ? p.altSupplier_ar ?? p.altSupplier : p.altSupplier}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>

          {/* 3 · Confidence */}
          <Panel lang={lang} index="03" title={t(lang, 'confidence')} question={t(lang, 'confidenceQ')} status={s.confidence.status} sample={s.confidence.sample} source={s.confidence.source}>
            <div className="grid grid-cols-2 gap-4">
              <Stat big label={t(lang, 'brent')} value={s.confidence.brent.value} prefix="$" delta={s.confidence.brent.d1} deltaLabel={t(lang, 'd1')} />
              <Stat big label={t(lang, 'tasi')} value={s.confidence.tasi.value} digits={0} delta={s.confidence.tasi.d1} deltaLabel={t(lang, 'd1')} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Stat label={t(lang, 'samaRate')} value={s.confidence.samaRate} digits={2} suffix="%" />
              <Stat label={t(lang, 'pmi')} value={s.confidence.pmi} />
              <Stat label={t(lang, 'fwd')} value={s.confidence.riyalFwd12m?.value ?? null} digits={0} suffix={t(lang, 'points')} delta={s.confidence.riyalFwd12m?.d1} invert />
            </div>
            <div className="mt-4 rounded-lg border border-line bg-ink-800/60 px-4 py-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="label">{t(lang, 'sentiment')} {s.confidence.sentiment.live && <span className="chip chip-normal ml-2 align-middle">{t(lang, 'live')}</span>}</div>
                  <div className="text-[11px] text-mist-500">{t(lang, 'sentimentSub')} · {s.confidence.sentiment.date}</div>
                </div>
                <div className={`num text-2xl font-semibold ${s.confidence.sentiment.score >= 0.2 ? 'text-pulse-green' : s.confidence.sentiment.score > -0.2 ? 'text-pulse-amber' : 'text-pulse-red'}`}>{s.confidence.sentiment.score > 0 ? '+' : ''}{s.confidence.sentiment.score.toFixed(2)}</div>
              </div>
              <div className="mt-2"><Sparkline data={s.confidence.sentiment.trend} domain={[-1, 1]} color={s.confidence.sentiment.score >= 0 ? '#1FB58C' : '#E5484D'} /></div>
              {s.confidence.sentiment.headlines.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-mist-300">
                  {s.confidence.sentiment.headlines.slice(0, 3).map((h, i) => (
                    <li key={i} className="flex gap-2"><span className={h.sentiment === 'negative' ? 'text-pulse-red' : h.sentiment === 'positive' ? 'text-pulse-green' : 'text-mist-500'}>●</span><span className="truncate">{h.headline}</span></li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Stat label={t(lang, 'flights')} value={s.confidence.flights?.outboundSeatPriceIdx ?? null} digits={0} delta={s.confidence.flights?.d7} deltaLabel="7d" invert />
              <Stat label={t(lang, 'rentals')} value={s.confidence.rentals?.easternProvinceListingsIdx ?? null} digits={0} delta={s.confidence.rentals?.d7} deltaLabel="7d" invert />
            </div>
          </Panel>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2"><AlertList alerts={s.alerts} lang={lang} /></div>
          <section className="card p-5">
            <div className="label">{t(lang, 'modules')}</div>
            <p className="mt-2 text-sm text-mist-300">{t(lang, 'modulesSub')}</p>
            <Link href="/modules" className="mt-3 inline-block text-sm font-semibold text-pulse-blue hover:underline">{t(lang, 'modules')} →</Link>
          </section>
        </div>
      </div>
    </main>
  );
}

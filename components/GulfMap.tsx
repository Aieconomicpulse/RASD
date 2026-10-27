import type { Lang } from '@/lib/types';

/**
 * The Kingdom between two seas — a schematic chart of the routes that matter this morning.
 * Coastlines are simplified from a few hundred known points (equirectangular, cos 22°), not survey data.
 * The shipping lane through Hormuz takes the desk's status colour; lanes and roads that avoid it are drawn
 * as open routes. Server-rendered SVG, so it prints and works without scripts.
 */
type P = [number, number]; // [lon, lat]
const LON0 = 32, LAT1 = 32.5, K = 30, COS = 0.9272;
const X = (lon: number) => (lon - LON0) * K * COS;
const Y = (lat: number) => (LAT1 - lat) * K;
const W = Math.round(X(60.5)), H = Math.round(Y(11));
const path = (pts: P[], close = false) => pts.map(([lo, la], i) => `${i ? 'L' : 'M'}${X(lo).toFixed(1)} ${Y(la).toFixed(1)}`).join(' ') + (close ? 'Z' : '');

// One water body: Suez → African shore → Horn → map edge → Iranian shore → Arabian shore of the Gulf →
// Oman → south Arabian shore → Bab el-Mandeb → Saudi Red Sea shore → Gulf of Aqaba → Sinai → Suez.
const WATER: P[] = [
  [32.55, 29.97], [32.62, 29.55], [32.75, 29.15], [33.08, 28.36], [33.55, 27.75], [33.83, 27.25], [33.95, 26.73], [34.28, 26.1], [34.9, 25.07], [35.48, 23.95], [35.65, 23.55],
  [36.6, 22.2], [37.22, 19.6], [37.33, 19.1], [38.1, 18.3], [38.9, 16.6], [39.45, 15.61], [40.2, 14.9], [41.2, 14.1], [42.0, 13.4], [42.73, 13.0], [43.2, 12.55], [43.3, 12.0], [43.15, 11.6], [43.6, 11.0],
  [60.5, 11.0], [60.5, 25.2],
  [59.5, 25.4], [58.8, 25.55], [57.77, 25.64], [57.25, 26.25], [57.05, 26.75], [56.75, 27.05], [56.27, 27.18], [55.6, 26.95], [54.88, 26.56], [53.7, 26.95], [52.6, 27.45], [52.06, 27.84], [51.4, 28.15], [50.84, 28.97], [50.3, 29.75], [49.5, 30.05], [48.9, 30.05], [48.55, 29.93],
  [48.45, 29.95], [48.2, 29.8], [47.95, 29.4], [48.15, 29.07], [48.4, 28.65], [48.5, 28.42], [48.7, 28.05], [49.05, 27.7], [49.45, 27.4], [49.66, 27.01], [50.05, 26.8], [50.16, 26.65], [50.0, 26.55], [50.1, 26.43], [50.21, 26.28], [50.15, 25.95], [50.22, 25.65], [50.3, 25.3], [50.5, 24.9], [50.8, 24.75],
  [50.85, 25.1], [50.78, 25.42], [50.85, 25.65], [51.03, 25.98], [51.22, 26.15], [51.4, 26.05], [51.55, 25.9], [51.5, 25.69], [51.55, 25.4], [51.53, 25.29], [51.62, 25.05], [51.55, 24.85], [51.4, 24.62],
  [51.65, 24.3], [51.75, 24.08], [52.4, 24.15], [52.73, 24.11], [53.45, 24.12], [54.0, 24.15], [54.37, 24.47], [54.7, 24.75], [55.03, 25.01], [55.27, 25.2], [55.39, 25.36], [55.55, 25.57], [55.95, 25.79], [56.08, 26.05], [56.25, 26.22], [56.37, 26.38],
  [56.45, 26.2], [56.4, 25.95], [56.27, 25.62], [56.35, 25.12], [56.47, 24.75], [56.74, 24.36], [57.2, 24.0], [57.88, 23.7], [58.6, 23.61], [58.92, 23.26], [59.53, 22.57], [59.8, 22.53],
  [59.45, 21.85], [59.0, 21.2], [58.65, 20.55], [58.1, 20.25], [57.8, 19.95], [57.7, 19.67], [57.82, 18.98], [57.2, 18.9], [56.65, 18.55], [56.1, 18.1], [55.6, 17.9], [55.3, 17.45], [54.7, 16.99], [54.08, 17.01], [53.4, 16.75], [52.9, 16.55], [52.17, 16.2], [52.2, 15.8], [51.6, 15.4], [51.25, 15.2], [50.4, 14.95], [49.6, 14.75], [49.12, 14.53], [48.6, 14.1], [48.17, 13.98], [47.4, 13.65], [46.7, 13.5], [45.8, 13.35], [45.3, 13.05], [45.03, 12.78], [44.4, 12.7], [43.9, 12.65], [43.45, 12.68],
  [43.25, 13.32], [43.25, 13.8], [43.0, 14.4], [42.95, 14.8], [42.8, 15.3], [42.7, 15.7], [42.8, 16.32], [42.78, 16.4], [42.55, 16.89], [42.2, 17.4], [41.85, 17.8], [41.55, 18.21], [41.08, 19.13], [40.65, 19.7], [40.27, 20.15], [39.7, 20.85], [39.17, 21.49], [39.05, 22.1], [39.09, 22.55], [39.03, 22.8], [38.6, 23.4], [38.06, 24.09], [37.65, 24.55], [37.27, 25.02], [36.85, 25.6], [36.47, 26.23], [36.05, 26.8], [35.69, 27.35], [35.2, 27.75], [34.8, 27.95],
  [34.75, 28.4], [34.85, 28.9], [34.94, 29.29], [35.0, 29.53], [34.92, 29.52], [34.66, 28.97], [34.52, 28.5], [34.33, 27.9], [34.25, 27.73], [33.9, 27.95], [33.6, 28.24], [33.1, 29.05], [32.7, 29.6],
];
const MED: P[] = [[32, 32.5], [32, 31.35], [32.3, 31.27], [32.8, 31.05], [33.8, 31.13], [34.45, 31.52], [34.65, 31.8], [34.77, 32.08], [34.9, 32.5]];
// The Kingdom: Jordan, Iraq and Kuwait borders, the Gulf coast, the Qatar, UAE, Oman and Yemen borders, the Red Sea coast.
const KSA: P[] = [
  [34.96, 29.36], [36.07, 29.19], [36.75, 29.87], [37.65, 30.33], [37.0, 31.5], [38.0, 32.0], [39.2, 32.15], [40.4, 31.95], [42.08, 31.1], [44.7, 29.2], [46.55, 29.1], [47.45, 28.53], [48.43, 28.54],
  [48.5, 28.42], [48.7, 28.05], [49.05, 27.7], [49.45, 27.4], [49.66, 27.01], [50.05, 26.8], [50.16, 26.65], [50.0, 26.55], [50.1, 26.43], [50.21, 26.28], [50.15, 25.95], [50.22, 25.65], [50.3, 25.3], [50.5, 24.9], [50.8, 24.75],
  [51.1, 24.55], [51.4, 24.62], [51.65, 24.3], [51.58, 24.17], [52.58, 22.94], [55.2, 22.7], [55.67, 22.0], [55.0, 20.0], [52.0, 19.0], [49.12, 18.62], [47.6, 17.45], [46.4, 17.25], [45.2, 17.42], [44.2, 17.42], [43.4, 17.55], [43.2, 17.0], [42.78, 16.4],
  [42.55, 16.89], [42.2, 17.4], [41.85, 17.8], [41.55, 18.21], [41.08, 19.13], [40.65, 19.7], [40.27, 20.15], [39.7, 20.85], [39.17, 21.49], [39.05, 22.1], [39.09, 22.55], [39.03, 22.8], [38.6, 23.4], [38.06, 24.09], [37.65, 24.55], [37.27, 25.02], [36.85, 25.6], [36.47, 26.23], [36.05, 26.8], [35.69, 27.35], [35.2, 27.75], [34.8, 27.95], [34.75, 28.4], [34.85, 28.9], [34.94, 29.29],
];

const LANE_HORMUZ: P[] = [[60.5, 23.4], [59.3, 24.45], [57.6, 25.2], [56.75, 26.05], [56.45, 26.55], [55.5, 26.45], [54.0, 26.3], [53.0, 26.45], [52.0, 26.7], [51.4, 26.65], [50.6, 26.62], [50.25, 26.48]];
const LANE_BAB: P[] = [[60.5, 13.6], [52.0, 13.1], [48.0, 12.6], [45.0, 12.35], [43.5, 12.5], [42.4, 13.7], [41.4, 15.3], [40.3, 17.6], [39.0, 20.6], [38.95, 21.45], [39.17, 21.49]];
const LANE_SUEZ: P[] = [[32.55, 29.9], [32.75, 29.4], [33.3, 28.4], [34.4, 27.3], [35.6, 25.8], [36.9, 24.6], [37.85, 24.0], [38.06, 24.09]];
const ROAD_WEST: P[] = [[39.17, 21.49], [40.5, 21.9], [43.6, 23.6], [46.72, 24.69], [48.4, 25.6], [50.1, 26.43]];
const ROAD_JORDAN: P[] = [[35.0, 29.53], [35.6, 29.25], [36.57, 28.38], [39.2, 27.9], [41.69, 27.52], [43.97, 26.33], [46.72, 24.69]];
const ROAD_OMAN: P[] = [[57.7, 19.67], [56.3, 19.95], [57.53, 22.38], [56.52, 23.22], [55.79, 24.25], [54.6, 24.05], [53.2, 23.95], [51.58, 24.17], [49.59, 25.38], [46.72, 24.69]];
const ROAD_SALALAH: P[] = [[54.0, 16.93], [54.02, 17.67], [56.3, 19.95]];
const ROAD_FUJAIRAH: P[] = [[56.34, 25.13], [55.8, 24.85], [55.2, 24.6], [54.6, 24.05]];
const ROAD_DAMMAM: P[] = [[49.59, 25.38], [50.1, 26.43]];

const STATE_COLOR = { open: '#0ca30c', restricted: '#ec835a', closed: '#d03b3b' } as const;
const OPEN = '#0ca30c';

type Lab = { en: string; ar: string };
const N = {
  redSea: { en: 'Red Sea', ar: 'البحر الأحمر' }, gulf: { en: 'Arabian Gulf', ar: 'الخليج العربي' }, arabianSea: { en: 'Arabian Sea', ar: 'بحر العرب' },
  ksa: { en: 'Saudi Arabia', ar: 'المملكة العربية السعودية' }, riyadh: { en: 'Riyadh', ar: 'الرياض' }, jeddah: { en: 'Jeddah', ar: 'جدة' }, yanbu: { en: 'Yanbu', ar: 'ينبع' },
  kap: { en: 'King Abdullah Port', ar: 'ميناء الملك عبدالله' }, dammam: { en: 'Dammam', ar: 'الدمام' }, aqaba: { en: 'Aqaba', ar: 'العقبة' }, fujairah: { en: 'Fujairah', ar: 'الفجيرة' },
  duqm: { en: 'Duqm', ar: 'الدقم' }, salalah: { en: 'Salalah', ar: 'صلالة' }, hormuz: { en: 'Strait of Hormuz', ar: 'مضيق هرمز' }, bab: { en: 'Bab el-Mandeb', ar: 'باب المندب' }, suez: { en: 'Suez', ar: 'السويس' },
} satisfies Record<string, Lab>;
const STATE: Record<'open' | 'restricted' | 'closed', Lab> = { open: { en: 'Open', ar: 'مفتوح' }, restricted: { en: 'Restricted', ar: 'مقيّد' }, closed: { en: 'Closed', ar: 'مغلق' } };

function Label({ at, children, anchor = 'start', size = 15, weight = 500, fill = 'rgb(var(--ink))', minor = false, italic = false, rotate = 0, halo = true }:
  { at: P; children: string; anchor?: 'start' | 'middle' | 'end'; size?: number; weight?: number; fill?: string; minor?: boolean; italic?: boolean; rotate?: number; halo?: boolean }) {
  const x = X(at[0]), y = Y(at[1]);
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={weight} fill={fill} fontStyle={italic ? 'italic' : undefined}
      transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined} className={minor ? 'minor' : undefined}
      paintOrder={halo ? 'stroke' : undefined} stroke={halo ? 'rgb(var(--land))' : undefined} strokeWidth={halo ? 4 : undefined} strokeLinejoin="round">
      {children}
    </text>
  );
}

export default function GulfMap({ lang, state, title }: { lang: Lang; state: 'open' | 'restricted' | 'closed'; title: string }) {
  const l = (x: Lab) => x[lang];
  const hz = STATE_COLOR[state];
  const dot = (p: P, fill: string, r = 6) => <circle cx={X(p[0])} cy={Y(p[1])} r={r} fill={fill} stroke="rgb(var(--land))" strokeWidth={2.5} />;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="map block h-auto w-full" role="img" aria-label={title} direction="ltr">
      <rect width={W} height={H} fill="rgb(var(--land))" />
      <path d={path(KSA, true)} fill="rgb(var(--kingdom))" />
      <path d={path(WATER, true)} fill="rgb(var(--sea))" stroke="rgb(var(--coast))" strokeWidth={1} strokeLinejoin="round" />
      <path d={path(MED, true)} fill="rgb(var(--sea))" stroke="rgb(var(--coast))" strokeWidth={1} />
      <path d={path(KSA, true)} fill="none" stroke="rgb(var(--ink-3))" strokeWidth={1.2} strokeLinejoin="round" />

      {/* sea names */}
      <Label at={[36.35, 24.55]} size={15} weight={500} italic fill="rgb(var(--ink-3))" rotate={58} halo={false}>{l(N.redSea)}</Label>
      <Label at={[49.25, 28.4]} size={15} weight={500} italic fill="rgb(var(--ink-3))" rotate={25} halo={false}>{l(N.gulf)}</Label>
      <Label at={[56.8, 15.4]} size={15} weight={500} italic fill="rgb(var(--ink-3))" halo={false}>{l(N.arabianSea)}</Label>
      <Label at={[46.6, 20.6]} anchor="middle" size={21} weight={600} fill="rgb(var(--ink-2))">{l(N.ksa)}</Label>

      {/* roads into the Kingdom and on to the Eastern Province */}
      {[ROAD_JORDAN, ROAD_OMAN, ROAD_SALALAH, ROAD_FUJAIRAH, ROAD_DAMMAM].map((r, i) => (
        <path key={i} d={path(r)} fill="none" stroke="rgb(var(--accent))" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      <path d={path(ROAD_WEST)} fill="none" stroke="rgb(var(--accent))" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />

      {/* shipping lanes */}
      <path d={path(LANE_BAB)} fill="none" stroke={OPEN} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d={path(LANE_SUEZ)} fill="none" stroke={OPEN} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d={path(LANE_HORMUZ)} fill="none" stroke={hz} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={state === 'open' ? undefined : '11 8'} />

      {/* chokepoints */}
      <g>
        <circle cx={X(56.45)} cy={Y(26.55)} r={13} fill={hz} stroke="rgb(var(--land))" strokeWidth={3} />
        <line x1={X(56.2)} y1={Y(27.75)} x2={X(56.42)} y2={Y(26.95)} stroke="rgb(var(--ink-2))" strokeWidth={1.2} />
        <Label at={[56.2, 28.75]} anchor="end" size={18} weight={600}>{l(N.hormuz)}</Label>
        <Label at={[56.2, 28.05]} anchor="end" size={17} weight={700} fill="rgb(var(--ink))">{l(STATE[state])}</Label>
      </g>
      <circle cx={X(43.38)} cy={Y(12.62)} r={8} fill="rgb(var(--land))" stroke="rgb(var(--ink-2))" strokeWidth={2.5} />
      <Label at={[42.9, 11.55]} anchor="end" size={15}>{l(N.bab)}</Label>
      <circle cx={X(32.55)} cy={Y(29.97)} r={7} fill="rgb(var(--land))" stroke="rgb(var(--ink-2))" strokeWidth={2.5} />
      <Label at={[32.25, 30.75]} size={15}>{l(N.suez)}</Label>

      {/* ports and the capital */}
      {dot([39.17, 21.49], OPEN, 7)}{dot([38.06, 24.09], OPEN, 7)}{dot([39.01, 22.73], OPEN, 7)}
      <Label at={[39.55, 21.25]} size={16} weight={600}>{l(N.jeddah)}</Label>
      <Label at={[38.45, 24.0]} size={16} weight={600}>{l(N.yanbu)}</Label>
      <Label at={[39.45, 22.65]} size={15} weight={500} minor>{l(N.kap)}</Label>
      {dot([50.1, 26.43], hz, 7)}
      <Label at={[49.75, 26.15]} anchor="end" size={16} weight={600}>{l(N.dammam)}</Label>
      <rect x={X(46.72) - 6} y={Y(24.69) - 6} width={12} height={12} fill="rgb(var(--ink))" stroke="rgb(var(--land))" strokeWidth={2.5} />
      <Label at={[46.95, 24.05]} size={16} weight={600}>{l(N.riyadh)}</Label>
      {dot([35.0, 29.53], 'rgb(var(--accent))', 5)}{dot([56.34, 25.13], 'rgb(var(--accent))', 5)}{dot([57.7, 19.67], 'rgb(var(--accent))', 5)}{dot([54.0, 16.93], 'rgb(var(--accent))', 5)}
      <Label at={[34.7, 29.95]} anchor="end" size={14} minor>{l(N.aqaba)}</Label>
      <Label at={[56.75, 24.85]} size={14} minor>{l(N.fujairah)}</Label>
      <Label at={[58.05, 19.5]} size={14} minor>{l(N.duqm)}</Label>
      <Label at={[54.0, 16.35]} anchor="middle" size={14} minor>{l(N.salalah)}</Label>
    </svg>
  );
}

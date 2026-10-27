export type Status = 'normal' | 'watch' | 'alert' | 'critical';
export type Lang = 'en' | 'ar';
export type HormuzGrade = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE' | 'INDEX';
export type Pillar = 'supply' | 'shelves' | 'confidence' | 'economy';
/** A bilingual string. */
export interface L { en: string; ar: string }

/** A reading with its changes. All changes are percentages unless the field says otherwise. */
export interface Delta { value: number; wow?: number | null; m4?: number | null; yoy?: number | null; asOf?: string }
export interface Point { date: string; value: number }

export interface SentimentHeadline { headline: string; source?: string; sentiment?: string; score?: number; important?: boolean; date?: string }
export interface SentimentReading {
  score: number; band: string; date: string; headlineCount: number;
  trend: { date: string; score: number; headlines?: number }[];
  headlines: SentimentHeadline[];
  live?: boolean;
}

export interface Category { key: string; label_en: string; label_ar: string; value: number; wow: number; m4: number | null; hormuz: HormuzGrade; sinceWar: number | null }

/** A way to bring a product in without Hormuz, as modelled by the KSA platform. */
export interface SupplyOption { country: string; country_ar: string | null; usdM: number; days: string | null; cost: string | null; port: string | null; suggested: boolean; reason: string | null }
export interface AtRiskProduct {
  hs6: string; product: string; product_ar: string | null; chapter: string;
  hormuzPct: number; hormuzUsdM: number; totalUsdM: number;
  mainSource: string; mainSource_ar: string | null; mainShare: number;   // % of the product's imports from the top supplier
  options: SupplyOption[];                                                // existing Hormuz-free trade first, then suggested
  existingShare: number;                                                  // % of imports already available from Hormuz-free options
  atScale: boolean;                                                       // existingShare ≥ 5%
}
/** A way into the Kingdom that does not pass Hormuz. */
export interface Corridor { id: string; name: L; via: L; km: number | null; days: string | null; cost: string | null; kind: 'sea' | 'land'; warn?: boolean }
export interface WarRow { key: string; label_en: string; label_ar: string; pre: number; post: number; digits: number; unit?: string }

export interface Snapshot {
  asOf: string; timezone: string; sample: boolean;
  overall: { status: Status; headline_en: string; headline_ar: string };
  shelves: {
    sample?: boolean; status: Status; asOf: string; productsTracked: number;
    foodCpi: Delta; cpiOverall: Delta;
    categories: Category[];                 // all tracked categories, sorted by w/w desc
    fastestRising: Category[];              // top by w/w
    highest: Category;                      // highest level vs base 100
    sinceWar: { start: string; preWeeks: number; postWeeks: number; foodPre: number; foodPost: number; worst: Category | null; eased: Category | null };
    basket: { directProducts: number; directWeightPct: number; rawMaterialRiskProducts: number; rawMaterialRiskWeightPct: number; direct: { product: string; origin: string; weight: number }[] };
    series: { date: string; food: number; cpi: number }[];   // weekly, full history
    stockouts: null;                        // not tracked yet — needs an availability flag in the retail scraper
    source: string;
  };
  supply: {
    sample?: boolean; status: Status; asOf: string;
    hormuz: { state: 'open' | 'restricted' | 'closed'; since?: string | null; note_en?: string; note_ar?: string; setBy: 'desk' | 'default' };
    exposure: {
      comtradeYear: number; importsViaHormuzPct: number; importsViaHormuzUsdB: number; importsTotalUsdB: number; criticalProducts: number; productsCovered: number;
      foodViaHormuzPct: number; foodViaHormuzUsdB: number; foodImportsUsdB: number; foodProductsCovered: number;
      foodExposed: { lines: number; usdB: number; top5UsdB: number };   // food lines at least half dependent on Hormuz
      buckets: { critical: number; high: number; moderate: number; low: number };
    };
    portCalls: { weekly: number; wow: number; vs2025: number; avg2025: number; asOf: string; series: { date: string; value: number | null }[] };
    topAtRisk: AtRiskProduct[];             // food lines by value through Hormuz
    corridors: Corridor[];                  // Hormuz-free ways in, with the onward road to the Eastern Province
    source: string;
  };
  confidence: {
    sample?: boolean; status: Status; asOf: string;
    brent: Delta & { vsPreWar: number; preWar: number }; tasi: Delta; samaRate: number; pmi: number; investment: Delta;
    brentTrend: Point[]; tasiTrend: Point[];
    sentiment: SentimentReading;
    source: string;
  };
  economy: {
    sample?: boolean; status: Status; asOf: string;
    gdp: { totalUsdT: number; oilUsdT: number; nonOilUsdT: number; oilShare: number; momentum4w: number; wow: number; series: { date: string; total: number; nonOil: number }[] };
    spending: Delta & { trend: Point[] }; employment: Delta & { trend: Point[] }; investment: Delta; pmi: number; pmiTrend: Point[];
    sinceWar: { start: string; rows: WarRow[] };
    annual: { year: string; gdpUsdT: number | null; oilUsdT: number | null; nonOilUsdT: number | null; brent: number | null; portCalls: number | null; spending: number | null; weeks: number }[];
    source: string;
  };
  alerts: { level: 'info' | 'watch' | 'alert' | 'critical'; time: string; text_en: string; text_ar: string; panel?: Pillar; fromDesk?: boolean }[];
  provenance: { platform: string; fetchedAt: string; latest: Record<string, string | number | undefined>; warStart: string };
  strategy?: Strategy;
  brief?: { date: string; en: string[]; ar: string[]; generated?: boolean };
}

// ---- the strategic layer (lib/strategy.ts) ------------------------------------------------------------
export type Priority = 'act' | 'prepare' | 'monitor';
export interface ScoreRow {
  pillar: Pillar; status: Status; name: L;
  value: string; unit: L;                  // the one reading that best describes the pillar today
  meaning: L;                              // what it means, in a sentence
  next: { level: Status; text: L; now: L } | null;   // the nearest threshold that would change the status
}
export interface Decision { id: string; priority: Priority; pillar: Pillar; title: L; body: L }
export interface Strategy {
  binding: Pillar | null;
  headline: L; standfirst: L;              // the bottom line
  judgments: L[];                          // three key judgments
  scorecard: ScoreRow[];
  decisions: Decision[];
  sections: Record<'supply' | 'shelves' | 'growth', { title: L; dek: L }>;
}

/** Operator inputs that no feed can decide — set by the desk each morning (data/desk.json or DESK_URL). */
export interface Desk {
  hormuz?: { state: 'open' | 'restricted' | 'closed'; since?: string | null; note_en?: string; note_ar?: string };
  alerts?: Snapshot['alerts'];
}

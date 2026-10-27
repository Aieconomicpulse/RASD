export type Status = 'normal' | 'watch' | 'alert' | 'critical';
export type Lang = 'en' | 'ar';
export type HormuzGrade = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE' | 'INDEX';

/** A reading with its changes. All changes are percentages unless the field says otherwise. */
export interface Delta { value: number; wow?: number | null; m4?: number | null; yoy?: number | null; d1?: number | null; asOf?: string }
export interface Point { date: string; value: number }

export interface SentimentHeadline { headline: string; source?: string; sentiment?: string; score?: number; important?: boolean; date?: string }
export interface SentimentReading {
  score: number; band: string; date: string; headlineCount: number;
  trend: { date: string; score: number; headlines?: number }[];
  headlines: SentimentHeadline[];
  live?: boolean;
}

export interface Category { key: string; label_en: string; label_ar: string; value: number; wow: number; hormuz: HormuzGrade; sinceWar: number | null }
export interface AtRiskProduct {
  hs6: string; product: string; product_ar: string | null; chapter: string; hormuzPct: number; hormuzUsdM: number; totalUsdM: number;
  mainSource: string; mainSource_ar: string | null; altSupplier: string; altSupplier_ar: string | null; altDays: string | null; altCost: string | null;
}
export interface Corridor { name_en: string; name_ar: string; via_en: string; via_ar: string; days: string | null; cost: string | null }
export interface WarRow { key: string; label_en: string; label_ar: string; pre: number; post: number; digits: number; unit?: string }

export interface Snapshot {
  asOf: string; timezone: string; sample: boolean;
  overall: { status: Status; headline_en: string; headline_ar: string };
  shelves: {
    sample?: boolean; status: Status; asOf: string; productsTracked: number;
    foodCpi: Delta; cpiOverall: Delta;
    categories: Category[];                 // all tracked categories, latest level + w/w, sorted by w/w desc
    fastestRising: Category[];              // top by w/w
    highest: Category;                      // highest level vs base 100
    sinceWar: { start: string; preWeeks: number; postWeeks: number; foodPre: number; foodPost: number; worst: Category | null; eased: Category | null };
    basket: { directProducts: number; directWeightPct: number; rawMaterialRiskProducts: number; rawMaterialRiskWeightPct: number; direct: { product: string; origin: string; weight: number }[] };
    foodTrend: Point[];                     // weekly FoodOverall, last 52 weeks
    stockouts: null;                        // not tracked yet — needs an availability flag in the retail scraper
    source: string;
  };
  supply: {
    sample?: boolean; status: Status; asOf: string;
    hormuz: { state: 'open' | 'restricted' | 'closed'; since?: string | null; note_en?: string; note_ar?: string; setBy: 'desk' | 'default' };
    exposure: {
      comtradeYear: number; importsViaHormuzPct: number; importsViaHormuzUsdB: number; importsTotalUsdB: number; criticalProducts: number; productsCovered: number;
      foodViaHormuzPct: number; foodViaHormuzUsdB: number; foodImportsUsdB: number; foodProductsCovered: number;
      buckets: { critical: number; high: number; moderate: number; low: number };
    };
    portCalls: { weekly: number; wow: number; vs2025: number; avg2025: number; asOf: string; trend: Point[] };
    topAtRisk: AtRiskProduct[];             // food products by value at risk
    corridors: Corridor[];                  // Hormuz-free ways in
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
    gdp: { totalUsdT: number; oilUsdT: number; nonOilUsdT: number; oilShare: number; momentum4w: number; wow: number; trend: Point[]; nonOilTrend: Point[] };
    spending: Delta & { trend: Point[] }; employment: Delta; investment: Delta; pmi: number;
    sinceWar: { start: string; rows: WarRow[] };
    annual: { year: string; gdpUsdT: number | null; oilUsdT: number | null; nonOilUsdT: number | null; brent: number | null; portCalls: number | null; spending: number | null; weeks: number }[];
    source: string;
  };
  alerts: { level: 'info' | 'watch' | 'alert' | 'critical'; time: string; text_en: string; text_ar: string; panel?: 'shelves' | 'supply' | 'confidence' | 'economy' }[];
  provenance: { platform: string; fetchedAt: string; latest: Record<string, string | number | undefined>; warStart: string };
  brief?: { date: string; en: string[]; ar: string[]; generated?: boolean };
}

/** Operator inputs that no feed can decide — set by the desk each morning (data/desk.json or DESK_URL). */
export interface Desk {
  hormuz?: { state: 'open' | 'restricted' | 'closed'; since?: string | null; note_en?: string; note_ar?: string };
  alerts?: Snapshot['alerts'];
}

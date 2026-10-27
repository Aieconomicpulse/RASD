export type Status = 'normal' | 'watch' | 'alert' | 'critical';
export type Lang = 'en' | 'ar';

export interface Delta { value: number; d1?: number; wow?: number; mom?: number; d7?: number; unit?: string; base?: string }

export interface SentimentHeadline {
  headline: string; source?: string; sentiment?: string; score?: number; important?: boolean; date?: string;
}
export interface SentimentReading {
  score: number; band: string; date: string; headlineCount: number;
  trend: { date: string; score: number; headlines?: number }[];
  headlines: SentimentHeadline[];
  live?: boolean;
}

export interface Snapshot {
  asOf: string; timezone: string; sample: boolean;
  overall: { status: Status; headline_en: string; headline_ar: string };
  shelves: {
    sample?: boolean; status: Status; productsTracked: number;
    foodCpi: Delta; cpiOverall: Delta;
    fastestRising: { category: string; category_ar?: string; wow: number }[];
    stockouts: { count: number; items: { product: string; product_ar?: string; city: string; city_ar?: string; retailers: number }[] };
    source: string;
  };
  supply: {
    sample?: boolean; status: Status;
    hormuz: { state: 'open' | 'restricted' | 'closed'; since?: string; note_en?: string; note_ar?: string };
    exposure: { cpiWeightAtRisk: number; importsViaHormuzPct: number; directProducts: number; partialProducts: number; criticalProducts: number };
    portCalls: { weekly: number; wow: number; gulfShare?: number };
    inbound: { vesselsGulf: number; vesselsRedSea: number; daysOfSupplyGulfPorts: number; daysOfSupplyRedSeaPorts: number };
    topAtRisk: { product: string; product_ar?: string; hs6: string; hormuzPct: number; altSupplier: string; altSupplier_ar?: string }[];
    source: string;
  };
  confidence: {
    sample?: boolean; status: Status;
    brent: Delta; tasi: Delta; samaRate: number; pmi: number;
    riyalFwd12m?: Delta | null; flights?: { outboundSeatPriceIdx: number; d7: number } | null; rentals?: { easternProvinceListingsIdx: number; d7: number } | null;
    sentiment: SentimentReading;
    source: string;
  };
  alerts: { level: 'info' | 'watch' | 'alert' | 'critical'; time: string; text_en: string; text_ar: string; panel?: string; sample?: boolean }[];
  brief?: { date: string; en: string[]; ar: string[]; generated?: boolean };
}

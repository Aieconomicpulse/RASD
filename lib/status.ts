import type { Snapshot, Status } from './types';

/**
 * Thresholds that turn readings into a status. Deliberately simple and visible:
 * a minister should be able to ask "why is this amber?" and get a one-line answer.
 * Tune with the ministry. All changes are percentages.
 */
export const RULES = {
  shelves: {
    foodWowWatch: 1.0, foodWowAlert: 2.5, foodWowCritical: 5.0,        // food index, week on week
    food4wWatch: 5.0, food4wAlert: 10.0, food4wCritical: 20.0,         // food index, over four weeks
  },
  supply: {
    portCallsWowAlert: -15, portCallsWowCritical: -30,                   // week on week
    portCallsVs2025Alert: -50, portCallsVs2025Critical: -85,             // against the 2025 weekly average
    // Hormuz: closed → critical, restricted → at least watch (desk-set)
  },
  confidence: {
    sentimentWatch: 0.0, sentimentAlert: -0.3, sentimentCritical: -0.6,  // pooled daily score, −1…+1
    tasiWowAlert: -5, tasiWowCritical: -10,                              // week on week
    brentVsPreWarWatch: 50, brentVsPreWarAlert: 100,                     // against the pre-war average
  },
  economy: {
    momentumWatch: 0, momentumAlert: -3, momentumCritical: -6,           // GDP nowcast, four-week momentum
    pmiAlert: 50, pmiCritical: 47,                                       // below = contraction
    spendingWowWatch: -2, spendingWowAlert: -5,                          // consumer spending, week on week
  },
};

const ORDER: Status[] = ['normal', 'watch', 'alert', 'critical'];
export const worst = (...s: Status[]): Status => s.reduce((a, b) => (ORDER.indexOf(b) > ORDER.indexOf(a) ? b : a), 'normal');

export function shelvesStatus(s: Snapshot['shelves']): Status {
  const r = RULES.shelves; const wow = s.foodCpi.wow ?? 0; const m4 = s.foodCpi.m4 ?? 0;
  if (wow >= r.foodWowCritical || m4 >= r.food4wCritical) return 'critical';
  if (wow >= r.foodWowAlert || m4 >= r.food4wAlert) return 'alert';
  if (wow >= r.foodWowWatch || m4 >= r.food4wWatch) return 'watch';
  return 'normal';
}

export function supplyStatus(s: Snapshot['supply']): Status {
  const r = RULES.supply; const pc = s.portCalls;
  if (s.hormuz.state === 'closed' || pc.wow <= r.portCallsWowCritical || pc.vs2025 <= r.portCallsVs2025Critical) return 'critical';
  if (pc.wow <= r.portCallsWowAlert || pc.vs2025 <= r.portCallsVs2025Alert) return 'alert';
  if (s.hormuz.state === 'restricted') return 'watch';
  return 'normal';
}

export function confidenceStatus(s: Snapshot['confidence']): Status {
  const r = RULES.confidence; const sent = s.sentiment?.score ?? 0; const tasi = s.tasi.wow ?? 0; const br = s.brent.vsPreWar;
  if (sent <= r.sentimentCritical || tasi <= r.tasiWowCritical) return 'critical';
  if (sent <= r.sentimentAlert || tasi <= r.tasiWowAlert || br >= r.brentVsPreWarAlert) return 'alert';
  if (sent <= r.sentimentWatch || br >= r.brentVsPreWarWatch) return 'watch';
  return 'normal';
}

export function economyStatus(s: Snapshot['economy']): Status {
  const r = RULES.economy; const m = s.gdp.momentum4w; const sp = s.spending.wow ?? 0;
  if (m <= r.momentumCritical || s.pmi < r.pmiCritical) return 'critical';
  if (m <= r.momentumAlert || s.pmi < r.pmiAlert || sp <= r.spendingWowAlert) return 'alert';
  if (m < r.momentumWatch || sp <= r.spendingWowWatch) return 'watch';
  return 'normal';
}

export function applyStatuses(snap: Snapshot): Snapshot {
  const shelves = { ...snap.shelves, status: shelvesStatus(snap.shelves) };
  const supply = { ...snap.supply, status: supplyStatus(snap.supply) };
  const confidence = { ...snap.confidence, status: confidenceStatus(snap.confidence) };
  const economy = { ...snap.economy, status: economyStatus(snap.economy) };
  const overall = { ...snap.overall, status: worst(shelves.status, supply.status, confidence.status, economy.status) };
  return { ...snap, shelves, supply, confidence, economy, overall };
}

export const STATUS_LABEL: Record<Status, { en: string; ar: string }> = {
  normal: { en: 'NORMAL', ar: 'طبيعي' },
  watch: { en: 'WATCH', ar: 'مراقبة' },
  alert: { en: 'ALERT', ar: 'تنبيه' },
  critical: { en: 'CRITICAL', ar: 'حرج' },
};

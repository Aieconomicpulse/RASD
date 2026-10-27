import type { Snapshot, Status } from './types';

/**
 * Thresholds that turn readings into a status. Deliberately simple and visible:
 * a minister should be able to ask "why is this amber?" and get a one-line answer.
 * Tune with the ministry once its own feeds are wired.
 */
export const RULES = {
  shelves: {
    foodCpiWowWatch: 0.5, foodCpiWowAlert: 1.5, foodCpiWowCritical: 3.0,   // % week on week
    stockoutsWatch: 3, stockoutsAlert: 10, stockoutsCritical: 25,          // product×city stock-outs
  },
  supply: {
    daysGulfWatch: 10, daysGulfAlert: 6, daysGulfCritical: 3,              // days of supply at Gulf ports
    portCallsWowAlert: -15, portCallsWowCritical: -30,                       // % week on week
  },
  confidence: {
    sentimentWatch: 0.0, sentimentAlert: -0.3, sentimentCritical: -0.6,     // pooled daily score, −1…+1
    tasiD1Alert: -3, tasiD1Critical: -6,                                     // % day on day
    fwdWatch: 150, fwdAlert: 400, fwdCritical: 800,                          // riyal 12-month forward points
  },
};

const ORDER: Status[] = ['normal', 'watch', 'alert', 'critical'];
export const worst = (...s: Status[]): Status => s.reduce((a, b) => (ORDER.indexOf(b) > ORDER.indexOf(a) ? b : a), 'normal');

export function shelvesStatus(s: Snapshot['shelves']): Status {
  const r = RULES.shelves; const wow = s.foodCpi.wow ?? 0; const so = s.stockouts.count;
  let st: Status = 'normal';
  if (wow >= r.foodCpiWowCritical || so >= r.stockoutsCritical) st = 'critical';
  else if (wow >= r.foodCpiWowAlert || so >= r.stockoutsAlert) st = 'alert';
  else if (wow >= r.foodCpiWowWatch || so >= r.stockoutsWatch) st = 'watch';
  return st;
}

export function supplyStatus(s: Snapshot['supply']): Status {
  const r = RULES.supply; let st: Status = 'normal';
  const d = s.inbound.daysOfSupplyGulfPorts; const pc = s.portCalls.wow;
  if (s.hormuz.state === 'closed' || d <= r.daysGulfCritical || pc <= r.portCallsWowCritical) st = 'critical';
  else if (d <= r.daysGulfAlert || pc <= r.portCallsWowAlert) st = 'alert';
  else if (s.hormuz.state === 'restricted' || d <= r.daysGulfWatch) st = 'watch';
  return st;
}

export function confidenceStatus(s: Snapshot['confidence']): Status {
  const r = RULES.confidence; let st: Status = 'normal';
  const sent = s.sentiment?.score ?? 0; const tasi = s.tasi.d1 ?? 0; const fwd = s.riyalFwd12m?.value ?? 0;
  if (sent <= r.sentimentCritical || tasi <= r.tasiD1Critical || fwd >= r.fwdCritical) st = 'critical';
  else if (sent <= r.sentimentAlert || tasi <= r.tasiD1Alert || fwd >= r.fwdAlert) st = 'alert';
  else if (sent <= r.sentimentWatch || fwd >= r.fwdWatch) st = 'watch';
  return st;
}

export function applyStatuses(snap: Snapshot): Snapshot {
  const shelves = { ...snap.shelves, status: shelvesStatus(snap.shelves) };
  const supply = { ...snap.supply, status: supplyStatus(snap.supply) };
  const confidence = { ...snap.confidence, status: confidenceStatus(snap.confidence) };
  const overall = { ...snap.overall, status: worst(shelves.status, supply.status, confidence.status) };
  return { ...snap, shelves, supply, confidence, overall };
}

export const STATUS_LABEL: Record<Status, { en: string; ar: string }> = {
  normal: { en: 'NORMAL', ar: 'طبيعي' },
  watch: { en: 'WATCH', ar: 'مراقبة' },
  alert: { en: 'ALERT', ar: 'تنبيه' },
  critical: { en: 'CRITICAL', ar: 'حرج' },
};

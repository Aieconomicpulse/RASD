/** Band from a pooled daily score, −1…+1 (the same bands the KSA platform uses). */
export function sentimentBand(score: number): string {
  if (score >= 0.6) return 'strongly positive';
  if (score >= 0.2) return 'positive';
  if (score > -0.2) return 'neutral';
  if (score > -0.6) return 'negative';
  return 'strongly negative';
}

export const BAND_AR: Record<string, string> = {
  'strongly positive': 'إيجابية بقوة', positive: 'إيجابية', neutral: 'محايدة', negative: 'سلبية', 'strongly negative': 'سلبية بقوة',
};

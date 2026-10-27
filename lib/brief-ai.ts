import type { BriefDoc } from './brief';
import type { Lang, Snapshot } from './types';

/**
 * Model-polished brief, grounded strictly in the snapshot. The model rewrites only the bottom line and the
 * four pillar paragraphs; judgments, decisions and thresholds stay deterministic. Every number must come from
 * the JSON; on any failure the template brief is used. Model ID comes from ANTHROPIC_MODEL — keep it current
 * (the KSA platform's hard-coded "claude-sonnet-4-20250514" is what broke its /api/oil-price).
 */
export async function aiBrief(snap: Snapshot, base: BriefDoc, lang: Lang): Promise<BriefDoc | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
  const { brief: _b, ...rest } = snap; void _b;
  // The model needs readings, not chart series.
  const data = {
    ...rest,
    shelves: { ...rest.shelves, series: undefined },
    supply: { ...rest.supply, portCalls: { ...rest.supply.portCalls, series: undefined } },
    confidence: { ...rest.confidence, brentTrend: undefined, tasiTrend: undefined, sentiment: { ...rest.confidence.sentiment, trend: undefined } },
    economy: { ...rest.economy, gdp: { ...rest.economy.gdp, series: undefined }, spending: { ...rest.economy.spending, trend: undefined }, employment: { ...rest.economy.employment, trend: undefined }, pmiTrend: undefined },
  };
  const system = lang === 'ar'
    ? 'أنت كبير الاقتصاديين في AI Economic Pulse وتكتب لنائب وزير. أعد صياغة "الخلاصة" في جملتين، ثم أربع فقرات قصيرة بالترتيب: الإمداد والمسارات، الأسعار والأرفف، الأسواق والثقة، النمو. لغة عربية فصحى واضحة ومباشرة. استخدم فقط الأرقام الواردة في JSON ولا تخترع أي رقم أو حدث. أعد كائن JSON بالشكل {"bottomLine": "...", "pillars": ["...","...","...","..."]}.'
    : 'You are the chief economist of AI Economic Pulse, writing for a deputy minister. Rewrite the bottom line in two sentences, then four short paragraphs in order: supply and routes, prices and shelves, markets and confidence, growth. Plain, direct English. Use only numbers present in the JSON; never invent a figure or an event. Return a JSON object {"bottomLine": "...", "pillars": ["...","...","...","..."]}.';
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, max_tokens: 1600, system, messages: [{ role: 'user', content: `Situation picture (JSON):\n${JSON.stringify(data)}\n\nDraft to improve:\n${JSON.stringify({ bottomLine: base.bottomLine, pillars: base.pillars.map((p) => p.text) })}` }] }),
    });
    if (!res.ok) return null;
    const out = await res.json();
    const text: string = out?.content?.map((c: { text?: string }) => c.text ?? '').join('') ?? '';
    const m = text.match(/\{[\s\S]*\}/);
    const obj = m ? (JSON.parse(m[0]) as { bottomLine?: unknown; pillars?: unknown }) : null;
    if (!obj || typeof obj.bottomLine !== 'string' || !Array.isArray(obj.pillars) || obj.pillars.length !== 4 || !obj.pillars.every((x) => typeof x === 'string')) return null;
    return { ...base, bottomLine: obj.bottomLine, pillars: base.pillars.map((p, i) => ({ ...p, text: obj.pillars && (obj.pillars as string[])[i] })), generated: true } as BriefDoc;
  } catch { return null; }
}

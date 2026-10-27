import type { Lang, Snapshot } from './types';

/**
 * Model-written brief, grounded strictly in the snapshot. Every number in the prose must come from the JSON
 * passed in; the system prompt says so and the fallback (templateBrief) is used on any failure.
 * Model ID comes from ANTHROPIC_MODEL — keep it current; the KSA platform's hard-coded
 * "claude-sonnet-4-20250514" is what broke its /api/oil-price.
 */
export async function aiBrief(snap: Snapshot, lang: Lang): Promise<string[] | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
  const { brief: _omit, ...rest } = snap; void _omit;
  // Trim the long series — the model needs readings, not sparklines.
  const data = {
    ...rest,
    shelves: { ...rest.shelves, foodTrend: undefined },
    supply: { ...rest.supply, portCalls: { ...rest.supply.portCalls, trend: undefined } },
    confidence: { ...rest.confidence, brentTrend: undefined, tasiTrend: undefined, sentiment: { ...rest.confidence.sentiment, trend: undefined } },
    economy: { ...rest.economy, gdp: { ...rest.economy.gdp, trend: undefined, nonOilTrend: undefined }, spending: { ...rest.economy.spending, trend: undefined } },
  };
  const system = lang === 'ar'
    ? 'أنت كبير الاقتصاديين في AI Economic Pulse. اكتب موجزاً صباحياً لوزير بلغة عربية واضحة ومباشرة، في ست فقرات قصيرة: التقييم العام، الأرفف والأسعار، الإمداد والمسارات، الثقة، الاقتصاد (الناتج المحلي والإنفاق والتوظيف)، ما يجب الانتباه إليه اليوم. استخدم فقط الأرقام الواردة في JSON؛ لا تخترع أي رقم أو حدث. لا عناوين، لا نقاط، فقرات فقط. أعد النتيجة كمصفوفة JSON من ست سلاسل نصية.'
    : 'You are the chief economist of AI Economic Pulse. Write a morning brief for a minister in plain, direct English, in six short paragraphs: overall, shelves and prices, supply and routes, confidence, the economy (GDP nowcast, spending, employment), what to watch today. Use only numbers present in the JSON; never invent a figure or an event. No headings, no bullets, paragraphs only. Return a JSON array of six strings.';
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, max_tokens: 1600, system, messages: [{ role: 'user', content: `Situation picture (JSON):\n${JSON.stringify(data)}` }] }),
    });
    if (!res.ok) return null;
    const out = await res.json();
    const text: string = out?.content?.map((c: { text?: string }) => c.text ?? '').join('') ?? '';
    const m = text.match(/\[[\s\S]*\]/);
    const arr = m ? (JSON.parse(m[0]) as unknown) : null;
    return Array.isArray(arr) && arr.every((x) => typeof x === 'string') ? (arr as string[]) : null;
  } catch { return null; }
}

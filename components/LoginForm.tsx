'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function LoginForm({ labels }: { labels: { password: string; signIn: string; wrong: string } }) {
  const [pw, setPw] = useState(''); const [err, setErr] = useState(false); const [busy, setBusy] = useState(false);
  const params = useSearchParams();
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(false);
    const r = await fetch('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: pw }) });
    setBusy(false);
    if (r.ok) { window.location.assign(params.get('next') || '/'); } else setErr(true);
  }
  return (
    <form onSubmit={submit} className="mt-8 space-y-3">
      <label className="block text-base font-medium text-ink" htmlFor="pw">{labels.password}</label>
      <input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus autoComplete="current-password"
        aria-invalid={err} aria-describedby={err ? 'pw-err' : undefined}
        className="w-full rounded-xl border border-rule bg-surface px-4 py-3 text-lg text-ink outline-none focus:border-accent" />
      {err && <p id="pw-err" className="text-base delta-bad">{labels.wrong}</p>}
      <button type="submit" disabled={busy || !pw} className="w-full rounded-xl bg-ink py-3 text-lg font-semibold text-page disabled:opacity-50">{labels.signIn}</button>
    </form>
  );
}

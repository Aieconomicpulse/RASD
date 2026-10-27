'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function LoginForm({ labels }: { labels: { password: string; signIn: string } }) {
  const [pw, setPw] = useState(''); const [err, setErr] = useState(false); const [busy, setBusy] = useState(false);
  const params = useSearchParams();
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(false);
    const r = await fetch('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: pw }) });
    setBusy(false);
    if (r.ok) { window.location.assign(params.get('next') || '/'); } else setErr(true);
  }
  return (
    <form onSubmit={submit} className="card mt-6 space-y-3 p-5">
      <label className="label block" htmlFor="pw">{labels.password}</label>
      <input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus
        className="w-full rounded-md border border-line bg-ink-950 px-3 py-2 font-mono text-white outline-none focus:border-pulse-blue" />
      {err && <div className="text-xs text-pulse-red">✕</div>}
      <button type="submit" disabled={busy || !pw} className="w-full rounded-md bg-white py-2 text-sm font-semibold text-ink-950 disabled:opacity-50">{labels.signIn}</button>
    </form>
  );
}

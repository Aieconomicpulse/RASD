'use client';
import { useRouter } from 'next/navigation';

export default function SignOut({ label }: { label: string }) {
  const router = useRouter();
  return (
    <button type="button" data-sign-out onClick={async () => { await fetch('/api/logout', { method: 'POST' }); router.push('/login'); router.refresh(); }}
      className="rounded-full px-3 py-1.5 text-base text-ink-2 hover:bg-sunken hover:text-ink">{label}</button>
  );
}

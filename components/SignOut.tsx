'use client';
import { useRouter } from 'next/navigation';

export default function SignOut({ label }: { label: string }) {
  const router = useRouter();
  return (
    <button type="button" onClick={async () => { await fetch('/api/logout', { method: 'POST' }); router.push('/login'); router.refresh(); }}
      className="text-xs text-mist-500 hover:text-white">{label}</button>
  );
}

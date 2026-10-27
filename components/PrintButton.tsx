'use client';
export default function PrintButton({ label }: { label: string }) {
  return <button type="button" onClick={() => window.print()} className="no-print rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-mist-300 hover:border-mist-500 hover:text-white">{label}</button>;
}

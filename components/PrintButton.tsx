'use client';
export default function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" data-print onClick={() => window.print()}
      className="no-print rounded-full border border-rule px-4 py-2 text-base font-medium text-ink hover:border-ink-3">{label}</button>
  );
}

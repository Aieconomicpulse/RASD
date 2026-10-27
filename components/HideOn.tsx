'use client';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

/** Hides its children on the given routes (navigation and sign-out have no place on the sign-in page). */
export default function HideOn({ paths, children, fallback = null }: { paths: string[]; children: ReactNode; fallback?: ReactNode }) {
  const p = usePathname();
  return paths.includes(p) ? <>{fallback}</> : <>{children}</>;
}

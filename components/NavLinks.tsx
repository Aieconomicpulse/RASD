'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavLinks({ items }: { items: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <nav className="flex items-center gap-1" aria-label="Main">
      {items.map((it) => {
        const active = it.href === '/' ? path === '/' : path.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} aria-current={active ? 'page' : undefined}
            className={`rounded-full px-3 py-1.5 text-base ${active ? 'bg-sunken font-semibold text-ink' : 'text-ink-2 hover:text-ink'}`}>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}

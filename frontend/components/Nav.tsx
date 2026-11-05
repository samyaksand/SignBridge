'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

const LINKS = [
  { href: '/parent', label: 'Parent Mode' },
  { href: '/child', label: 'Child Mode' },
  { href: '/family-practice', label: 'Family Practice' },
  { href: '/cards', label: 'Quick Cards' },
  { href: '/explore', label: 'Explore Signs' },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-md">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6"
      >
        <Link href="/" className="flex items-center" aria-label="SignBridge home">
          <Logo size={30} />
        </Link>
        <ul className="flex flex-wrap items-center gap-1 text-sm">
          {LINKS.map((link) => {
            const active = pathname?.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex min-h-[44px] items-center rounded-[var(--radius-md)] px-3 font-medium transition-colors ${
                    active
                      ? 'bg-[var(--color-indigo-600)] text-white'
                      : 'text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <ThemeToggle />
      </nav>
    </header>
  );
}

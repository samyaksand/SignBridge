'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { applyTheme, getStoredTheme, storeTheme, Theme } from '@/lib/utils/theme';

function getInitialTheme(): Theme {
  const stored = getStoredTheme();
  const prefersDark =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return stored ?? (prefersDark ? 'dark' : 'light');
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    applyTheme(theme);
    // Marks that client-side hydration has completed so the accessible label
    // (which depends on browser-only APIs) can be rendered safely.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    // Only apply on mount; subsequent theme changes are applied in toggle().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    applyTheme(next);
    storeTheme(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label={mounted ? `Switch to ${theme === 'light' ? 'dark' : 'light'} mode` : 'Toggle theme'}
      aria-pressed={theme === 'dark'}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-muted)]"
    >
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}

import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '@/components/ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('toggles the data-theme attribute on click', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    const before = document.documentElement.getAttribute('data-theme');
    await user.click(button);
    const after = document.documentElement.getAttribute('data-theme');
    expect(after).not.toBe(before);
  });

  it('persists theme choice to localStorage', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    await user.click(screen.getByRole('button'));
    const stored = window.localStorage.getItem('signbridge-theme');
    expect(stored === 'light' || stored === 'dark').toBe(true);
  });
});

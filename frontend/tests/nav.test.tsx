import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  usePathname: () => '/parent',
}));

import { Nav } from '@/components/Nav';

describe('Nav', () => {
  it('renders links to all four experiences', () => {
    render(<Nav />);
    expect(screen.getByRole('link', { name: 'Parent Mode' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Child Mode' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Family Practice' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Quick Cards' })).toBeInTheDocument();
  });

  it('marks the active link with aria-current', () => {
    render(<Nav />);
    const activeLink = screen.getByRole('link', { name: 'Parent Mode' });
    expect(activeLink).toHaveAttribute('aria-current', 'page');
  });
});

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  usePathname: () => '/cards',
}));

import { Nav } from '@/components/Nav';

describe('Nav', () => {
  it('renders links to all primary experiences, with Explore Signs first', () => {
    render(<Nav />);
    const links = screen.getAllByRole('link').map((el) => el.textContent);
    expect(links).toContain('Explore Signs');
    expect(links).toContain('Quick Cards');
    expect(links).toContain('Talk to Sign');
    expect(links.indexOf('Explore Signs')).toBeLessThan(links.indexOf('Quick Cards'));
  });

  it('marks the active link with aria-current', () => {
    render(<Nav />);
    const activeLink = screen.getByRole('link', { name: 'Quick Cards' });
    expect(activeLink).toHaveAttribute('aria-current', 'page');
  });

  it('does not link to Family Practice (removed)', () => {
    render(<Nav />);
    expect(screen.queryByRole('link', { name: 'Family Practice' })).not.toBeInTheDocument();
  });

  it('does not render the removed experimental labs dropdown', () => {
    render(<Nav />);
    expect(screen.queryByRole('button', { name: /Experimental labs/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('does not link to Word Signs from the main nav', () => {
    render(<Nav />);
    expect(screen.queryByRole('link', { name: 'Word Signs' })).not.toBeInTheDocument();
  });
});

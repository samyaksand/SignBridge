import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';
import { PreferencesProvider } from '@/lib/context/PreferencesContext';

function renderHome() {
  return render(
    <PreferencesProvider>
      <Home />
    </PreferencesProvider>
  );
}

describe('Home page', () => {
  it('shows the mode entry cards with real links', () => {
    renderHome();
    for (const name of ['Browse cards']) {
      expect(screen.getByRole('link', { name })).toBeInTheDocument();
    }
  });

  it('does not show the removed Family Practice entry card', () => {
    renderHome();
    expect(screen.queryByRole('link', { name: 'Start practicing' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Family Practice' })).not.toBeInTheDocument();
  });

  it('shows the Letter Lens entry card linking to the fingerspelling feature', () => {
    renderHome();
    expect(screen.getByRole('heading', { name: 'Letter Lens' })).toBeInTheDocument();
    const links = screen.getAllByRole('link', { name: 'Try it' });
    expect(links.some((link) => link.getAttribute('href') === '/asl-fingerspelling-demo')).toBe(
      true
    );
  });

  it('puts an Explore Signs preview above the fold, with a link to the full page', () => {
    renderHome();
    expect(screen.getByRole('heading', { name: 'Explore Signs' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /See all .* signs/i })).toHaveAttribute(
      'href',
      '/explore'
    );
  });

  it('shows the Free and No login claims near the top', () => {
    renderHome();
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('No login')).toBeInTheDocument();
  });

  it('does not contain the removed redundant "Built for families" card', () => {
    renderHome();
    expect(screen.queryByText('Built for families learning together')).not.toBeInTheDocument();
  });
});

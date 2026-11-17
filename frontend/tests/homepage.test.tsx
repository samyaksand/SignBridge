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

  it('states the no-account, privacy-first claim', () => {
    renderHome();
    expect(screen.getByText(/no account, no ads, no tracking/i)).toBeInTheDocument();
  });

  it('leads with the child-friendly hero heading and both primary CTAs', () => {
    renderHome();
    expect(screen.getByRole('heading', { name: "Let's learn to sign!" })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start Learning' })).toHaveAttribute('href', '/explore');
    expect(screen.getByRole('link', { name: 'Explore Quick Cards' })).toHaveAttribute(
      'href',
      '/cards'
    );
  });

  it('does not contain the removed redundant "Built for families" card', () => {
    renderHome();
    expect(screen.queryByText('Built for families learning together')).not.toBeInTheDocument();
  });
});

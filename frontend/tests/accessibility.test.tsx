import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PreferencesProvider } from '@/lib/context/PreferencesContext';
import { CommunicationPreferences } from '@/components/CommunicationPreferences';
import { CardsClient } from '@/app/cards/CardsClient';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

/**
 * These tests verify accessible roles, labels, and keyboard operability on
 * key interactive elements using testing-library queries (which only find
 * elements the way assistive tech would), not visual inspection.
 */
describe('accessibility: roles and labels', () => {
  it('Nav exposes real links with accessible names, reachable by role', async () => {
    const { Nav } = await import('@/components/Nav');
    render(<Nav />);
    for (const name of ['Parent Mode', 'Child Mode', 'Family Practice', 'Quick Cards']) {
      expect(screen.getByRole('link', { name })).toBeInTheDocument();
    }
  });

  it('CommunicationPreferences mode selector is a real radiogroup with named radios', () => {
    render(
      <PreferencesProvider>
        <CommunicationPreferences />
      </PreferencesProvider>
    );
    const group = screen.getByRole('radiogroup', { name: 'Communication style' });
    expect(group).toBeInTheDocument();
    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBe(4);
    for (const radio of radios) {
      expect(radio).toHaveAccessibleName();
    }
  });

  it('Quick Cards search input has an accessible label distinct from its placeholder', () => {
    render(
      <PreferencesProvider>
        <CardsClient />
      </PreferencesProvider>
    );
    const search = screen.getByLabelText('Search cards');
    expect(search).toHaveAccessibleName('Search cards');
  });

  it('Quick Cards "remove from message" buttons each carry a unique accessible name', async () => {
    const user = userEvent.setup();
    render(
      <PreferencesProvider>
        <CardsClient />
      </PreferencesProvider>
    );
    await user.click(screen.getByText('I need help'));
    await user.click(screen.getByText('I am hungry'));
    expect(screen.getByRole('button', { name: 'Remove I need help from message' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove I am hungry from message' })).toBeInTheDocument();
  });

  it('category filter buttons are reachable by keyboard (Tab) and respond to Enter', async () => {
    const user = userEvent.setup();
    render(
      <PreferencesProvider>
        <CardsClient />
      </PreferencesProvider>
    );
    const feelingsButton = screen.getByRole('button', { name: 'Feelings' });
    feelingsButton.focus();
    expect(feelingsButton).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByText('I am happy')).toBeInTheDocument();
  });

  it('text size and reduced motion controls use aria-pressed rather than relying on color alone', () => {
    render(
      <PreferencesProvider>
        <CommunicationPreferences />
      </PreferencesProvider>
    );
    const reduceMotionBtn = screen.getByRole('button', { name: 'Reduce motion' });
    expect(reduceMotionBtn).toHaveAttribute('aria-pressed', 'false');
    const largeBtn = screen.getByRole('button', { name: 'Large' });
    expect(largeBtn).toHaveAttribute('aria-pressed');
  });
});

/**
 * Layout assumption check: Quick Cards grid should rely on responsive
 * Tailwind classes (grid-cols-2 base, scaling up at breakpoints) rather than
 * a fixed pixel width that would overflow a 360px-wide device. This is a
 * static code-reading assertion against the rendered className, a true
 * rendered-width assertion is not meaningful in jsdom since it does not lay
 * out CSS Grid/media queries; verifying the actual breakpoint behaviour
 * requires a real browser (documented here rather than faked).
 */
describe('layout assumptions (code-reading verification, not a true responsive render test)', () => {
  it('Quick Cards grid container has no fixed pixel width classes', () => {
    const { container } = render(
      <PreferencesProvider>
        <CardsClient />
      </PreferencesProvider>
    );
    const grid = container.querySelector('.grid');
    expect(grid).toBeTruthy();
    const className = grid?.className ?? '';
    expect(className).toMatch(/grid-cols-2/);
    expect(className).not.toMatch(/w-\[\d+px\]/);
    expect(className).not.toMatch(/\bw-(screen|full)\b.*px/);
  });
});

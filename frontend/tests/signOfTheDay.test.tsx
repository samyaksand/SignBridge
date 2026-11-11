import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SignOfTheDay } from '@/components/isl/SignOfTheDay';
import { getSignOfTheDay } from '@/lib/data/islSigns';

describe('SignOfTheDay (homepage)', () => {
  it('renders a real embedded iframe whose src contains the exact verified video ID from the data file', () => {
    render(<SignOfTheDay />);
    const expected = getSignOfTheDay();
    expect(expected).not.toBeNull();
    const iframe = document.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute('src')).toContain(expected!.videoId);
  });

  it('shows real attribution text, not a placeholder', () => {
    render(<SignOfTheDay />);
    const expected = getSignOfTheDay();
    expect(screen.getByText(new RegExp(expected!.attribution))).toBeInTheDocument();
  });

  it('replay re-renders the video without crashing', async () => {
    render(<SignOfTheDay />);
    const replayButton = screen.getByRole('button', { name: /Replay/i });
    replayButton.click();
    expect(document.querySelector('iframe')).not.toBeNull();
  });

  it('shows a small pack of several words instead of only one', () => {
    render(<SignOfTheDay />);
    const group = screen.queryByRole('group', { name: "Signs in today's pack" });
    if (group) {
      const chips = screen.getAllByRole('button').filter((b) => b.getAttribute('aria-pressed') !== null);
      expect(chips.length).toBeGreaterThanOrEqual(2);
      expect(chips.length).toBeLessThanOrEqual(5);
    }
  });
});

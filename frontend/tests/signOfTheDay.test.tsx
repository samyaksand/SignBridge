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
});

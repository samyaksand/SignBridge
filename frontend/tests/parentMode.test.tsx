import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ParentModeClient } from '@/app/parent/ParentModeClient';

describe('ParentModeClient', () => {
  it('shows a fallback message for text with no curated demo', async () => {
    const user = userEvent.setup();
    render(<ParentModeClient />);
    const input = screen.getByLabelText('Message to show in ISL');
    await user.type(input, 'some random sentence nobody has recorded');
    await user.click(screen.getByRole('button', { name: /Show in ISL/i }));
    expect(screen.getByText(/Sign demonstration not yet available/i)).toBeInTheDocument();
  });

  it('shows a demo reference when text matches a curated phrase via Quick Messages', async () => {
    const user = userEvent.setup();
    render(<ParentModeClient />);
    await user.click(screen.getByRole('button', { name: 'I need help' }));
    expect(screen.getByText(/placeholder reference demonstration/i)).toBeInTheDocument();
  });

  it('clear resets the message and playback state', async () => {
    const user = userEvent.setup();
    render(<ParentModeClient />);
    await user.click(screen.getByRole('button', { name: 'I need help' }));
    await user.click(screen.getByRole('button', { name: /Clear/i }));
    expect(screen.queryByText(/placeholder reference demonstration/i)).not.toBeInTheDocument();
  });

  it('rapidly clicking Play/Pause repeatedly never crashes and ends in a consistent pressed state', async () => {
    const user = userEvent.setup();
    render(<ParentModeClient />);
    await user.click(screen.getByRole('button', { name: 'I need help' }));

    const playButton = screen.getByRole('button', { name: /Play|Pause/i });
    await user.click(playButton);
    await user.click(playButton);
    await user.click(playButton);
    // After 3 toggles from the (false) resting isPlaying state, it should be
    // true (false -> true -> false -> true), and importantly nothing threw.
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  });

  it('switching Quick Messages rapidly always ends on the last clicked phrase, no stale state', async () => {
    const user = userEvent.setup();
    render(<ParentModeClient />);
    await user.click(screen.getByRole('button', { name: 'I need help' }));
    await user.click(screen.getByRole('button', { name: 'Thank you' }));
    await user.click(screen.getByRole('button', { name: 'I love you' }));
    const submittedText = document.querySelector('p[aria-live="polite"]');
    expect(submittedText).toHaveTextContent('I love you');
  });

  it('the fullscreen button is enabled when supported and toggles aria-pressed without crashing', async () => {
    const user = userEvent.setup();
    const requestFullscreen = vi.fn().mockImplementation(function (this: HTMLElement) {
      Object.defineProperty(document, 'fullscreenElement', { value: this, configurable: true });
      document.dispatchEvent(new Event('fullscreenchange'));
      return Promise.resolve();
    });
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
      value: requestFullscreen,
      configurable: true,
    });
    Object.defineProperty(document, 'exitFullscreen', {
      value: vi.fn().mockImplementation(() => {
        Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true });
        document.dispatchEvent(new Event('fullscreenchange'));
        return Promise.resolve();
      }),
      configurable: true,
    });

    render(<ParentModeClient />);
    await user.click(screen.getByRole('button', { name: 'I need help' }));

    const fullscreenButton = screen.getByRole('button', { name: /View avatar fullscreen/i });
    expect(fullscreenButton).not.toBeDisabled();
    await user.click(fullscreenButton);
    expect(screen.getByRole('button', { name: /Exit fullscreen/i })).toHaveAttribute('aria-pressed', 'true');
  });
});

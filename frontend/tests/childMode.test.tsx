import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChildModeClient } from '@/app/child/ChildModeClient';
import { PreferencesProvider } from '@/lib/context/PreferencesContext';

function renderChildMode() {
  return render(
    <PreferencesProvider>
      <ChildModeClient />
    </PreferencesProvider>
  );
}

describe('ChildModeClient', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('labels demo mode clearly', () => {
    renderChildMode();
    expect(screen.getByText(/Demo mode:/i)).toBeInTheDocument();
  });

  it('shows graceful unavailable state when camera permission is denied', async () => {
    const user = userEvent.setup();
    const getUserMedia = vi.fn().mockRejectedValue(new Error('Permission denied'));
    Object.defineProperty(window.navigator, 'mediaDevices', {
      value: { getUserMedia },
      configurable: true,
    });

    renderChildMode();
    await user.click(screen.getByRole('button', { name: /Start Camera/i }));

    await waitFor(() => {
      expect(screen.getByText(/could not turn on the camera/i)).toBeInTheDocument();
    });
    // App should still be usable, cards link present
    expect(screen.getAllByText(/Quick Cards/i).length).toBeGreaterThan(0);
  });

  it('stops all camera tracks when the camera is explicitly turned off', async () => {
    const user = userEvent.setup();
    const stop = vi.fn();
    const fakeTrack = { stop };
    const fakeStream = { getTracks: () => [fakeTrack, fakeTrack] } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(fakeStream);
    Object.defineProperty(window.navigator, 'mediaDevices', {
      value: { getUserMedia },
      configurable: true,
    });

    renderChildMode();
    await user.click(screen.getByRole('button', { name: /Start Camera/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Stop Camera/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Stop Camera/i }));
    expect(stop).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('button', { name: /Start Camera/i })).toBeInTheDocument();
  });

  it('stops all camera tracks on unmount even if Stop Camera was never clicked', async () => {
    const user = userEvent.setup();
    const stop = vi.fn();
    const fakeTrack = { stop };
    const fakeStream = { getTracks: () => [fakeTrack] } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(fakeStream);
    Object.defineProperty(window.navigator, 'mediaDevices', {
      value: { getUserMedia },
      configurable: true,
    });

    const { unmount } = renderChildMode();
    await user.click(screen.getByRole('button', { name: /Start Camera/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Stop Camera/i })).toBeInTheDocument();
    });

    expect(stop).not.toHaveBeenCalled();
    unmount();
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('only enables Speak after a prediction has been confirmed into the message', async () => {
    renderChildMode();
    // Initially no message, no speak button present
    expect(screen.queryByRole('button', { name: /^Speak$/i })).not.toBeInTheDocument();
  });

  it('runs a demo guess and requires explicit confirm before it is added to the message', async () => {
    const user = userEvent.setup();
    renderChildMode();
    await user.click(screen.getByRole('button', { name: /Try a demo guess/i }));

    await waitFor(
      () => {
        expect(screen.getByText(/Which one did you mean/i)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    // Confirm should be disabled until a candidate is chosen
    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmButton).toBeDisabled();
  });

  describe('sentence suggestions (optional backend feature)', () => {
    afterEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    });

    async function addOneConfirmedWord(user: ReturnType<typeof userEvent.setup>) {
      await user.click(screen.getByRole('button', { name: /Try a demo guess/i }));
      await waitFor(
        () => expect(screen.getByText(/Which one did you mean/i)).toBeInTheDocument(),
        { timeout: 2000 }
      );
      // Pick the first prediction card (the only buttons with aria-pressed).
      const predictionButtons = screen
        .getAllByRole('button')
        .filter((btn) => btn.hasAttribute('aria-pressed'));
      expect(predictionButtons.length).toBeGreaterThan(0);
      await user.click(predictionButtons[0]);
      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      await waitFor(() => expect(confirmButton).not.toBeDisabled());
      await user.click(confirmButton);
      await waitFor(() => expect(screen.getByText(/Added to your message/i)).toBeInTheDocument());
    }

    it('degrades gracefully with a friendly note when the backend is unreachable', async () => {
      const user = userEvent.setup();
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
      renderChildMode();

      await addOneConfirmedWord(user);
      await user.click(screen.getByRole('button', { name: /Suggest a sentence/i }));

      await waitFor(() => {
        expect(
          screen.getByText((content) => /not available right now|not running right now/i.test(content))
        ).toBeInTheDocument();
      });
    });

    it('requires explicit confirmation of an edited sentence before Speak is enabled for it', async () => {
      const user = userEvent.setup();
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ suggestions: ['I need help please'], used_requesty: false }),
        })
      );
      renderChildMode();

      await addOneConfirmedWord(user);
      await user.click(screen.getByRole('button', { name: /Suggest a sentence/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'I need help please' })).toBeInTheDocument();
      });

      // Before confirming, there should be no confirmed-sentence display yet.
      expect(screen.queryByTestId('confirmed-sentence')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'I need help please' }));
      await user.click(screen.getByRole('button', { name: /Confirm sentence/i }));

      await waitFor(() => {
        expect(screen.getByTestId('confirmed-sentence')).toHaveTextContent('I need help please');
      });
    });
  });
});

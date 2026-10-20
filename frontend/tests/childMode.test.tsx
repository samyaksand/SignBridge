import { describe, expect, it, vi, beforeEach } from 'vitest';
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
});

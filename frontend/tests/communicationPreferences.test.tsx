import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PreferencesProvider, usePreferences } from '@/lib/context/PreferencesContext';
import { CommunicationPreferences } from '@/components/CommunicationPreferences';

function renderWithProvider(ui: React.ReactElement) {
  return render(<PreferencesProvider>{ui}</PreferencesProvider>);
}

function SpeechConsumer() {
  const { speechEnabled } = usePreferences();
  return <div data-testid="speech-state">{String(speechEnabled)}</div>;
}

describe('CommunicationPreferences', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-text-size');
    document.documentElement.removeAttribute('data-reduced-motion');
  });

  it('selecting a communication mode marks it as the active choice', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CommunicationPreferences />);
    const pictureOption = screen.getByRole('radio', { name: /Picture cards/i });
    expect(pictureOption).toHaveAttribute('aria-checked', 'false');
    await user.click(pictureOption);
    expect(pictureOption).toHaveAttribute('aria-checked', 'true');
  });

  it('text size buttons update the data-text-size attribute on the document', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CommunicationPreferences />);
    await user.click(screen.getByRole('button', { name: 'Large' }));
    expect(document.documentElement.getAttribute('data-text-size')).toBe('large');
  });

  it('text size choice is stored under a generic, non-profile localStorage key', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CommunicationPreferences />);
    await user.click(screen.getByRole('button', { name: 'Small' }));
    expect(window.localStorage.getItem('signbridge-text-size')).toBe('small');
  });

  it('reduced motion toggle sets data-reduced-motion on the document element', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CommunicationPreferences />);
    expect(document.documentElement.getAttribute('data-reduced-motion')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Reduce motion' }));
    expect(document.documentElement.getAttribute('data-reduced-motion')).toBe('true');
    await user.click(screen.getByRole('button', { name: 'Motion reduced' }));
    expect(document.documentElement.getAttribute('data-reduced-motion')).toBeNull();
  });

  it('speech toggle flips the shared speech preference used elsewhere in the app', async () => {
    const user = userEvent.setup();
    renderWithProvider(
      <>
        <CommunicationPreferences />
        <SpeechConsumer />
      </>
    );
    expect(screen.getByTestId('speech-state').textContent).toBe('true');
    await user.click(screen.getByRole('button', { name: /Speech turned on/i }));
    expect(screen.getByTestId('speech-state').textContent).toBe('false');
  });

  it('does not persist communication mode, reduced motion, or speech preferences to localStorage', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CommunicationPreferences />);
    await user.click(screen.getByRole('radio', { name: /ISL references/i }));
    await user.click(screen.getByRole('button', { name: 'Reduce motion' }));
    await user.click(screen.getByRole('button', { name: /Speech turned on/i }));

    const keys = Object.keys(window.localStorage);
    expect(keys).not.toContain('signbridge-communication-mode');
    expect(keys).not.toContain('signbridge-reduced-motion');
    expect(keys).not.toContain('signbridge-speech');
    // Only the generic text-size key is allowed, same pattern as theme.
    expect(keys.every((k) => k === 'signbridge-text-size')).toBe(true);
  });

  describe('when speechSynthesis is unsupported', () => {
    const original = (window as unknown as { speechSynthesis?: unknown }).speechSynthesis;

    beforeEach(() => {
      // @ts-expect-error simulating an unsupported browser
      delete window.speechSynthesis;
    });

    afterEach(() => {
      if (original !== undefined) {
        Object.defineProperty(window, 'speechSynthesis', {
          value: original,
          configurable: true,
        });
      }
    });

    it('shows an honest fallback message instead of a non-functional toggle', () => {
      renderWithProvider(<CommunicationPreferences />);
      expect(
        screen.getByText(/does not support spoken readouts/i)
      ).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Speech turned/i })).not.toBeInTheDocument();
    });
  });
});

describe('Speak button gating via preferences', () => {
  it('disables Speak in Quick Cards when speech is turned off', async () => {
    const user = userEvent.setup();
    const { CardsClient } = await import('@/app/cards/CardsClient');
    renderWithProvider(
      <>
        <CommunicationPreferences />
        <CardsClient />
      </>
    );
    await user.click(screen.getByText('Yes'));
    await user.click(screen.getByRole('button', { name: /Speech turned on/i }));
    const speakButton = screen.getByRole('button', { name: /^Speak$/i });
    expect(speakButton).toBeDisabled();
  });
});

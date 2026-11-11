import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DictionaryWordDialog } from '@/components/isl/DictionaryWordDialog';
import { PreferencesProvider } from '@/lib/context/PreferencesContext';
import { ISL_DICTIONARY } from '@/lib/data/islDictionary';

function renderDialog(onClose = () => {}) {
  const entry = ISL_DICTIONARY[0];
  render(
    <PreferencesProvider>
      <DictionaryWordDialog entry={entry} onClose={onClose} />
    </PreferencesProvider>
  );
  return entry;
}

describe('DictionaryWordDialog consent-basis attribution', () => {
  it('states the real consent basis honestly, without claiming community consent', () => {
    renderDialog();
    expect(
      screen.getByText(/not from a community consent process/i)
    ).toBeInTheDocument();
  });
});

describe('DictionaryWordDialog WhatsApp share', () => {
  it('keeps the phone number prompt hidden until Share on WhatsApp is clicked', () => {
    renderDialog();
    expect(screen.queryByLabelText(/Phone number/i)).not.toBeInTheDocument();
  });

  it('shows a phone number field and a wa.me link with no number by default', async () => {
    const user = userEvent.setup();
    const entry = renderDialog();
    await user.click(screen.getByRole('button', { name: /Share on WhatsApp/i }));
    expect(screen.getByLabelText(/Phone number/i)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Open WhatsApp/i });
    expect(link).toHaveAttribute('target', '_blank');
    const href = link.getAttribute('href') ?? '';
    expect(href.startsWith('https://wa.me/?text=')).toBe(true);
    const decoded = decodeURIComponent(href.replace('https://wa.me/?text=', ''));
    expect(decoded).toContain(entry.word);
    expect(decoded).toContain(entry.videoUrl);
  });

  it('includes the typed phone number, digits only, in the wa.me link', async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole('button', { name: /Share on WhatsApp/i }));
    await user.type(screen.getByLabelText(/Phone number/i), '+91 98765 43210');
    const link = screen.getByRole('link', { name: /Open WhatsApp/i });
    const href = link.getAttribute('href') ?? '';
    expect(href.startsWith('https://wa.me/919876543210?text=')).toBe(true);
  });

  it('discloses honestly that WhatsApp links cannot attach the picture directly', async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole('button', { name: /Share on WhatsApp/i }));
    expect(screen.getByText(/cannot attach an image/i)).toBeInTheDocument();
  });
});

describe('DictionaryWordDialog mirror mode', () => {
  it('is collapsed and off by default, with no camera preview shown', () => {
    renderDialog();
    expect(screen.queryByLabelText('Your camera preview')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Show my camera/i })).toBeInTheDocument();
  });

  it('shows a clear "Camera is off" state until the user explicitly starts it, and never calls getUserMedia before that', async () => {
    const user = userEvent.setup();
    const getUserMedia = vi.fn();
    Object.defineProperty(window.navigator, 'mediaDevices', {
      value: { getUserMedia },
      configurable: true,
    });

    renderDialog();
    await user.click(screen.getByRole('button', { name: /Show my camera/i }));

    expect(screen.getByText('Camera is off')).toBeInTheDocument();
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it('handles permission denial gracefully with a calm message, not a crash', async () => {
    const user = userEvent.setup();
    const getUserMedia = vi.fn().mockRejectedValue(new Error('Permission denied'));
    Object.defineProperty(window.navigator, 'mediaDevices', {
      value: { getUserMedia },
      configurable: true,
    });

    renderDialog();
    await user.click(screen.getByRole('button', { name: /Show my camera/i }));
    await user.click(screen.getByRole('button', { name: /Turn on camera/i }));

    await waitFor(() => {
      expect(screen.getByText(/We could not turn on your camera/i)).toBeInTheDocument();
    });
  });

  it('never sends camera data anywhere: no fetch call happens when the camera is turned on', async () => {
    const user = userEvent.setup();
    const fakeTrack = { stop: vi.fn() };
    const fakeStream = { getTracks: () => [fakeTrack] } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(fakeStream);
    Object.defineProperty(window.navigator, 'mediaDevices', {
      value: { getUserMedia },
      configurable: true,
    });
    const fetchSpy = vi.spyOn(global, 'fetch');

    renderDialog();
    await user.click(screen.getByRole('button', { name: /Show my camera/i }));
    await user.click(screen.getByRole('button', { name: /Turn on camera/i }));

    await waitFor(() => {
      expect(screen.getByLabelText('Your camera preview')).toBeInTheDocument();
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('stops all camera tracks when turned off again', async () => {
    const user = userEvent.setup();
    const stop = vi.fn();
    const fakeTrack = { stop };
    const fakeStream = { getTracks: () => [fakeTrack, fakeTrack] } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(fakeStream);
    Object.defineProperty(window.navigator, 'mediaDevices', {
      value: { getUserMedia },
      configurable: true,
    });

    renderDialog();
    await user.click(screen.getByRole('button', { name: /Show my camera/i }));
    await user.click(screen.getByRole('button', { name: /Turn on camera/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Turn off camera/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /Turn off camera/i }));

    expect(stop).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Camera is off')).toBeInTheDocument();
  });

  it('stops camera tracks on unmount', async () => {
    const user = userEvent.setup();
    const stop = vi.fn();
    const fakeTrack = { stop };
    const fakeStream = { getTracks: () => [fakeTrack] } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(fakeStream);
    Object.defineProperty(window.navigator, 'mediaDevices', {
      value: { getUserMedia },
      configurable: true,
    });

    const entry = ISL_DICTIONARY[0];
    const { unmount } = render(
      <PreferencesProvider>
        <DictionaryWordDialog entry={entry} onClose={() => {}} />
      </PreferencesProvider>
    );
    await user.click(screen.getByRole('button', { name: /Show my camera/i }));
    await user.click(screen.getByRole('button', { name: /Turn on camera/i }));

    await waitFor(() => {
      expect(screen.getByLabelText('Your camera preview')).toBeInTheDocument();
    });

    unmount();
    expect(stop).toHaveBeenCalled();
  });
});

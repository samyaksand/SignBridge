import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { SoundSignsClient } from '@/app/soundsigns/SoundSignsClient';

type WindowWithSpeech = typeof window & {
  SpeechRecognition?: unknown;
  webkitSpeechRecognition?: unknown;
};

const windowWithSpeech = window as WindowWithSpeech;

class FakeSpeechRecognition {
  lang = '';
  interimResults = false;
  continuous = false;
  maxAlternatives = 1;
  onstart: (() => void) | null = null;
  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onend: (() => void) | null = null;

  start() {
    this.onstart?.();
  }

  stop() {
    this.onend?.();
  }
}

describe('SoundSignsClient', () => {
  beforeEach(() => {
    windowWithSpeech.SpeechRecognition = FakeSpeechRecognition;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete windowWithSpeech.SpeechRecognition;
    delete windowWithSpeech.webkitSpeechRecognition;
  });

  it('does not show any permission or licensing disclosure text on the page', () => {
    render(<SoundSignsClient />);
    expect(screen.queryByText(/Used with explicit permission/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/not open source/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Ahmad Ataba/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Honesty note/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Requesty API key/i)).not.toBeInTheDocument();
  });

  it('starts with the microphone off and never auto-starts it', () => {
    render(<SoundSignsClient />);
    expect(screen.getByText(/Microphone is off/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start Microphone/i })).toBeInTheDocument();
  });

  it('starts and stops the microphone lifecycle on explicit button presses', () => {
    render(<SoundSignsClient />);
    fireEvent.click(screen.getByRole('button', { name: /Start Microphone/i }));
    expect(screen.getByText(/Listening/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Stop Microphone/i }));
    expect(screen.getByText(/Microphone is off/i)).toBeInTheDocument();
  });

  it('shows a text input fallback when the browser has no Web Speech API support', () => {
    delete windowWithSpeech.SpeechRecognition;
    delete windowWithSpeech.webkitSpeechRecognition;
    render(<SoundSignsClient />);
    expect(screen.getByText(/does not support live speech recognition/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Type a sentence/i)).toBeInTheDocument();
  });

  it('never sends text to the backend until the user explicitly confirms', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<SoundSignsClient />);
    fireEvent.click(screen.getByRole('button', { name: /Start Microphone/i }));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends the confirmed text to the existing soundsigns-service /translate endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ isl: '"HELLO"' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    delete windowWithSpeech.SpeechRecognition;
    delete windowWithSpeech.webkitSpeechRecognition;
    render(<SoundSignsClient />);

    fireEvent.change(screen.getByLabelText(/Type a sentence/i), {
      target: { value: 'hello' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Confirm and translate/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8122/translate',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ text: 'hello' }),
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('HELLO')).toBeInTheDocument();
    });
  });

  it('shows an honest warning for gloss words with no matching video, never a fabricated clip', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ isl: 'HELLO 👍' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    delete windowWithSpeech.SpeechRecognition;
    delete windowWithSpeech.webkitSpeechRecognition;
    render(<SoundSignsClient />);

    fireEvent.change(screen.getByLabelText(/Type a sentence/i), {
      target: { value: 'hello thumbs up' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Confirm and translate/i }));

    await waitFor(() => {
      expect(screen.getByText(/No video for:/i)).toBeInTheDocument();
    });
  });

  it('shows a friendly error when the backend cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    delete windowWithSpeech.SpeechRecognition;
    delete windowWithSpeech.webkitSpeechRecognition;
    render(<SoundSignsClient />);

    fireEvent.change(screen.getByLabelText(/Type a sentence/i), {
      target: { value: 'hello' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Confirm and translate/i }));

    await waitFor(() => {
      expect(screen.getByText(/Could not reach the SoundSigns translation service/i)).toBeInTheDocument();
    });
  });
});

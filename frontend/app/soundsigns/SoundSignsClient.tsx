'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Send, RotateCcw, Play, Pause, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusMessage } from '@/components/ui/StatusMessage';
import { resolveGlossClips, type GlossClip } from '@/lib/soundsigns/islGlossVideos';

// Same backend used by the original vendored SoundSigns frontend's own
// useSpeechRecognition hook, pinned to the port the soundsigns service
// listens on (now at backend/services/soundsigns/). See
// backend/services/soundsigns/README.md for the full backend contract.
const TRANSLATE_URL =
  (process.env.NEXT_PUBLIC_SOUNDSIGNS_SERVICE_URL ?? 'http://localhost:8122') + '/translate';

type MicState = 'off' | 'listening';
type TranslateState = 'idle' | 'translating' | 'done' | 'error';

interface SpeechRecognitionResultLike {
  resultIndex: number;
  results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechRecognitionResultLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function SoundSignsClient() {
  const [speechSupported, setSpeechSupported] = useState(() =>
    Boolean(getSpeechRecognitionConstructor())
  );
  const [micState, setMicState] = useState<MicState>('off');
  const [liveText, setLiveText] = useState('');
  const [confirmedText, setConfirmedText] = useState('');
  const [typedText, setTypedText] = useState('');
  const [translateState, setTranslateState] = useState<TranslateState>('idle');
  const [gloss, setGloss] = useState('');
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [clips, setClips] = useState<GlossClip[]>([]);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTranscriptRef = useRef('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.();
    };
  }, []);

  const startMic = () => {
    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setMicState('listening');
      finalTranscriptRef.current = '';
      setLiveText('');
    };

    recognition.onerror = () => {
      setMicState('off');
    };

    recognition.onresult = (event: SpeechRecognitionResultLike) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) final += result[0].transcript;
        else interim += result[0].transcript;
      }
      if (final) finalTranscriptRef.current += final;
      setLiveText((finalTranscriptRef.current + interim).trim());
    };

    recognition.onend = () => {
      setMicState('off');
    };

    recognition.start();
  };

  const stopMic = () => {
    recognitionRef.current?.stop?.();
    setMicState('off');
  };

  const translate = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setConfirmedText(trimmed);
    setTranslateState('translating');
    setTranslateError(null);
    setGloss('');
    setClips([]);
    setCurrentClipIndex(0);
    setIsPlayingSequence(false);

    // A free-tier host can take 30-60 seconds to wake a sleeping instance
    // on the first request, so this timeout is generous rather than tight,
    // and the error message below treats a timeout as an honest possibility
    // instead of assuming the service is simply not running.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetch(TRANSLATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Backend error: ${res.status}`);
      const data = await res.json();
      const resultGloss = String(data.isl ?? '').replace(/"/g, '');
      if (!resultGloss) throw new Error('Backend returned no gloss');
      setGloss(resultGloss);
      setClips(resolveGlossClips(resultGloss));
      setTranslateState('done');
    } catch (err) {
      setTranslateState('error');
      const isAbort = err instanceof Error && err.name === 'AbortError';
      setTranslateError(
        isAbort
          ? 'The translation service is taking a long time to respond. If it is waking up from being idle, please try again in a moment.'
          : 'Could not reach the SoundSigns translation service right now. It may be starting up after being idle, or it may not be running. Please try again shortly.'
      );
    } finally {
      clearTimeout(timeout);
    }
  }, []);

  const confirmLiveTranscript = () => {
    if (!liveText.trim()) return;
    stopMic();
    void translate(liveText);
  };

  const confirmTyped = () => {
    if (!typedText.trim()) return;
    void translate(typedText);
  };

  const resetAll = () => {
    stopMic();
    setLiveText('');
    setTypedText('');
    setConfirmedText('');
    setTranslateState('idle');
    setGloss('');
    setTranslateError(null);
    setClips([]);
    setCurrentClipIndex(0);
    setIsPlayingSequence(false);
  };

  const playableClips = clips.filter((c) => c.src);

  const startSequence = () => {
    if (playableClips.length === 0) return;
    setCurrentClipIndex(0);
    setIsPlayingSequence(true);
  };

  const stopSequence = () => {
    setIsPlayingSequence(false);
    videoRef.current?.pause();
  };

  useEffect(() => {
    if (!isPlayingSequence) return;
    const clip = playableClips[currentClipIndex];
    if (!clip || !videoRef.current) {
      setIsPlayingSequence(false);
      return;
    }
    videoRef.current.src = clip.src as string;
    videoRef.current.load();
    videoRef.current.play().catch(() => {
      setIsPlayingSequence(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlayingSequence, currentClipIndex]);

  const handleClipEnded = () => {
    if (!isPlayingSequence) return;
    if (currentClipIndex + 1 < playableClips.length) {
      setCurrentClipIndex((i) => i + 1);
    } else {
      setIsPlayingSequence(false);
    }
  };

  const unresolvedWords = clips.filter((c) => !c.src);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">
        Talk to Sign
      </h1>
      <p className="mt-2 max-w-xl text-sm text-[var(--color-text-muted)]">
        Speak or type a sentence in English, confirm it, and see it translated into ISL
        gloss, then played back as real sign-language video clips.
      </p>

      <Card className="mt-6 flex flex-col items-center gap-4 p-6">
        {speechSupported ? (
          <>
            <div className="flex flex-col items-center gap-2">
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-full ${
                  micState === 'listening'
                    ? 'bg-[var(--color-green-400)] text-white'
                    : 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]'
                }`}
              >
                {micState === 'listening' ? (
                  <Mic size={32} aria-hidden="true" />
                ) : (
                  <MicOff size={32} aria-hidden="true" />
                )}
              </div>
              <p className="text-sm text-[var(--color-text-muted)]" role="status">
                {micState === 'listening' ? 'Listening...' : 'Microphone is off.'}
              </p>
            </div>

            <div className="flex gap-3">
              {micState === 'off' ? (
                <Button onClick={startMic} size="lg">
                  <Mic size={18} aria-hidden="true" />
                  Start Microphone
                </Button>
              ) : (
                <Button variant="secondary" onClick={stopMic} size="lg">
                  <MicOff size={18} aria-hidden="true" />
                  Stop Microphone
                </Button>
              )}
            </div>

            <div className="w-full">
              <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                Live transcript
              </p>
              <div
                className="mt-1 min-h-[56px] w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 text-sm text-[var(--color-text)]"
                role="status"
              >
                {liveText || 'Nothing heard yet. Start the microphone and speak.'}
              </div>
              <div className="mt-2 flex justify-end">
                <Button onClick={confirmLiveTranscript} disabled={!liveText.trim()}>
                  <Send size={16} aria-hidden="true" />
                  Confirm and translate
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full">
            <StatusMessage kind="warning">
              This browser does not support live speech recognition. You can type your
              sentence instead.
            </StatusMessage>
            <label htmlFor="soundsigns-text-input" className="mt-3 block text-xs font-semibold text-[var(--color-text-muted)]">
              Type a sentence
            </label>
            <textarea
              id="soundsigns-text-input"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-sm text-[var(--color-text)]"
            />
            <div className="mt-2 flex justify-end">
              <Button onClick={confirmTyped} disabled={!typedText.trim()}>
                <Send size={16} aria-hidden="true" />
                Confirm and translate
              </Button>
            </div>
          </div>
        )}
      </Card>

      {confirmedText && (
        <Card className="mt-6 p-6">
          <p className="text-xs font-semibold text-[var(--color-text-muted)]">Confirmed text</p>
          <p className="mt-1 text-sm text-[var(--color-text)]">&quot;{confirmedText}&quot;</p>

          {translateState === 'translating' && (
            <div className="mt-3">
              <StatusMessage kind="loading">Translating to ISL gloss...</StatusMessage>
            </div>
          )}

          {translateState === 'error' && (
            <div className="mt-3">
              <StatusMessage kind="warning">
                {translateError ?? 'Translation failed. Please try again.'}
              </StatusMessage>
            </div>
          )}

          {translateState === 'done' && (
            <>
              <div className="mt-4">
                <p className="text-xs font-semibold text-[var(--color-text-muted)]">ISL gloss</p>
                <p className="mt-1 text-lg font-medium text-[var(--color-text)]">{gloss}</p>
              </div>

              {unresolvedWords.length > 0 && (
                <div className="mt-3">
                  <StatusMessage kind="warning">
                    <AlertTriangle size={14} aria-hidden="true" className="mr-1 inline" />
                    No video for: {unresolvedWords.map((w) => w.display).join(', ')}. These
                    will be skipped during playback.
                  </StatusMessage>
                </div>
              )}

              <div className="mt-4">
                <p className="text-xs font-semibold text-[var(--color-text-muted)]">Sequence</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {clips.map((clip, i) => (
                    <span
                      key={`${clip.text}-${i}`}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        !clip.src
                          ? 'bg-[rgba(185,121,42,0.15)] text-[var(--color-warning)]'
                          : isPlayingSequence && playableClips[currentClipIndex]?.text === clip.text && playableClips[currentClipIndex] === playableClips.find((c, pi) => pi === currentClipIndex && c === clip)
                            ? 'bg-[var(--color-green-400)] text-white'
                            : 'bg-[var(--color-surface-muted)] text-[var(--color-text)]'
                      }`}
                    >
                      {clip.display}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-col items-center gap-3">
                <div className="aspect-video w-full max-w-md overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-black">
                  {playableClips.length > 0 ? (
                    <video
                      ref={videoRef}
                      className="h-full w-full object-contain"
                      muted
                      onEnded={handleClipEnded}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-white/70">
                      No video clips available for this gloss.
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  {!isPlayingSequence ? (
                    <Button onClick={startSequence} disabled={playableClips.length === 0}>
                      <Play size={16} aria-hidden="true" />
                      Play sequence
                    </Button>
                  ) : (
                    <Button variant="secondary" onClick={stopSequence}>
                      <Pause size={16} aria-hidden="true" />
                      Pause
                    </Button>
                  )}
                  <Button variant="ghost" onClick={resetAll}>
                    <RotateCcw size={16} aria-hidden="true" />
                    Start over
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}

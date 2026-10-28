'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Camera, CameraOff, Volume2, X, Sparkles, LayoutGrid, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusMessage } from '@/components/ui/StatusMessage';
import { usePreferences } from '@/lib/context/PreferencesContext';
import { DEMO_PREDICTION_SETS, LOW_CONFIDENCE_THRESHOLD, DemoPrediction } from '@/lib/data/childPredictions';
import { requestSentenceSuggestions } from '@/lib/suggestions/requestSuggestions';

type ChildState =
  | 'demo'
  | 'unavailable'
  | 'loading'
  | 'ready'
  | 'capturing'
  | 'low_confidence'
  | 'prediction_pending_confirmation'
  | 'confirmed';

export function ChildModeClient() {
  const { speechEnabled, speechSupported, textLanguage } = usePreferences();
  const [state, setState] = useState<ChildState>('demo');
  const [cameraOn, setCameraOn] = useState(false);
  const [predictions, setPredictions] = useState<DemoPrediction[]>([]);
  const [chosen, setChosen] = useState<DemoPrediction | null>(null);
  const [message, setMessage] = useState<DemoPrediction[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Optional sentence suggestions: never requested automatically, only on
  // explicit tap, and never used for speech until the child/parent reviews
  // and confirms the exact text themselves.
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestNote, setSuggestNote] = useState<string | null>(null);
  const [confirmedSentence, setConfirmedSentence] = useState<string | null>(null);
  const [draftSentence, setDraftSentence] = useState('');

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }, []);

  useEffect(() => {
    return () => {
      // Always stop camera tracks when leaving this screen.
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const startCamera = async () => {
    setState('loading');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOn(true);
      setState('ready');
    } catch {
      // Camera denied or unavailable: fall back gracefully, never break the app.
      setState('unavailable');
      setCameraOn(false);
    }
  };

  const runDemoPrediction = () => {
    setState('capturing');
    setChosen(null);
    window.setTimeout(() => {
      const set =
        DEMO_PREDICTION_SETS[Math.floor(Math.random() * DEMO_PREDICTION_SETS.length)];
      setPredictions(set);
      const top = set[0];
      setState(top.confidence < LOW_CONFIDENCE_THRESHOLD ? 'low_confidence' : 'prediction_pending_confirmation');
    }, 900);
  };

  const confirmPrediction = () => {
    if (!chosen) return;
    setMessage((m) => [...m, chosen]);
    setState('confirmed');
    window.setTimeout(() => setState(cameraOn ? 'ready' : 'demo'), 1200);
  };

  const removeWord = (index: number) => setMessage((m) => m.filter((_, i) => i !== index));
  const clearMessage = () => {
    setMessage([]);
    setSuggestions([]);
    setSuggestNote(null);
    setConfirmedSentence(null);
    setDraftSentence('');
  };

  const speakMessage = () => {
    // Speak is only ever enabled after explicit confirmation into the message list,
    // and is also gated by the Communication Preferences "Speech" setting.
    if (message.length === 0) return;
    if (!speechEnabled) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(message.map((p) => p.label).join('. '));
    window.speechSynthesis.speak(utterance);
  };

  const fetchSuggestions = async () => {
    if (message.length === 0) return;
    setSuggestLoading(true);
    setSuggestNote(null);
    setConfirmedSentence(null);
    // Only the confirmed word labels and the chosen output language are
    // sent, never camera frames, video, or landmark data.
    const words = message.map((p) => p.label);
    const result = await requestSentenceSuggestions(words, textLanguage);
    setSuggestLoading(false);
    if (result.ok && result.suggestions.length > 0) {
      setSuggestions(result.suggestions);
    } else {
      setSuggestions([]);
      setSuggestNote(result.message ?? 'No suggestions available right now.');
    }
  };

  const pickSuggestion = (text: string) => {
    setDraftSentence(text);
  };

  const confirmSentence = () => {
    if (!draftSentence.trim()) return;
    setConfirmedSentence(draftSentence.trim());
  };

  const speakConfirmedSentence = () => {
    if (!confirmedSentence) return;
    if (!speechEnabled) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(confirmedSentence);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">Child Mode</h1>
      <p className="mt-2 max-w-xl text-sm text-[var(--color-text-muted)]">
        Try showing a sign and see what SignBridge guesses. You always get to pick the right
        one before anything is said out loud.
      </p>

      {(state === 'demo' || state === 'ready' || state === 'capturing' || state === 'low_confidence' || state === 'prediction_pending_confirmation' || state === 'confirmed' || state === 'loading') && (
        <div className="mt-3">
          <StatusMessage kind="info">
            <span className="font-semibold">Demo mode:</span> these are sample guesses, not a
            real trained model yet. Nothing from your camera ever leaves your device.
          </StatusMessage>
        </div>
      )}

      <Card className="mt-6 flex flex-col items-center gap-4 p-6">
        <div className="relative flex aspect-video w-full max-w-md items-center justify-center overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)]">
          {cameraOn ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
              aria-label="Camera preview"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-[var(--color-text-muted)]">
              <Camera size={40} aria-hidden="true" />
              <span className="text-sm">Camera is off</span>
            </div>
          )}
          {cameraOn && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-6 rounded-[var(--radius-md)] border-2 border-dashed border-[var(--color-teal-400)]"
            />
          )}
        </div>

        <p className="text-sm text-[var(--color-text-muted)]" role="status">
          {state === 'loading' && 'Asking for camera permission...'}
          {state === 'unavailable' && 'Camera is not available. You can still use Quick Cards below.'}
          {cameraOn && (state === 'ready' || state === 'capturing') && 'Camera is on.'}
          {!cameraOn && state === 'demo' && 'Camera is off. Turn it on, or try a demo guess below.'}
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          {!cameraOn ? (
            <Button onClick={startCamera} size="lg">
              <Camera size={18} aria-hidden="true" />
              Start Camera
            </Button>
          ) : (
            <Button variant="secondary" onClick={stopCamera} size="lg">
              <CameraOff size={18} aria-hidden="true" />
              Stop Camera
            </Button>
          )}
          <Button variant="secondary" onClick={runDemoPrediction} size="lg">
            <Sparkles size={18} aria-hidden="true" />
            Try a demo guess
          </Button>
        </div>

        {state === 'unavailable' && (
          <div className="w-full">
            <StatusMessage kind="warning">
              We could not turn on the camera. Maybe it is being used by another app, or
              permission was not given. That is okay, you can still build a message using{' '}
              <Link href="/cards" className="font-medium underline">
                Quick Cards
              </Link>
              .
            </StatusMessage>
          </div>
        )}

        {state === 'capturing' && (
          <StatusMessage kind="loading">Looking at your sign...</StatusMessage>
        )}

        {(state === 'prediction_pending_confirmation' || state === 'low_confidence') && (
          <div className="w-full">
            {state === 'low_confidence' && (
              <StatusMessage kind="warning">
                We are not very sure about this one. Pick the closest match, or try again.
              </StatusMessage>
            )}
            <p className="mb-2 mt-3 text-sm font-semibold text-[var(--color-text)]">
              Which one did you mean?
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {predictions.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setChosen(p)}
                  aria-pressed={chosen?.id === p.id}
                  className={`min-h-[48px] rounded-[var(--radius-md)] border p-3 text-left transition-colors ${
                    chosen?.id === p.id
                      ? 'border-[var(--color-indigo-500)] bg-[var(--color-surface-muted)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-teal-400)]'
                  }`}
                >
                  <p className="font-medium text-[var(--color-text)]">{p.label}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{p.hi}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {Math.round(p.confidence * 100)}% sure
                  </p>
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="lg" onClick={confirmPrediction} disabled={!chosen}>
                Confirm
              </Button>
              <Button size="lg" variant="secondary" onClick={runDemoPrediction}>
                Try Again
              </Button>
              <Button size="lg" variant="ghost" onClick={() => setChosen(null)}>
                Choose Another
              </Button>
            </div>
          </div>
        )}

        {state === 'confirmed' && (
          <StatusMessage kind="success">Added to your message!</StatusMessage>
        )}
      </Card>

      <Card className="mt-6 p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Your message</h2>
          <Link
            href="/cards"
            className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-teal-600)]"
          >
            <LayoutGrid size={16} aria-hidden="true" />
            Browse Quick Cards
          </Link>
        </div>
        {message.length === 0 ? (
          <StatusMessage kind="empty">
            Nothing here yet. Confirm a sign above to add it to your message.
          </StatusMessage>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {message.map((p, i) => (
              <button
                key={`${p.id}-${i}`}
                onClick={() => removeWord(i)}
                aria-label={`Remove ${p.label}`}
                className="inline-flex min-h-[36px] items-center gap-1 rounded-full bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text)]"
              >
                {p.label} <X size={14} aria-hidden="true" />
              </button>
            ))}
            <div className="ml-auto flex gap-2">
              <Button
                onClick={speakMessage}
                disabled={!speechSupported || !speechEnabled}
                title={
                  !speechSupported
                    ? 'Speech is not supported in this browser'
                    : !speechEnabled
                      ? 'Speech is turned off in Communication Preferences'
                      : undefined
                }
              >
                <Volume2 size={16} aria-hidden="true" />
                Speak
              </Button>
              <Button variant="secondary" onClick={clearMessage}>
                Clear
              </Button>
            </div>
          </div>
        )}

        {message.length > 0 && (
          <div className="mt-4 border-t border-[var(--color-border)] pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[var(--color-text)]">
                Need a full sentence?
              </p>
              <Button
                size="md"
                variant="secondary"
                onClick={fetchSuggestions}
                disabled={suggestLoading}
              >
                <Wand2 size={16} aria-hidden="true" />
                {suggestLoading ? 'Thinking...' : 'Suggest a sentence'}
              </Button>
            </div>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              This is optional and works only if the backend is running. Suggestions are
              AI-generated ideas, not verified ISL translations, always review and edit before
              using them.
            </p>

            {suggestNote && (
              <div className="mt-2">
                <StatusMessage kind="info">{suggestNote}</StatusMessage>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  AI-generated suggestions, pick one to edit
                </span>
                {suggestions.map((text, i) => (
                  <button
                    key={i}
                    onClick={() => pickSuggestion(text)}
                    className="min-h-[44px] rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 text-left text-sm text-[var(--color-text)] hover:border-[var(--color-teal-400)]"
                  >
                    {text}
                  </button>
                ))}
              </div>
            )}

            {(draftSentence || suggestions.length > 0) && (
              <div className="mt-3">
                <label htmlFor="sentence-draft" className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Edit before using
                </label>
                <textarea
                  id="sentence-draft"
                  value={draftSentence}
                  onChange={(e) => setDraftSentence(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-sm text-[var(--color-text)]"
                />
                <div className="mt-2 flex gap-2">
                  <Button size="md" onClick={confirmSentence} disabled={!draftSentence.trim()}>
                    Confirm sentence
                  </Button>
                </div>
              </div>
            )}

            {confirmedSentence && (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3">
                <span data-testid="confirmed-sentence" className="text-sm text-[var(--color-text)]">
                  &quot;{confirmedSentence}&quot;
                </span>
                <Button
                  size="md"
                  onClick={speakConfirmedSentence}
                  disabled={!speechSupported || !speechEnabled}
                >
                  <Volume2 size={16} aria-hidden="true" />
                  Speak
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
